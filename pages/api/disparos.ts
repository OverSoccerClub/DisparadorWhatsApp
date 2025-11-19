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
      const dataInicio = (req.query.data_inicio as string) || ''
      const dataFim = (req.query.data_fim as string) || ''
      const tipoData = (req.query.tipo_data as string) || 'created_at'

      // Construir query - buscar de todas as tabelas de disparos
      // Combinar disparos de WAHA, Telegram e Evolution
      const queries = []

      // WAHA Dispatches
      let wahaQuery = supabase
        .from('waha_dispatches')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (search) {
        wahaQuery = wahaQuery.or(`telefone.ilike.%${search}%,mensagem.ilike.%${search}%`)
      }

      if (status !== 'todos') {
        wahaQuery = wahaQuery.eq('status', status)
      }

      if (dataInicio && tipoData === 'created_at') {
        wahaQuery = wahaQuery.gte('created_at', dataInicio)
      }

      if (dataFim && tipoData === 'created_at') {
        wahaQuery = wahaQuery.lte('created_at', dataFim)
      }

      queries.push(wahaQuery.order('created_at', { ascending: false }))

      // Telegram Dispatches
      let telegramQuery = supabase
        .from('telegram_dispatches')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (search) {
        telegramQuery = telegramQuery.or(`chat_id.ilike.%${search}%,mensagem.ilike.%${search}%`)
      }

      if (status !== 'todos') {
        telegramQuery = telegramQuery.eq('status', status)
      }

      if (dataInicio && tipoData === 'created_at') {
        telegramQuery = telegramQuery.gte('created_at', dataInicio)
      }

      if (dataFim && tipoData === 'created_at') {
        telegramQuery = telegramQuery.lte('created_at', dataFim)
      }

      queries.push(telegramQuery.order('created_at', { ascending: false }))

      // Executar queries em paralelo
      const results = await Promise.all(queries.map(q => q))

      // Combinar resultados
      let allDisparos: any[] = []
      let total = 0

      results.forEach((result) => {
        if (result.data) {
          allDisparos = allDisparos.concat(result.data.map((d: any) => ({
            ...d,
            tipo: d.chat_id ? 'telegram' : 'waha'
          })))
        }
        if (result.count) {
          total += result.count
        }
      })

      // Ordenar por data
      allDisparos.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      // Aplicar paginação
      const from = (page - 1) * limit
      const to = from + limit
      const data = allDisparos.slice(from, to)

      return res.status(200).json({
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Erro ao buscar disparos:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

