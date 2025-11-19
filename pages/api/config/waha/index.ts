import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { assertSupabaseResponse, formatWahaServer, normalizeApiUrl } from '@/lib/server/waha-config-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['POST', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
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

    if (req.method === 'POST') {
      return await handleUpsert(req, res, supabase, user.id)
    }

    return await handleDelete(req, res, supabase, user.id)
  } catch (error) {
    console.error('Erro no endpoint /api/config/waha:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * Cria um adaptador de cookies compatível com o Supabase SSR.
 */
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
 * Cria ou atualiza um servidor WAHA.
 * Complexidade: O(1) por operação (consulta/insert/update únicos).
 */
async function handleUpsert(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const {
    id,
    name,
    apiUrl,
    apiKey,
    webhookUrl,
    webhookSecret,
    timeout = 30,
    retryAttempts = 3,
    rateLimit = 100,
    ativo = true,
    description,
    priority = 0,
    maxSessions = 10
  } = req.body || {}

  if (!name || !apiUrl) {
    return res.status(400).json({ success: false, error: 'Nome e URL são obrigatórios' })
  }

  const normalizedUrl = normalizeApiUrl(apiUrl)
  if (!normalizedUrl) {
    return res.status(400).json({ success: false, error: 'URL inválida' })
  }

  const payload = {
    user_id: userId,
    nome: name.trim(),
    api_url: normalizedUrl,
    api_key: apiKey?.trim() || null,
    webhook_url: webhookUrl?.trim() || null,
    webhook_secret: webhookSecret?.trim() || null,
    timeout,
    retry_attempts: retryAttempts,
    rate_limit: rateLimit,
    ativo,
    descricao: description?.trim() || null,
    prioridade: priority,
    max_sessions: maxSessions
  }

  if (id) {
    const response = await supabase
      .from('waha_servers')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    try {
      const data = assertSupabaseResponse(response)
      return res.status(200).json({ success: true, server: formatWahaServer(data) })
    } catch (error) {
      console.error('Erro ao atualizar servidor WAHA:', error)
      return res.status(500).json({ success: false, error: 'Erro ao atualizar servidor' })
    }
  }

  const insertResponse = await supabase
    .from('waha_servers')
    .insert(payload)
    .select()
    .single()

  try {
    const data = assertSupabaseResponse(insertResponse)
    return res.status(201).json({ success: true, server: formatWahaServer(data) })
  } catch (error) {
    console.error('Erro ao criar servidor WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro ao criar servidor' })
  }
}

/**
 * Remove um servidor WAHA pertencente ao usuário autenticado.
 * Complexidade: O(1).
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const serverId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id

  if (!serverId) {
    return res.status(400).json({ success: false, error: 'ID do servidor é obrigatório' })
  }

  const { error } = await supabase
    .from('waha_servers')
    .delete()
    .eq('id', serverId)
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao excluir servidor WAHA:', error)
    return res.status(500).json({ success: false, error: 'Erro ao excluir servidor' })
  }

  return res.status(200).json({ success: true })
}

