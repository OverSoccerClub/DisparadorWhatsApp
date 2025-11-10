import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getWahaConfigForUser(serverId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('waha_servers')
    .select('api_url, api_key')
    .eq('user_id', user.id)
    .eq('id', serverId)
    .single()

  if (error || !data) throw new Error('Servidor WAHA não encontrado para este usuário')

  return { apiUrl: data.api_url, apiKey: data.api_key || '' }
}

// GET - Obter QR Code de uma sessão
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionName: string } }
) {
  try {
    const url = new URL(request.url)
    const serverId = url.searchParams.get('serverId') || ''
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'serverId é obrigatório' }, { status: 400 })
    }

    const config = await getWahaConfigForUser(serverId)
    const resolvedParams = params instanceof Promise ? await params : params
    const sessionName = resolvedParams.sessionName

    // Primeiro, verificar se a sessão existe e seu status
    let sessionExists = false
    let sessionStatus = ''
    
    try {
      const statusResponse = await fetch(`${config.apiUrl}/api/sessions/${sessionName}`, {
        headers: {
          'X-Api-Key': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      })

      if (statusResponse.ok) {
        sessionExists = true
        const sessionData = await statusResponse.json()
        sessionStatus = (sessionData.status || '').toUpperCase()
        
        // Se a sessão está parada ou falhou, tentar reiniciar antes de gerar QR
        if (['STOPPED', 'FAILED'].includes(sessionStatus)) {
          try {
            const restartResponse = await fetch(`${config.apiUrl}/api/${sessionName}/restart`, {
              method: 'POST',
              headers: {
                'X-Api-Key': config.apiKey,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(15000) // 15 segundos de timeout
            })
            
            if (restartResponse.ok) {
              // Aguardar mais tempo para garantir que a sessão está pronta
              await new Promise(resolve => setTimeout(resolve, 5000))
            }
          } catch (restartError) {
            // Silenciar erro de restart - continuar tentando gerar QR
          }
        }
      } else if (statusResponse.status === 404) {
        // Sessão não existe, criar ela
        sessionExists = false
      }
    } catch (statusError) {
      // Silenciar erros de verificação - tentar criar a sessão mesmo assim
      if (statusError instanceof Error && statusError.name !== 'TimeoutError') {
        sessionExists = false
      }
    }

    // Se a sessão não existe, criar ela primeiro
    if (!sessionExists) {
      try {
        const createResponse = await fetch(`${config.apiUrl}/api/sessions/${sessionName}`, {
          method: 'POST',
          headers: {
            'X-Api-Key': config.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(20000) // 20 segundos de timeout
        })

        if (!createResponse.ok) {
          const createError = await createResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
          return NextResponse.json({
            success: false,
            error: `Não foi possível criar a sessão. Detalhes: ${createError.message || createError.error || 'Erro desconhecido'}`
          }, { status: createResponse.status })
        }

        // Aguardar um tempo para a sessão inicializar completamente antes de gerar QR
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (createError) {
        return NextResponse.json({
          success: false,
          error: `Erro ao criar sessão: ${createError instanceof Error ? createError.message : String(createError)}`
        }, { status: 500 })
      }
    }

    // Tentar obter o QR code com retry (máximo 3 tentativas)
    let qrCode = null
    let lastError = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const qrResponse = await fetch(`${config.apiUrl}/api/${sessionName}/auth/qr`, {
          headers: {
            'X-Api-Key': config.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(20000) // 20 segundos de timeout
        })

        if (qrResponse.ok) {
          const contentType = qrResponse.headers.get('content-type') || ''
          
          // Caso 1: WAHA retorna imagem (ex: image/png, image/svg+xml)
          if (contentType.includes('image/')) {
            const arrayBuffer = await qrResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString('base64')
            const mime = contentType.split(';')[0].trim()
            const finalMime = mime || 'image/png'
            qrCode = `data:${finalMime};base64,${base64}`
            break
          }
          
          // Caso 2: WAHA retorna JSON com campo qr
          if (contentType.includes('application/json')) {
            const data = await qrResponse.json()
            
            if (data.qr) {
              qrCode = data.qr
              break
            } else {
              lastError = 'QR Code não encontrado na resposta JSON'
            }
          } else {
            // Caso 3: texto simples (pode ser data URL ou string do QR code)
            const text = await qrResponse.text()
            
            if (text && text.trim().length > 0) {
              qrCode = text.trim()
              break
            } else {
              lastError = 'QR Code vazio na resposta'
            }
          }
        } else {
          const errorData = await qrResponse.json().catch(() => ({}))
          lastError = errorData.message || errorData.error || `HTTP ${qrResponse.status}: ${qrResponse.statusText}`
          
          // Se for erro 404 ou 400, pode ser que a sessão precise de mais tempo
          if ((qrResponse.status === 404 || qrResponse.status === 400) && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt)) // Backoff exponencial
            continue
          }
          
          // Se for outro erro ou última tentativa, retornar erro
          if (attempt === maxRetries) {
            return NextResponse.json({
              success: false,
              error: `Não foi possível obter QR Code após ${maxRetries} tentativas.`
            }, { status: qrResponse.status })
          }
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : String(fetchError)
        
        // Se for timeout ou abort, e ainda temos tentativas, aguardar e tentar novamente
        if ((fetchError instanceof Error && (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError')) && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt))
          continue
        }
        
        // Se for última tentativa, retornar erro
        if (attempt === maxRetries) {
          return NextResponse.json({
            success: false,
            error: `Erro ao obter QR Code após ${maxRetries} tentativas.`
          }, { status: 500 })
        }
      }
    }

    // Se chegou aqui e não obteve QR code, retornar erro
    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: `Não foi possível obter QR Code após ${maxRetries} tentativas. Tente novamente.`
      }, { status: 500 })
    }

    // Validar se o QR code obtido é válido
    if (!qrCode || (typeof qrCode === 'string' && qrCode.trim().length < 50)) {
      return NextResponse.json({
        success: false,
        error: 'QR Code inválido recebido. A sessão pode não estar pronta para autenticação.'
      }, { status: 400 })
    }

    // Retornar QR code válido SEM modificações
    return NextResponse.json({ success: true, qr: qrCode })
  } catch (error) {
    console.error('[QR] Erro ao obter QR Code:', error)
    
    // Tratamento específico para timeout
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({
        success: false,
        error: 'Timeout ao obter QR Code. A sessão pode estar demorando para iniciar. Tente reiniciar a sessão.'
      }, { status: 504 })
    }
    
    // Tratamento para abort signal
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Requisição cancelada. O servidor WAHA pode estar sem resposta. Verifique se o servidor está online.'
      }, { status: 408 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter QR Code: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
