import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { CampaignService } from '@/lib/campaignService'
import { CriarCampanhaRequest, AtualizarCampanhaRequest } from '@/lib/campaignTypes'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Autenticação
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
      const status = (req.query.status as string) || 'todos'

      const campanhas = await CampaignService.getCampanhas(user.id)

      // Aplicar filtros
      let campanhasFiltradas = campanhas

      if (status !== 'todos') {
        campanhasFiltradas = campanhasFiltradas.filter(campanha => 
          campanha.progresso.status === status
        )
      }

      // Paginação
      const total = campanhasFiltradas.length
      const from = (page - 1) * limit
      const to = from + limit
      const data = campanhasFiltradas.slice(from, to)

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
      console.error('Erro ao buscar campanhas:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'POST') {
    try {
      // Autenticação
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

      const body: CriarCampanhaRequest = req.body
      const { nome, mensagem, criterios, configuracao } = body

      // Validar dados obrigatórios
      if (!nome || !mensagem || !criterios || !configuracao) {
        return res.status(400).json({ 
          error: 'Nome, mensagem, critérios e configuração são obrigatórios' 
        })
      }

      // Validar configurações
      if (configuracao.clientesPorLote < 1 || configuracao.clientesPorLote > 1000) {
        return res.status(400).json({ 
          error: 'Clientes por lote deve estar entre 1 e 1000' 
        })
      }

      if (configuracao.intervaloMensagens < 1 || configuracao.intervaloMensagens > 300) {
        return res.status(400).json({ 
          error: 'Intervalo entre mensagens deve estar entre 1 e 300 segundos' 
        })
      }

      // Criar campanha
      const campanha = await CampaignService.criarCampanha({
        nome,
        mensagem,
        criterios,
        configuracao
      }, user.id)

      if (!campanha) {
        return res.status(500).json({ 
          error: 'Erro ao criar campanha' 
        })
      }

      return res.status(201).json({ data: campanha })
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

