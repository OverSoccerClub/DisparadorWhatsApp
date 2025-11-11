import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const response = new NextResponse()

    // Criar cliente Supabase com gerenciamento de cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              // Cookie expira em 30 minutos (1800 segundos)
              maxAge: 30 * 60
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            })
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
      return NextResponse.json(
        { success: false, message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Erro ao fazer login' },
        { status: 401 }
      )
    }

    // Verificar se o email foi confirmado
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.' },
        { status: 401 }
      )
    }

    // Priorizar full_name, depois name, depois display_name, e por último email
    const userName = authData.user.user_metadata?.full_name || 
                     authData.user.user_metadata?.name || 
                     authData.user.user_metadata?.display_name || 
                     authData.user.email?.split('@')[0] || 
                     'Usuário'

    // Criar resposta com os dados do usuário
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: userName, // Usar o nome correto do usuário
        phone: authData.user.user_metadata?.phone,
        is_active: true,
        is_admin: false,
        created_at: authData.user.created_at,
        last_login: new Date().toISOString()
      },
      message: 'Login realizado com sucesso'
    }, {
      headers: response.headers
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
