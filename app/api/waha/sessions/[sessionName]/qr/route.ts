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
        console.log(`📊 Sessão ${sessionName} encontrada com status: ${sessionStatus}`)
        
        // Se a sessão está parada ou falhou, tentar reiniciar antes de gerar QR
        if (['STOPPED', 'FAILED'].includes(sessionStatus)) {
          console.log(`🔄 Sessão ${sessionName} está ${sessionStatus}, reiniciando...`)
          
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
              console.log(`✅ Sessão ${sessionName} reiniciada, aguardando inicialização...`)
              // Aguardar mais tempo para garantir que a sessão está pronta
              await new Promise(resolve => setTimeout(resolve, 5000))
            } else {
              const restartError = await restartResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
              console.warn(`⚠️ Falha ao reiniciar sessão:`, restartError)
            }
          } catch (restartError) {
            console.warn(`⚠️ Erro ao reiniciar sessão ${sessionName}:`, restartError)
          }
        }
      } else if (statusResponse.status === 404) {
        // Sessão não existe, criar ela
        console.log(`📝 Sessão ${sessionName} não existe, criando...`)
        sessionExists = false
      } else {
        const errorData = await statusResponse.json().catch(() => ({}))
        console.warn(`⚠️ Erro ao verificar sessão (${statusResponse.status}):`, errorData)
      }
    } catch (statusError) {
      console.warn(`⚠️ Erro ao verificar status da sessão ${sessionName}:`, statusError)
      // Se for erro de conexão, tentar criar a sessão mesmo assim
      if (statusError instanceof Error && statusError.name !== 'TimeoutError') {
        sessionExists = false
      }
    }

    // Se a sessão não existe, criar ela primeiro
    if (!sessionExists) {
      console.log(`🆕 Criando sessão ${sessionName}...`)
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
          console.error(`❌ Erro ao criar sessão:`, createError)
          return NextResponse.json({
            success: false,
            error: `Não foi possível criar a sessão. Detalhes: ${createError.message || createError.error || 'Erro desconhecido'}`
          }, { status: createResponse.status })
        }

        const createdSession = await createResponse.json()
        console.log(`✅ Sessão ${sessionName} criada com sucesso`)
        
        // Aguardar um tempo para a sessão inicializar completamente antes de gerar QR
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (createError) {
        console.error(`❌ Erro ao criar sessão ${sessionName}:`, createError)
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
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} de obter QR code para ${sessionName}...`)
        
        const qrResponse = await fetch(`${config.apiUrl}/api/${sessionName}/auth/qr`, {
          headers: {
            'X-Api-Key': config.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(20000) // 20 segundos de timeout
        })

        if (qrResponse.ok) {
          const contentType = qrResponse.headers.get('content-type') || ''
          console.log(`📋 Content-Type recebido: ${contentType}`)
          console.log(`📋 Status HTTP: ${qrResponse.status}`)
          
          // IMPORTANTE: Verificar o formato ANTES de processar
          // Caso 1: WAHA retorna imagem (ex: image/png, image/svg+xml)
          if (contentType.includes('image/')) {
            console.log(`🖼️ Processando QR Code como imagem (${contentType})...`)
            const arrayBuffer = await qrResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString('base64')
            const mime = contentType.split(';')[0].trim()
            
            // Garantir que o MIME type está correto (PNG é mais comum para QR codes)
            const finalMime = mime || 'image/png'
            qrCode = `data:${finalMime};base64,${base64}`
            
            console.log(`✅ QR Code obtido (imagem): ${finalMime}, tamanho base64: ${base64.length} chars, primeiro 100 chars: ${qrCode.substring(0, 100)}...`)
            break
          }
          
          // Caso 2: WAHA retorna JSON com campo qr
          if (contentType.includes('application/json')) {
            console.log(`📄 Processando QR Code como JSON...`)
            const data = await qrResponse.json()
            console.log(`📄 JSON recebido:`, JSON.stringify(data).substring(0, 200))
            
            if (data.qr) {
              qrCode = data.qr
              // Validar se já é um data URL ou se precisa converter
              if (!qrCode.startsWith('data:')) {
                console.warn(`⚠️ QR code do JSON não é data URL, tentando usar como está...`)
              }
              console.log(`✅ QR Code obtido (JSON): tamanho: ${qrCode.length} chars, primeiro 100 chars: ${qrCode.substring(0, 100)}...`)
              break
            } else {
              lastError = 'QR Code não encontrado na resposta JSON'
              console.error(`❌ Campo 'qr' não encontrado no JSON:`, Object.keys(data))
            }
          } else {
            // Caso 3: texto simples (pode ser data URL ou string do QR code)
            console.log(`📝 Processando QR Code como texto...`)
            const text = await qrResponse.text()
            console.log(`📝 Texto recebido, tamanho: ${text.length} chars, primeiro 200 chars: ${text.substring(0, 200)}...`)
            
            if (text && text.trim().length > 0) {
              qrCode = text.trim()
              
              // Se não começa com 'data:', pode ser que precise ser convertido
              // Mas geralmente WAHA já retorna como data URL
              if (!qrCode.startsWith('data:')) {
                console.warn(`⚠️ QR code texto não começa com 'data:', pode ser string do QR code`)
                // Tentar usar como está - pode ser que o frontend converta
              }
              
              console.log(`✅ QR Code obtido (texto): tamanho: ${qrCode.length} chars, primeiro 100 chars: ${qrCode.substring(0, 100)}...`)
              break
            } else {
              lastError = 'QR Code vazio na resposta'
              console.error(`❌ Texto vazio ou inválido`)
            }
          }
        } else {
          const errorData = await qrResponse.json().catch(() => ({}))
          lastError = errorData.message || errorData.error || `HTTP ${qrResponse.status}: ${qrResponse.statusText}`
          
          // Se for erro 404 ou 400, pode ser que a sessão precise de mais tempo
          if ((qrResponse.status === 404 || qrResponse.status === 400) && attempt < maxRetries) {
            console.log(`⏳ QR Code ainda não disponível (${lastError}), aguardando antes de tentar novamente...`)
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt)) // Backoff exponencial
            continue
          }
          
          // Se for outro erro ou última tentativa, retornar erro
          if (attempt === maxRetries) {
            return NextResponse.json({
              success: false,
              error: `Não foi possível obter QR Code após ${maxRetries} tentativas. Detalhes: ${lastError}`
            }, { status: qrResponse.status })
          }
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : String(fetchError)
        
        // Se for timeout ou abort, e ainda temos tentativas, aguardar e tentar novamente
        if ((fetchError instanceof Error && (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError')) && attempt < maxRetries) {
          console.log(`⏳ Timeout ao obter QR Code, aguardando antes de tentar novamente...`)
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt))
          continue
        }
        
        // Se for última tentativa, retornar erro
        if (attempt === maxRetries) {
          return NextResponse.json({
            success: false,
            error: `Erro ao obter QR Code após ${maxRetries} tentativas: ${lastError}`
          }, { status: 500 })
        }
      }
    }

    // Se chegou aqui e não obteve QR code, retornar erro
    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: `Não foi possível obter QR Code após ${maxRetries} tentativas. Último erro: ${lastError || 'Erro desconhecido'}`
      }, { status: 500 })
    }

    // Validar se o QR code obtido é válido
    if (!qrCode || (typeof qrCode === 'string' && qrCode.trim().length < 50)) {
      console.error(`❌ QR Code inválido:`, {
        exists: !!qrCode,
        type: typeof qrCode,
        length: typeof qrCode === 'string' ? qrCode.length : 0,
        preview: typeof qrCode === 'string' ? qrCode.substring(0, 100) : 'N/A'
      })
      return NextResponse.json({
        success: false,
        error: 'QR Code inválido recebido. A sessão pode não estar pronta para autenticação.'
      }, { status: 400 })
    }

    // Log final para debug
    console.log(`🎯 QR Code final validado:`, {
      type: typeof qrCode,
      length: qrCode.length,
      startsWithData: qrCode.startsWith('data:'),
      preview: qrCode.substring(0, 150)
    })

    // Retornar QR code válido SEM modificações
    return NextResponse.json({ success: true, qr: qrCode })
  } catch (error) {
    console.error('Erro ao obter QR Code:', error)
    
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
