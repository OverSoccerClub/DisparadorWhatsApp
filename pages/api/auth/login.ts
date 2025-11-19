import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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
      return res.status(500).json({ 
        success: false, 
        message: 'Configuração do servidor incompleta. Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        error: 'missing_env_vars'
      })
    }

    // Validar formato da URL do Supabase
    try {
      new URL(supabaseUrl)
    } catch (urlError) {
      console.error('❌ URL do Supabase inválida:', supabaseUrl)
      return res.status(500).json({ 
        success: false, 
        message: 'URL do Supabase inválida. Verifique a variável NEXT_PUBLIC_SUPABASE_URL.',
        error: 'invalid_supabase_url'
      })
    }

    const { email, password } = req.body

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      })
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

    // Fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Erro ao fazer login no Supabase Auth:', authError)
      
      // Tratar erros específicos do Supabase
      // Erro de schema do banco de dados
      if (authError.message?.includes('Database error querying schema') || 
          authError.code === 'unexpected_failure' ||
          (authError.status === 500 && authError.message?.includes('Database'))) {
        console.error('❌ Erro no schema do banco de dados do Supabase:', {
          code: authError.code,
          message: authError.message,
          status: authError.status,
          url: supabaseUrl
        })
        return res.status(500).json({ 
          success: false, 
          message: 'Erro de configuração do banco de dados do Supabase. Verifique: 1) Se o projeto Supabase está ativo, 2) Se as variáveis de ambiente estão corretas, 3) Se o banco de dados está acessível.',
          error: 'database_schema_error',
          details: process.env.NODE_ENV === 'development' ? {
            supabaseUrl: supabaseUrl ? 'Configurado' : 'Não configurado',
            errorCode: authError.code,
            errorMessage: authError.message
          } : undefined
        })
      }
      
      // Erro de credenciais inválidas
      if (authError.message?.includes('Invalid login credentials') || authError.message?.includes('Invalid credentials')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Email ou senha incorretos' 
        })
      }
      
      // Sistema não usa verificação por email - apenas ativação via WhatsApp
      // Se o erro for sobre email não confirmado, tentar confirmar automaticamente
      if (authError.message?.includes('Email not confirmed') || authError.message?.includes('email_not_confirmed')) {
        console.warn('⚠️ Email não confirmado - tentando confirmar automaticamente')
        
        // Tentar confirmar email automaticamente e refazer login
        try {
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              supabaseServiceKey,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )
            
            // Buscar usuário pelo email para confirmar
            const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
            const userToConfirm = userData?.users.find(u => u.email === email)
            
            if (userToConfirm) {
              await supabaseAdmin.auth.admin.updateUserById(userToConfirm.id, {
                // @ts-ignore
                email_confirmed_at: new Date().toISOString()
              })
              console.log('✅ Email confirmado automaticamente - refazendo login')
              
              // Refazer login após confirmar email
              const { data: retryAuthData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password
              })
              
              if (retryError || !retryAuthData.user || !retryAuthData.session) {
                return res.status(401).json({ 
                  success: false, 
                  message: 'Email ou senha incorretos' 
                })
              }
              
              // Usar dados do retry
              authData.user = retryAuthData.user
              authData.session = retryAuthData.session
            } else {
              return res.status(401).json({ 
                success: false, 
                message: 'Email ou senha incorretos' 
              })
            }
          } else {
            return res.status(401).json({ 
              success: false, 
              message: 'Email ou senha incorretos' 
            })
          }
        } catch (confirmError) {
          console.error('Erro ao confirmar email automaticamente:', confirmError)
          return res.status(401).json({ 
            success: false, 
            message: 'Email ou senha incorretos' 
          })
        }
      } else {
        // Para outros erros, retornar mensagem genérica mas logar o erro completo
        console.error('Erro de autenticação não tratado:', {
          code: authError.code,
          message: authError.message,
          status: authError.status
        })
        
        // Se for um erro 500 do Supabase, retornar erro de servidor
        if (authError.status === 500) {
          return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor de autenticação. Tente novamente em alguns instantes.',
            error: 'server_error'
          })
        }
        
        return res.status(401).json({ 
          success: false, 
          message: 'Email ou senha incorretos' 
        })
      }
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erro ao fazer login' 
      })
    }

    // Sistema não verifica email_confirmed_at - email já foi confirmado automaticamente no registro

    // Priorizar full_name, depois name, depois display_name, e por último email
    const userName = authData.user.user_metadata?.full_name || 
                     authData.user.user_metadata?.name || 
                     authData.user.user_metadata?.display_name || 
                     authData.user.email?.split('@')[0] || 
                     'Usuário'

    // Criar resposta com os dados do usuário
    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: userName,
        phone: authData.user.user_metadata?.phone,
        is_active: true,
        is_admin: false,
        created_at: authData.user.created_at,
        last_login: new Date().toISOString()
      },
      message: 'Login realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    })
  }
}
