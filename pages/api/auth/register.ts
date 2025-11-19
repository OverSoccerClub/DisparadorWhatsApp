import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { email, password, name, phone } = req.body

    // Validação básica
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
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

    // Verificar se o email já existe
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email já cadastrado' 
      })
    }

    // Verificar se o telefone já existe
    const phoneExists = await checkPhoneExists(phone)
    if (phoneExists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Telefone já cadastrado' 
      })
    }

    // Criar usuário diretamente usando Admin API (evita problemas com envio de email)
    // Sistema não usa verificação por email - apenas ativação via WhatsApp
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
      return res.status(500).json({ 
        success: false, 
        message: 'Configuração do servidor incompleta. SERVICE_ROLE_KEY não configurada.',
        error: 'SERVICE_ROLE_KEY é obrigatória para criar usuários sem confirmação de email.'
      })
    }

    let createdUser

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      // Criar usuário diretamente via Admin API (sem tentar enviar email)
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          full_name: name,
          phone: phone,
          display_name: name,
          name: name,
        }
      })

      if (adminError) {
        console.error('Erro ao criar usuário via Admin API:', adminError)
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar conta. Tente novamente.',
          error: adminError.message 
        })
      }

      if (!adminData?.user) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar usuário' 
        })
      }

      createdUser = adminData.user
      console.log('✅ Usuário criado diretamente via Admin API (sem envio de email):', createdUser.id)
      
    } catch (createError) {
      console.error('Erro ao criar usuário:', createError)
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar conta. Tente novamente.',
        error: createError instanceof Error ? createError.message : 'Erro desconhecido'
      })
    }

    // Criar código de ativação e enviar via WhatsApp
    try {
      const activationResult = await createActivationCode(createdUser.id, email)
      
      if (!activationResult.success) {
        console.error('Erro ao criar código de ativação:', activationResult.error)
        // Não reverter criação do usuário - código pode ser gerado depois
        return res.status(200).json({
          success: true,
          message: 'Conta criada com sucesso! Mas houve um erro ao gerar o código de ativação. Entre em contato com o suporte.',
          requiresActivation: true,
          userId: createdUser.id,
          email: createdUser.email,
          warning: 'Código de ativação não foi gerado. Entre em contato com o suporte.'
        })
      }
      
      console.log('✅ Código de ativação gerado:', activationResult.code)
      console.log('📱 Código será enviado para:', phone)
      
      // TODO: Integrar com n8n para enviar código via WhatsApp
      // Por enquanto, retornamos sucesso e o código no console

      return res.status(200).json({
        success: true,
        message: 'Conta criada com sucesso! Um código de ativação foi enviado para o seu WhatsApp.',
        requiresActivation: true,
        userId: createdUser.id,
        email: createdUser.email,
        // Em desenvolvimento, pode retornar o código:
        ...(process.env.NODE_ENV === 'development' && { activationCode: activationResult.code })
      })
    } catch (activationError) {
      console.error('Erro ao criar código de ativação:', activationError)
      
      // Não reverter criação do usuário - código pode ser gerado depois
      // Retornar sucesso mas com aviso
      return res.status(200).json({
        success: true,
        message: 'Conta criada com sucesso! Mas houve um erro ao gerar o código de ativação. Entre em contato com o suporte.',
        requiresActivation: true,
        userId: createdUser.id,
        email: createdUser.email,
        warning: 'Código de ativação não foi gerado. Entre em contato com o suporte.',
        error: activationError instanceof Error ? activationError.message : 'Erro desconhecido'
      })
    }
  } catch (error) {
    console.error('Erro no registro:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
