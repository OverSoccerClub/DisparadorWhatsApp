import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  if (req.method === 'GET') {
    try {
      const { data: bots, error } = await supabase
        .from('telegram_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar bots:', error)
        return res.status(500).json({ success: false, error: 'Erro ao buscar bots' })
      }

      return res.status(200).json({
        success: true,
        bots: bots || []
      })
    } catch (error) {
      console.error('Erro ao listar bots:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, token, webhookUrl } = req.body

      if (!name || !token) {
        return res.status(400).json({ success: false, error: 'Nome e token são obrigatórios' })
      }

      const { data: bot, error } = await supabase
        .from('telegram_bots')
        .insert({
          user_id: user.id,
          name,
          token,
          webhook_url: webhookUrl || null
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar bot:', error)
        return res.status(500).json({ success: false, error: 'Erro ao criar bot' })
      }

      return res.status(200).json({
        success: true,
        bot
      })
    } catch (error) {
      console.error('Erro ao criar bot:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

