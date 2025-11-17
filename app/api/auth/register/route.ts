import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createActivationCode, checkEmailExists, checkPhoneExists } from '@/lib/services/activation-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar variáveis de ambiente
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida nas variáveis de ambiente')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente')
}

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

    // Verificar se email já existe (opcional - requer SERVICE_ROLE_KEY)
    // Se não tiver SERVICE_ROLE_KEY, tentará registrar e o Supabase retornará erro se já existir
    try {
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Este email já está cadastrado' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Ignorar erro - tentará registrar mesmo assim
      console.debug('Não foi possível verificar email (pode ser normal se SERVICE_ROLE_KEY não estiver configurada)')
    }

    // Verificar se telefone já existe (opcional - requer SERVICE_ROLE_KEY)
    try {
      const phoneExists = await checkPhoneExists(normalizedPhone)
      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: 'Este telefone já está cadastrado' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Ignorar erro - tentará registrar mesmo assim
      console.debug('Não foi possível verificar telefone (pode ser normal se SERVICE_ROLE_KEY não estiver configurada)')
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

    // Registrar usuário usando API Admin para evitar envio de email
    // A ativação será feita via código enviado por WhatsApp
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    // Verificar se SERVICE_ROLE_KEY não é apenas um placeholder
    const hasValidServiceKey = supabaseServiceKey && 
      supabaseServiceKey !== 'your_supabase_service_role_key_here' &&
      supabaseServiceKey.trim() !== '' &&
      supabaseServiceKey.length > 50 // Chaves reais são longas
    
    if (!hasValidServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada ou inválida')
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta. SERVICE_ROLE_KEY é obrigatória para registro.' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Criar usuário usando API Admin (não envia email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Não confirmar email automaticamente
      user_metadata: {
        name: name,
        display_name: name,
        phone: normalizedPhone,
        full_name: name
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
      return NextResponse.json(
        { success: false, message: 'Erro ao gerar código de ativação' },
        { status: 500 }
      )
    }

    // Enviar código via WhatsApp através do n8n
    const { sendActivationCodeViaWhatsApp } = await import('@/lib/services/n8n-webhook-service')
    
    try {
      const webhookResult = await sendActivationCodeViaWhatsApp({
        name: name,
        phone: normalizedPhone,
        code: activationResult.code,
        email: email
      })

      if (!webhookResult.success) {
        console.error('Erro ao enviar código via WhatsApp:', webhookResult.message || webhookResult.error)
        // Continuar mesmo se falhar - código ainda será válido
        // Em desenvolvimento, mostrar código na resposta
      } else {
        console.log('✅ Código de ativação enviado via WhatsApp:', {
          phone: webhookResult.phone,
          name: name
        })
      }
    } catch (error) {
      console.error('Erro ao chamar webhook n8n:', error)
      // Continuar mesmo se falhar - código ainda será válido
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
        ? 'Conta criada com sucesso! Você receberá o código de ativação no seu WhatsApp em instantes.'
        : 'Conta criada com sucesso! Entre em contato com o suporte para ativar sua conta.',
      requiresActivation: true,
      activationCode: process.env.NODE_ENV === 'development' ? activationResult.code : undefined // Mostrar código apenas em dev para debug
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
