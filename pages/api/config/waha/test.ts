import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { buildWahaHeaders, normalizeApiUrl } from '@/lib/server/waha-config-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { apiUrl, apiKey, serverId } = req.body || {}
  if (!apiUrl && !serverId) {
    return res.status(400).json({ success: false, error: 'Informe apiUrl ou serverId para testar' })
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: makeCookieAdapter(req, res)
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    let finalUrl = apiUrl
    let finalKey = apiKey
    let timeoutSeconds = 30

    if (serverId) {
      const { data, error } = await supabase
        .from('waha_servers')
        .select('*')
        .eq('id', serverId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return res.status(404).json({ success: false, error: 'Servidor WAHA não encontrado' })
      }

      finalUrl = data.api_url
      finalKey = data.api_key
      timeoutSeconds = data.timeout ?? timeoutSeconds
    }

    const normalizedUrl = normalizeApiUrl(finalUrl)
    if (!normalizedUrl) {
      return res.status(400).json({ success: false, error: 'URL inválida' })
    }

    const result = await pingWaha(normalizedUrl, finalKey, timeoutSeconds)
    if (!result.success) {
      return res.status(200).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Erro ao testar servidor WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

function makeCookieAdapter(req: NextApiRequest, res: NextApiResponse) {
  return {
    get(name: string) {
      return req.cookies[name]
    },
    set(name: string, value: string, options: CookieOptions) {
      res.setHeader(
        'Set-Cookie',
        `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`
      )
    },
    remove(name: string, options: CookieOptions) {
      res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
    }
  }
}

/**
 * Executa um ping simples ao WAHA e retorna estatísticas úteis.
 * Complexidade: O(1) para cada servidor (requisição única).
 */
async function pingWaha(apiUrl: string, apiKey?: string | null, timeoutSeconds = 30) {
  const endpoint = `${apiUrl}/api/sessions`
  const headers = buildWahaHeaders(apiKey)
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Math.max(5, timeoutSeconds) * 1000)
    const response = await fetch(endpoint, { headers, signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        success: false,
        error: `WAHA respondeu ${response.status}`,
        responseTime: Date.now() - start
      }
    }

    const sessions = await response.json()
    const list = Array.isArray(sessions) ? sessions : []
    const working = list.filter((session: any) => {
      const status = String(session.status || '').toUpperCase()
      return ['WORKING', 'CONNECTED', 'OPEN', 'READY', 'AUTHENTICATED'].includes(status)
    })

    return {
      success: true,
      data: {
        instances: list.length,
        activeConnections: working.length
      },
      responseTime: Date.now() - start
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao conectar ao WAHA',
      responseTime: Date.now() - start
    }
  }
}

