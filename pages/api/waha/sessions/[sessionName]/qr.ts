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
            headers,
          })
          
          if (getResponse.ok) {
            const getQrData = await getResponse.json()
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
          }
        } catch (getError) {
          console.error('❌ Erro ao tentar GET:', getError)
        }
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage || `Erro ${response.status} ao buscar QR code. Verifique se a sessão existe e se a URL da API WAHA está correta.`
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

