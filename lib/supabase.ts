import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Verificar se as variáveis de ambiente estão disponíveis
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  created_at: string
  status: 'ativo' | 'inativo'
}

export interface Campanha {
  id: string
  nome: string
  mensagem: string
  destinatarios: string[]
  agendamento?: string
  status: 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'pausada'
  created_at: string
  user_id: string
}

export interface Disparo {
  id: string
  user_id: string
  telefone: string
  mensagem: string
  status: 'pendente' | 'enviado' | 'entregue' | 'falhou' | 'cancelado'
  instance_name?: string
  agendamento?: string
  enviado_em?: string
  entregue_em?: string
  resposta?: string
  erro?: string
  tentativas: number
  max_tentativas: number
  campanha_id?: string
  created_at: string
  updated_at: string
}
