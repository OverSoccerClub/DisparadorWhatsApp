import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
          },
          remove(name: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    const { sessionName } = req.query
    const body = req.method === 'POST' ? req.body : {}
    const { serverId, apiUrl, apiKey } = body

    console.log('📋 [QR Code API] Recebida requisição:', {
      method: req.method,
      sessionName,
      query: req.query,
      body: body ? Object.keys(body) : 'empty',
      serverId: !!serverId,
      apiUrl: !!apiUrl
    })

    // Validar sessionName
    if (!sessionName || typeof sessionName !== 'string') {
      console.error('❌ [QR Code API] sessionName inválido:', sessionName, typeof sessionName)
      return res.status(400).json({ success: false, error: 'Nome da sessão é obrigatório' })
    }

    if (!serverId || !apiUrl) {
      console.error('❌ [QR Code API] Parâmetros faltando:', { serverId: !!serverId, apiUrl: !!apiUrl })
      return res.status(400).json({ success: false, error: 'ID do servidor e URL da API são obrigatórios' })
    }

    // Buscar informações do servidor no Supabase
    const { data: server, error: serverError } = await supabase
      .from('waha_servers')
      .select('api_url, api_key')
      .eq('id', serverId)
      .eq('user_id', user.id)
      .single()

    if (serverError || !server) {
      return res.status(404).json({ success: false, error: 'Servidor não encontrado' })
    }

    const effectiveApiUrl = apiUrl || server.api_url
    const effectiveApiKey = apiKey || server.api_key

    // Preparar headers de autenticação
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (effectiveApiKey && effectiveApiKey.trim() !== '') {
      headers['X-Api-Key'] = effectiveApiKey.trim()
      headers['Authorization'] = `Bearer ${effectiveApiKey.trim()}`
    }

    // Normalizar URL (remover barra final se houver)
    const normalizedApiUrl = effectiveApiUrl.trim().replace(/\/+$/, '')
    const normalizedSessionName = sessionName.trim()
    
    // WAHA API endpoint: POST /api/{session}/auth/qr
    // Mas primeiro, verificar se a sessão existe e obter seu status
    console.log(`🔍 Verificando sessão ${normalizedSessionName} no servidor ${normalizedApiUrl}`)
    
    // Tentar obter informações da sessão primeiro
    const sessionInfoResponse = await fetch(`${normalizedApiUrl}/api/sessions`, {
      method: 'GET',
      headers,
    })
    
    let sessionExists = false
    if (sessionInfoResponse.ok) {
      const sessionsList = await sessionInfoResponse.json()
      if (Array.isArray(sessionsList)) {
        sessionExists = sessionsList.some((s: any) => s.name === normalizedSessionName)
        console.log(`📋 Sessão ${normalizedSessionName} ${sessionExists ? 'encontrada' : 'não encontrada'} na lista`)
      }
    }
    
    // Se a sessão não existe, tentar criar/iniciar ela primeiro
    if (!sessionExists) {
      console.log(`🔄 Sessão ${normalizedSessionName} não encontrada, tentando criar/iniciar...`)
      try {
        // Tentar criar a sessão primeiro
        const createResponse = await fetch(`${normalizedApiUrl}/api/${encodeURIComponent(normalizedSessionName)}`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
        
        if (!createResponse.ok && createResponse.status !== 409) {
          // 409 = sessão já existe, isso é OK
          const createErrorText = await createResponse.text().catch(() => '')
          console.log(`⚠️ Não foi possível criar sessão (pode já existir): ${createResponse.status} - ${createErrorText.substring(0, 100)}`)
        }
        
        // Tentar iniciar a sessão
        const startResponse = await fetch(`${normalizedApiUrl}/api/${encodeURIComponent(normalizedSessionName)}/start`, {
          method: 'POST',
          headers,
        })
        
        if (startResponse.ok) {
          console.log(`✅ Sessão ${normalizedSessionName} iniciada com sucesso`)
          // Aguardar um pouco para a sessão inicializar
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          const startErrorText = await startResponse.text().catch(() => '')
          console.log(`⚠️ Não foi possível iniciar sessão: ${startResponse.status} - ${startErrorText.substring(0, 100)}`)
        }
      } catch (startError) {
        console.error('❌ Erro ao tentar criar/iniciar sessão:', startError)
      }
    }
    
    // Buscar QR code da sessão WAHA
    const qrUrl = `${normalizedApiUrl}/api/${encodeURIComponent(normalizedSessionName)}/auth/qr`
    console.log(`📱 Buscando QR code em: ${qrUrl}`)
    
    const response = await fetch(qrUrl, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorMessage = `Erro ao buscar QR code: ${response.status}`
      
      try {
        const errorData = errorText ? JSON.parse(errorText) : null
        if (errorData?.message) {
          errorMessage = errorData.message
        } else if (errorData?.error) {
          errorMessage = errorData.error
        } else if (errorText && !errorText.startsWith('<!DOCTYPE')) {
          errorMessage = errorText.substring(0, 200)
        }
      } catch {
        if (errorText && !errorText.startsWith('<!DOCTYPE')) {
          errorMessage = errorText.substring(0, 200)
        }
      }
      
      console.error(`❌ Erro ao buscar QR code da sessão ${normalizedSessionName}:`, response.status, errorMessage)
      console.error(`❌ URL tentada: ${qrUrl}`)
      console.error(`❌ API URL base: ${normalizedApiUrl}`)
      
      // Se ainda for 404, tentar método alternativo (GET ao invés de POST)
      if (response.status === 404) {
        console.log(`🔄 Tentando método GET como alternativa...`)
        try {
          const getResponse = await fetch(`${normalizedApiUrl}/api/${encodeURIComponent(normalizedSessionName)}/auth/qr`, {
            method: 'GET',
            headers: {
              ...headers,
              'Accept': 'application/json,image/png,*/*'
            },
          })
          
          if (getResponse.ok) {
            // SEMPRE ler como arrayBuffer primeiro (nunca usar .json() diretamente)
            const arrayBuffer = await getResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const contentType = getResponse.headers.get('content-type') || ''
            
            console.log(`📦 Content-Type recebido: ${contentType}, tamanho: ${buffer.length} bytes`)
            
            // Verificar se é PNG pelos bytes mágicos (89 50 4E 47 = PNG)
            const isPng = buffer.length >= 4 && 
              buffer[0] === 0x89 && 
              buffer[1] === 0x50 && 
              buffer[2] === 0x4E && 
              buffer[3] === 0x47
            
            // Se for PNG (por bytes ou content-type), tratar como imagem
            if (isPng || contentType.includes('image/')) {
              const base64 = buffer.toString('base64')
              const mimeType = contentType.includes('image/') 
                ? contentType.split(';')[0] 
                : 'image/png'
              const qrCodeValue = `data:${mimeType};base64,${base64}`
              
              console.log(`✅ QR code PNG detectado e convertido para base64 (${base64.length} chars)`)
              
              return res.status(200).json({
                success: true,
                qrCode: qrCodeValue,
                sessionName: normalizedSessionName,
                serverId
              })
            }
            
            // Se for claramente JSON (content-type E não é PNG), tentar parsear
            // MAS só se não for PNG pelos bytes mágicos (proteção extra)
            if (contentType.includes('application/json') && !isPng) {
              try {
                const text = buffer.toString('utf-8')
                // Verificar se começa com { ou [ (JSON válido) E não contém caracteres binários
                const trimmed = text.trim()
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  // Verificação extra: garantir que não é binário disfarçado
                  const hasBinaryChars = /[\x00-\x08\x0E-\x1F]/.test(text)
                  if (!hasBinaryChars) {
                    const getQrData = JSON.parse(text)
                    let qrCodeValue = null
                    if (typeof getQrData === 'string') {
                      qrCodeValue = getQrData
                    } else if (getQrData.qr) {
                      qrCodeValue = getQrData.qr
                    } else if (getQrData.qrCode) {
                      qrCodeValue = getQrData.qrCode
                    } else if (getQrData.data) {
                      qrCodeValue = getQrData.data
                    }
                    
                    if (qrCodeValue) {
                      return res.status(200).json({
                        success: true,
                        qrCode: qrCodeValue,
                        sessionName: normalizedSessionName,
                        serverId
                      })
                    }
                  } else {
                    console.log('⚠️ Detectado caracteres binários, tratando como PNG...')
                  }
                }
              } catch (jsonError) {
                console.log('⚠️ Falha ao parsear JSON, tratando como PNG...')
              }
            }
            
            // Fallback: tratar como PNG binário (mais seguro para WAHA)
            const base64 = buffer.toString('base64')
            const qrCodeValue = `data:image/png;base64,${base64}`
            
            console.log(`✅ QR code tratado como PNG (fallback, ${base64.length} chars)`)
            
            return res.status(200).json({
              success: true,
              qrCode: qrCodeValue,
              sessionName: normalizedSessionName,
              serverId
            })
          }
        } catch (getError: any) {
          console.error('❌ Erro ao tentar GET:', getError)
          console.error('❌ Stack:', getError?.stack)
          // Não propagar o erro, deixar o fluxo continuar para retornar o erro 404 original
        }
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage || `Erro ${response.status} ao buscar QR code. Verifique se a sessão existe e se a URL da API WAHA está correta.`
      })
    }

    // Quando POST funciona, SEMPRE ler como arrayBuffer primeiro (nunca usar .json() diretamente)
    const contentType = response.headers.get('content-type') || ''
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`📦 POST Content-Type: ${contentType}, tamanho: ${buffer.length} bytes`)
    
    // Se for claramente JSON, tentar parsear
    if (contentType.includes('application/json')) {
      try {
        const text = buffer.toString('utf-8')
        const trimmed = text.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const qrData = JSON.parse(text)
          
          // WAHA pode retornar o QR code em diferentes formatos
          let qrCodeValue = null
          if (typeof qrData === 'string') {
            qrCodeValue = qrData
          } else if (qrData.qr) {
            qrCodeValue = qrData.qr
          } else if (qrData.qrCode) {
            qrCodeValue = qrData.qrCode
          } else if (qrData.data) {
            qrCodeValue = qrData.data
          }
          
          if (qrCodeValue) {
            return res.status(200).json({
              success: true,
              qrCode: qrCodeValue,
              sessionName,
              serverId
            })
          }
        }
      } catch (jsonError) {
        console.log('⚠️ POST falhou ao parsear JSON, tratando como PNG...')
      }
    }
    
    // Para qualquer outro caso (imagem, vazio, ou desconhecido), tratar como PNG binário
    const base64 = buffer.toString('base64')
    const mimeType = contentType.includes('image/') 
      ? contentType.split(';')[0] 
      : 'image/png'
    const qrCodeValue = `data:${mimeType};base64,${base64}`
    
    console.log(`✅ POST QR code convertido para base64 (${base64.length} chars)`)
    
    return res.status(200).json({
      success: true,
      qrCode: qrCodeValue,
      sessionName,
      serverId
    })
  } catch (error) {
    console.error('Erro ao buscar QR code da sessão WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

