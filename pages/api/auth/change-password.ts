import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      success: false,
      message: 'Configuração Supabase ausente'
    })
  }

  const { currentPassword, newPassword } = req.body || {}

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Senha atual e nova senha são obrigatórias'
    })
  }

  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    }, {
      currentPassword
    })

    if (updateError) {
      if (updateError.message?.toLowerCase().includes('current password')) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        })
      }

      return res.status(400).json({
        success: false,
        message: updateError.message || 'Não foi possível atualizar a senha'
      })
    }

    return res.status(200).json({ success: true, message: 'Senha atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
}

