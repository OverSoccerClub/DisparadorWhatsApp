import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { validateActivationCode } from '@/lib/services/activation-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e código são obrigatórios' 
      })
    }

    // Criar cliente Supabase
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

    // Validar código de ativação (agora confirma o email automaticamente)
    const isValid = await validateActivationCode(email, code)

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de ativação inválido ou expirado' 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Conta ativada com sucesso! Você já pode fazer login.'
    })
  } catch (error) {
    console.error('Erro ao ativar conta:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao ativar conta',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
