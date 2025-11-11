import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para componentes do navegador (com suporte a cookies de autenticação)
// Usa createBrowserClient que gerencia cookies automaticamente
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey,
  {
    cookies: {
      get(name: string) {
        // Ler cookie do navegador
        if (typeof document === 'undefined') return undefined
        const cookies = document.cookie.split('; ')
        const cookie = cookies.find(c => c.startsWith(`${name}=`))
        return cookie?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        // Salvar cookie no navegador
        if (typeof document === 'undefined') return
        
        let cookieString = `${name}=${value}`
        
        if (options.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        if (options.path) {
          cookieString += `; path=${options.path}`
        }
        if (options.sameSite) {
          cookieString += `; samesite=${options.sameSite}`
        }
        if (options.secure) {
          cookieString += '; secure'
        }
        
        document.cookie = cookieString
      },
      remove(name: string, options: any) {
        // Remover cookie do navegador
        if (typeof document === 'undefined') return
        
        document.cookie = `${name}=; path=${options.path || '/'}; max-age=0`
      },
    },
  }
)

// Cliente simples para operações que não precisam de autenticação
export const supabaseSimple = createClient(supabaseUrl, supabaseKey)

// Interface para a tabela disparos_sms
export interface DisparoSMS {
  id?: number
  nome: string
  telefone: string
  mensagens?: string
  status?: string
  created_at?: string
  updated_at?: string
}

// Interface para clientes (compatibilidade)
export interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  status: string
  created_at: string
  updated_at: string
}

// Interface para campanhas
export interface Campanha {
  id: string
  nome: string
  mensagem: string
  destinatarios?: any[]
  agendamento?: string
  status: string
  created_at: string
  updated_at: string
}

// Interface para disparos
export interface Disparo {
  id: string
  campanha_id?: string
  cliente_id?: string
  telefone: string
  status: string
  resposta?: string
  sent_at?: string
  created_at: string
}

// Interface para parâmetros de paginação
interface PaginationParams {
  page: number
  limit: number
  search?: string
  status?: string
  userId?: string
}

// Serviço para trabalhar com a tabela disparos_sms
export class DisparosSMSService {
  // Buscar todos os clientes da tabela clientes (filtrado por user_id)
  static async getClientes(userId: string): Promise<Cliente[]> {
    try {
      const { data, error } = await supabaseSimple
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar clientes:', error)
        return []
      }

      // Converter para formato de clientes
      return data?.map((item: any) => ({
        id: item.id?.toString() || '',
        nome: item.nome,
        telefone: item.telefone,
        email: item.email || '',
        status: item.status || 'ativo',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      })) || []
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return []
    }
  }

  // Buscar clientes com paginação real (filtrado por user_id)
  static async getClientesPaginated(params: PaginationParams): Promise<{ data: Cliente[], error: any, count: number }> {
    try {
      const { page, limit, search, status, userId } = params
      const from = (page - 1) * limit
      const to = from + limit - 1

      if (!userId) {
        return { data: [], error: { message: 'userId é obrigatório' }, count: 0 }
      }

      let query = supabaseSimple
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Aplicar filtros apenas se não estiverem vazios
      if (search && search.trim() !== '') {
        query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`)
      }

      if (status && status !== 'todos' && status.trim() !== '') {
        query = query.eq('status', status)
      }

      // Aplicar paginação
      const { data, error, count } = await query.range(from, to)

      if (error) {
        console.error('Erro do Supabase:', error)
        return { data: [], error, count: 0 }
      }

      // Converter para formato de clientes
      const clientes = data?.map((item: DisparoSMS) => ({
        id: item.id?.toString() || '',
        nome: item.nome,
        telefone: item.telefone,
        email: '',
        status: item.status || 'ativo',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      })) || []

      return { data: clientes, error: null, count: count || 0 }
    } catch (error) {
      console.error('Erro ao buscar clientes paginados:', error)
      return { data: [], error, count: 0 }
    }
  }

  // Buscar cliente por telefone (filtrado por user_id)
  static async getClienteByTelefone(telefone: string, userId: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabaseSimple
        .from('clientes')
        .select('*')
        .eq('telefone', telefone)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id?.toString() || '',
        nome: data.nome,
        telefone: data.telefone,
        email: data.email || '',
        status: data.status || 'ativo',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      return null
    }
  }

  // Adicionar novo cliente na tabela clientes (com user_id)
  static async addCliente(cliente: Omit<DisparoSMS, 'id' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<boolean> {
    try {
      if (!cliente.user_id) {
        console.error('Erro: user_id é obrigatório para adicionar cliente')
        return false
      }

      const { error } = await supabaseSimple
        .from('clientes')
        .insert([{
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: (cliente as any).email || '',
          status: cliente.status || 'ativo',
          user_id: cliente.user_id
        }])

      if (error) {
        console.error('Erro ao adicionar cliente:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      return false
    }
  }

  // Atualizar cliente na tabela clientes (verificando user_id)
  static async updateCliente(id: number, updates: Partial<DisparoSMS>, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseSimple
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao atualizar cliente:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      return false
    }
  }

  // Buscar estatísticas dos clientes (filtrado por user_id)
  static async getEstatisticas(userId: string): Promise<{
    totalClientes: number
    clientesAtivos: number
    clientesInativos: number
  }> {
    try {
      const { data, error } = await supabaseSimple
        .from('clientes')
        .select('status')
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return { totalClientes: 0, clientesAtivos: 0, clientesInativos: 0 }
      }

      const total = data?.length || 0
      const ativos = data?.filter(item => item.status === 'ativo').length || 0
      const inativos = data?.filter(item => item.status === 'inativo').length || 0

      return {
        totalClientes: total,
        clientesAtivos: ativos,
        clientesInativos: inativos
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { totalClientes: 0, clientesAtivos: 0, clientesInativos: 0 }
    }
  }
}
