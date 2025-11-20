import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { WahaQrService } from '@/lib/waha/qr-service'

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
    const body = req.method === 'POST' ? req.body : req.query
    const parseParam = (value: unknown) => {
      if (typeof value === 'string') return value
      if (Array.isArray(value)) return value[0]
      return undefined
    }
    const serverId = parseParam(body?.serverId)
    const apiUrl = parseParam(body?.apiUrl)
    const apiKey = parseParam(body?.apiKey)

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

    if (!serverId) {
      console.error('❌ [QR Code API] Parâmetro serverId faltando')
      return res.status(400).json({ success: false, error: 'ID do servidor é obrigatório' })
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

    const effectiveApiUrl = (apiUrl || server.api_url || '').trim()
    const effectiveApiKey = (apiKey || server.api_key || '')?.trim()
    if (!effectiveApiUrl) {
      return res.status(400).json({ success: false, error: 'URL da API WAHA não encontrada' })
    }

    const normalizedSessionName = sessionName.trim()
    const qrService = new WahaQrService(
      {
        baseUrl: effectiveApiUrl,
        apiKey: effectiveApiKey,
      },
      console
    )

    try {
      const qrResult = await qrService.fetchQrCode(normalizedSessionName)
      return res.status(200).json({
        success: true,
        qrCode: qrResult.qrCode,
        sessionName: normalizedSessionName,
        serverId,
        method: qrResult.method,
        contentType: qrResult.contentType,
        source: qrResult.source
      })
    } catch (serviceError: any) {
      console.error('❌ [QR Code API] Falha ao obter QR:', serviceError)
      if (serviceError instanceof Error) {
        return res.status(502).json({
          success: false,
          error: serviceError.message
        })
      }
      return res.status(502).json({
        success: false,
        error: 'Falha ao obter QR code na WAHA API'
      })
    }
  } catch (error) {
    console.error('Erro ao buscar QR code da sessão WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

