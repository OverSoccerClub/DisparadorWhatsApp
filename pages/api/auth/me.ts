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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Validar variáveis de ambiente
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas:', {
        url: supabaseUrl ? '✅' : '❌',
        key: supabaseAnonKey ? '✅' : '❌'
      })
      return res.status(500).json({ success: false, message: 'Configuração do servidor incompleta' })
    }

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
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
          },
          remove(name: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          },
        },
      }
    )

    // Verificar autenticação e buscar usuário
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' })
    }

    // Retornar dados do usuário
    // Priorizar full_name, depois name, depois display_name, e por último email
    const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.display_name || 
                     user.email?.split('@')[0] || 
                     'Usuário'

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userName,
        phone: user.user_metadata?.phone,
        avatar_url: user.user_metadata?.avatar_url,
        // Sistema não usa verificação por email - sempre considerar ativo se usuário existe
        is_active: true,
        is_admin: false,
        last_login: user.last_sign_in_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' })
  }
}
