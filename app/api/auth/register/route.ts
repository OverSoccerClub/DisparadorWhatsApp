import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createActivationCode, checkEmailExists, checkPhoneExists } from '@/lib/services/activation-service'
import EmailService from '@/lib/services/email-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente Supabase com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    // Validação básica
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validação de telefone (formato brasileiro básico)
    const phoneRegex = /^[\d\s\(\)\-\+]{10,15}$/
    const normalizedPhone = phone.replace(/\D/g, '')
    if (!phoneRegex.test(phone) || normalizedPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX' },
        { status: 400 }
      )
    }

    // Validação de senha
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se telefone já existe
    const phoneExists = await checkPhoneExists(normalizedPhone)
    if (phoneExists) {
      return NextResponse.json(
        { success: false, message: 'Este telefone já está cadastrado' },
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

    // Registrar usuário no Supabase Auth (sem confirmar email automaticamente)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          display_name: name,
          phone: normalizedPhone,
          full_name: name // Garantir que o nome completo seja salvo
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/activate`
      }
    })

    if (authError) {
      console.error('Erro ao registrar no Supabase Auth:', authError)
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // Criar código de ativação
    const activationResult = await createActivationCode(authData.user.id, email)
    
    if (!activationResult.success || !activationResult.code) {
      console.error('Erro ao criar código de ativação:', activationResult.error)
      // Continuar mesmo se falhar o código, mas avisar
    }

    // Enviar email de confirmação
    if (activationResult.code) {
      const emailTemplate = EmailService.generateActivationEmail(name, activationResult.code)
      const emailResult = await EmailService.sendEmail({
        to: email,
        subject: 'Confirme seu cadastro - WhatsApp Dispatcher',
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (!emailResult.success) {
        console.error('Erro ao enviar email:', emailResult.error)
        // Continuar mesmo se falhar o envio de email
      }
    }

    // Retornar sucesso (não fazer login automático - precisa ativar conta)
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name, // Usar o nome informado, não o email
        phone: normalizedPhone,
        is_active: false, // Conta inativa até ativação
        is_admin: false,
        created_at: authData.user.created_at
      },
      message: activationResult.code 
        ? 'Conta criada com sucesso! Verifique seu email para ativar sua conta com o código de confirmação.'
        : 'Conta criada com sucesso! Entre em contato com o suporte para ativar sua conta.',
      requiresActivation: true,
      activationCode: process.env.NODE_ENV === 'development' ? activationResult.code : undefined // Mostrar código apenas em dev
    }, {
      headers: response.headers
    })
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
