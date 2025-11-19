import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Buscar servidores WAHA do usuário
    const { data: servers, error } = await supabase
      .from('waha_servers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar servidores WAHA:', error)
      return res.status(500).json({ success: false, error: 'Erro ao buscar servidores' })
    }

    // Formatar servidores para o formato esperado pelo componente
    const formattedServers = (servers || []).map((server: any) => ({
      id: server.id,
      name: server.nome,
      apiUrl: server.api_url,
      apiKey: server.api_key,
      webhookUrl: server.webhook_url,
      webhookSecret: server.webhook_secret,
      timeout: server.timeout || 30,
      retryAttempts: server.retry_attempts || 3,
      rateLimit: server.rate_limit || 100,
      enableAutoReconnect: server.enable_auto_reconnect ?? true,
      enableQrCode: server.enable_qr_code ?? true,
      enablePresence: server.enable_presence ?? true,
      ativo: server.ativo ?? true,
      status: {
        connected: false,
        lastTest: null,
        responseTime: null,
        errors: 0,
        instances: 0,
        activeConnections: 0
      },
      createdAt: server.created_at,
      updatedAt: server.updated_at
    }))

    return res.status(200).json({
      success: true,
      servers: formattedServers
    })
  } catch (error) {
    console.error('Erro ao listar servidores WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

