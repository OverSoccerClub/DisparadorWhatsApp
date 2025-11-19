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

    // Buscar QR code da sessão WAHA
    // WAHA API endpoint: POST /api/{session}/auth/qr
    const response = await fetch(`${effectiveApiUrl}/api/${sessionName}/auth/qr`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`❌ Erro ao buscar QR code da sessão ${sessionName}:`, response.status, errorText)
      return res.status(response.status).json({
        success: false,
        error: `Erro ao buscar QR code: ${response.status}${errorText ? ` - ${errorText.substring(0, 100)}` : ''}`
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

