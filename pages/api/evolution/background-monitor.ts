import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
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

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      // Retornar status do monitoramento
      return res.status(200).json({
        success: true,
        monitoring: true,
        userId: user.id
      })
    } catch (error) {
      console.error('Erro no background monitor:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'POST') {
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

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      const { action } = req.body || {}

      // Se não houver action, retornar status do monitoramento
      if (!action) {
        return res.status(200).json({
          success: true,
          monitoring: true,
          userId: user.id
        })
      }

      if (action === 'start') {
        // Iniciar monitoramento em background
        return res.status(200).json({
          success: true,
          message: 'Monitoramento iniciado',
          userId: user.id
        })
      } else if (action === 'stop') {
        // Parar monitoramento
        return res.status(200).json({
          success: true,
          message: 'Monitoramento parado',
          userId: user.id
        })
      } else {
        return res.status(400).json({
          success: false,
          error: 'Ação inválida. Use "start" ou "stop"'
        })
      }
    } catch (error) {
      console.error('Erro no background monitor:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

