import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { buildWahaHeaders, normalizeApiUrl } from '@/lib/server/waha-config-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { serverIds } = req.body || {}
  if (!Array.isArray(serverIds) || serverIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Lista de servidores é obrigatória' })
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

    const { data: servers, error } = await supabase
      .from('waha_servers')
      .select('*')
      .eq('user_id', user.id)
      .in('id', serverIds)

    if (error) {
      console.error('Erro ao buscar servidores WAHA:', error)
      return res.status(500).json({ success: false, error: 'Erro ao buscar servidores' })
    }

    const checks = await Promise.all(
      (servers || []).map(server => checkServerStatus(server, server.timeout ?? 30))
    )

    return res.status(200).json({ success: true, results: checks })
  } catch (error) {
    console.error('Erro ao verificar status dos servidores WAHA:', error)
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
 * Realiza o ping em um servidor WAHA e retorna o status consolidado.
 * Complexidade: O(1) por servidor (operações HTTP e parsing de resposta).
 */
async function checkServerStatus(server: any, timeoutSeconds: number) {
  const baseUrl = normalizeApiUrl(server.api_url)
  const endpoint = `${baseUrl}/api/sessions`
  const headers = buildWahaHeaders(server.api_key)
  const lastCheck = new Date().toISOString()
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Math.max(5, timeoutSeconds) * 1000)

    const response = await fetch(endpoint, { headers, signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        id: server.id,
        status: 'offline',
        lastCheck,
        httpStatus: response.status,
        responseTime: Date.now() - start
      }
    }

    const sessions = await response.json()
    const sessionList = Array.isArray(sessions) ? sessions : []
    const workingSessions = sessionList.filter((session: any) => {
      const state = String(session.status || '').toUpperCase()
      return ['WORKING', 'CONNECTED', 'OPEN', 'READY', 'AUTHENTICATED'].includes(state)
    })

    return {
      id: server.id,
      status: 'online',
      lastCheck,
      responseTime: Date.now() - start,
      instances: sessionList.length,
      activeConnections: workingSessions.length
    }
  } catch (error: any) {
    return {
      id: server.id,
      status: 'offline',
      lastCheck,
      responseTime: Date.now() - start,
      error: error?.message || 'Falha durante verificação'
    }
  }
}

