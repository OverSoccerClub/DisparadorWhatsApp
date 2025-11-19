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
    const { serverId, apiUrl, apiKey } = req.body || req.query

    if (!sessionName || typeof sessionName !== 'string') {
      return res.status(400).json({ success: false, error: 'Nome da sessão é obrigatório' })
    }

    if (!serverId || !apiUrl) {
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
        } else if (errorText) {
          errorMessage = errorText.substring(0, 200)
        }
      } catch {
        if (errorText) {
          errorMessage = errorText.substring(0, 200)
        }
      }
      
      console.error(`❌ Erro ao buscar QR code da sessão ${normalizedSessionName}:`, response.status, errorMessage)
      
      // Se a sessão não existe, tentar iniciar ela primeiro
      if (response.status === 404 && !sessionExists) {
        console.log(`🔄 Tentando iniciar sessão ${normalizedSessionName}...`)
        try {
          const startResponse = await fetch(`${normalizedApiUrl}/api/${encodeURIComponent(normalizedSessionName)}/start`, {
            method: 'POST',
            headers,
          })
          
          if (startResponse.ok) {
            console.log(`✅ Sessão ${normalizedSessionName} iniciada, tentando buscar QR code novamente...`)
            // Tentar buscar QR code novamente após iniciar
            const retryResponse = await fetch(qrUrl, {
              method: 'POST',
              headers,
            })
            
            if (retryResponse.ok) {
              const retryQrData = await retryResponse.json()
              let qrCodeValue = null
              if (typeof retryQrData === 'string') {
                qrCodeValue = retryQrData
              } else if (retryQrData.qr) {
                qrCodeValue = retryQrData.qr
              } else if (retryQrData.qrCode) {
                qrCodeValue = retryQrData.qrCode
              } else if (retryQrData.data) {
                qrCodeValue = retryQrData.data
              }
              
              if (qrCodeValue) {
                return res.status(200).json({
                  success: true,
                  qrCode: qrCodeValue,
                  sessionName: normalizedSessionName,
                  serverId
                })
              }
            }
          }
        } catch (startError) {
          console.error('❌ Erro ao tentar iniciar sessão:', startError)
        }
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage
      })
    }

    const qrData = await response.json()
    
    // WAHA pode retornar o QR code em diferentes formatos
    // Pode ser: { qr: "data:image/png;base64,..." } ou { qrCode: "..." } ou diretamente a string
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
    
    if (!qrCodeValue) {
      console.error('❌ Formato de QR code não reconhecido:', qrData)
      return res.status(500).json({
        success: false,
        error: 'Formato de QR code não reconhecido pela API WAHA'
      })
    }
    
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

