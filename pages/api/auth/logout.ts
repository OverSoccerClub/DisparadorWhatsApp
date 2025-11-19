import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Criar cliente Supabase com gerenciamento de cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''} ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`)
          },
          remove(name: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          },
        },
      }
    )

    // Fazer logout no Supabase Auth (remove os cookies automaticamente)
    await supabase.auth.signOut()

    // Limpar cookies do Supabase manualmente
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ]

    cookiesToClear.forEach(cookieName => {
      res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
    })

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro no logout:', error)
    
    // Mesmo em caso de erro, limpar cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ]

    cookiesToClear.forEach(cookieName => {
      res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
    })
    
    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  }
}