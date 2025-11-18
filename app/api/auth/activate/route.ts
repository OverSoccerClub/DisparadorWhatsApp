import { NextRequest, NextResponse } from 'next/server'
import { validateActivationCode } from '@/lib/services/activation-service'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar código de ativação
    const validationResult = await validateActivationCode(email, code)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: validationResult.error || 'Código inválido' },
        { status: 400 }
      )
    }

    // Fazer login automático após ativação
    const cookieStore = await cookies()
    const response = new NextResponse()

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
              maxAge: 30 * 60 // 30 minutos
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

    // Buscar usuário usando admin API para confirmar que foi ativado
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(validationResult.userId!)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar usuário' },
        { status: 400 }
      )
    }

    // O email já foi confirmado pelo validateActivationCode
    // Se não foi confirmado, isso é um problema mas não bloqueia a ativação
    // O usuário pode tentar fazer login e será redirecionado para ativação se necessário

    // Retornar sucesso (o usuário precisará fazer login após ativação)
    return NextResponse.json({
      success: true,
      message: 'Conta ativada com sucesso! Faça login para continuar.',
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.user_metadata?.full_name || user.user.user_metadata?.name || user.user.email?.split('@')[0],
        phone: user.user.user_metadata?.phone
      }
    }, {
      headers: response.headers
    })
  } catch (error: any) {
    console.error('Erro ao ativar conta:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

