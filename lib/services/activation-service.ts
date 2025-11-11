/**
 * Serviço de geração e validação de códigos de ativação
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ActivationCode {
  id: string
  user_id: string
  code: string
  email: string
  expires_at: string
  used: boolean
  created_at: string
}

/**
 * Gera um código único de ativação (6 dígitos)
 */
function generateActivationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Cria um código de ativação para um usuário
 */
export async function createActivationCode(
  userId: string,
  email: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const code = generateActivationCode()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expira em 24 horas

    const { data, error } = await supabase
      .from('activation_codes')
      .insert({
        user_id: userId,
        email: email,
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar código de ativação:', error)
      return { success: false, error: error.message }
    }

    return { success: true, code }
  } catch (error: any) {
    console.error('Erro ao criar código de ativação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Valida e ativa um código de ativação
 */
export async function validateActivationCode(
  email: string,
  code: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Buscar código de ativação
    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .single()

    if (error || !data) {
      return { success: false, error: 'Código de ativação inválido' }
    }

    // Verificar se o código expirou
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return { success: false, error: 'Código de ativação expirado' }
    }

    // Marcar código como usado
    await supabase
      .from('activation_codes')
      .update({ used: true })
      .eq('id', data.id)

    // Ativar usuário no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.user_id,
      { email_verify: true }
    )

    if (updateError) {
      console.error('Erro ao ativar usuário:', updateError)
      return { success: false, error: 'Erro ao ativar conta' }
    }

    return { success: true, userId: data.user_id }
  } catch (error: any) {
    console.error('Erro ao validar código de ativação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verifica se um email já está cadastrado
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Erro ao verificar email:', error)
      return false
    }

    return data.users.some(user => user.email === email)
  } catch (error) {
    console.error('Erro ao verificar email:', error)
    return false
  }
}

/**
 * Verifica se um telefone já está cadastrado
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    // Normalizar telefone (remover caracteres não numéricos)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Buscar em user_metadata do Supabase Auth
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Erro ao verificar telefone:', error)
      return false
    }

    // Verificar se algum usuário tem este telefone no metadata
    return users.users.some(user => {
      const userPhone = user.user_metadata?.phone
      return userPhone && userPhone.replace(/\D/g, '') === normalizedPhone
    })
  } catch (error) {
    console.error('Erro ao verificar telefone:', error)
    return false
  }
}

