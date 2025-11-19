import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      const page = parseInt((req.query.page as string) || '1')
      const limit = parseInt((req.query.limit as string) || '10')
      const search = (req.query.search as string) || ''
      const status = (req.query.status as string) || 'todos'

      // Construir query
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Aplicar filtro de busca
      if (search) {
        query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Aplicar filtro de status
      if (status !== 'todos') {
        query = query.eq('status', status)
      }

      // Ordenar e paginar
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar clientes:', error)
        return res.status(500).json({ error: 'Erro ao buscar clientes' })
      }

      return res.status(200).json({
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'POST') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      const { nome, telefone, email, grupo, observacoes } = req.body

      if (!nome || !telefone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' })
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          nome,
          telefone,
          email,
          grupo,
          observacoes,
          status: 'ativo'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar cliente:', error)
        return res.status(500).json({ error: 'Erro ao criar cliente' })
      }

      return res.status(201).json({ data })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      const { id, ...updates } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' })
      }

      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar cliente:', error)
        return res.status(500).json({ error: 'Erro ao atualizar cliente' })
      }

      return res.status(200).json({ data })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      const id = req.query.id as string

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' })
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao deletar cliente:', error)
        return res.status(500).json({ error: 'Erro ao deletar cliente' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

