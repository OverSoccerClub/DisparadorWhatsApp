import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Validar variáveis de ambiente
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas:', {
        url: supabaseUrl ? '✅' : '❌',
        key: supabaseAnonKey ? '✅' : '❌'
      })
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const cookieStore = cookies()

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
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Verificar autenticação e buscar usuário
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Retornar dados do usuário
    // Priorizar full_name, depois name, depois display_name, e por último email
    const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.display_name || 
                     user.email?.split('@')[0] || 
                     'Usuário'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userName,
        phone: user.user_metadata?.phone,
        avatar_url: user.user_metadata?.avatar_url,
        is_active: user.email_confirmed_at ? true : false,
        is_admin: false,
        last_login: user.last_sign_in_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
