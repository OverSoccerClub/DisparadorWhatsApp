import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { CampaignService } from '@/lib/campaignService'
import { AtualizarCampanhaRequest } from '@/lib/campaignTypes'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID da campanha é obrigatório' })
  }

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

  if (req.method === 'GET') {
    try {
      const campanha = await CampaignService.getCampanhaById(id, user.id, supabase)

      if (!campanha) {
        return res.status(404).json({ error: 'Campanha não encontrada' })
      }

      return res.status(200).json({ data: campanha })
    } catch (error) {
      console.error('Erro ao buscar campanha:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const body: AtualizarCampanhaRequest = req.body
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

      // Verificar se a campanha existe e pertence ao usuário
      const campanhaExistente = await CampaignService.getCampanhaById(id, user.id, supabase)

      if (!campanhaExistente) {
        return res.status(404).json({ error: 'Campanha não encontrada' })
      }

      // Atualizar campanha
      const campanha = await CampaignService.atualizarCampanha(id, {
        nome,
        mensagem,
        criterios,
        configuracao
      }, user.id, supabase)

      if (!campanha) {
        return res.status(500).json({ error: 'Erro ao atualizar campanha' })
      }

      return res.status(200).json({ data: campanha })
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Verificar se a campanha existe e pertence ao usuário
      const campanha = await CampaignService.getCampanhaById(id, user.id, supabase)

      if (!campanha) {
        return res.status(404).json({ error: 'Campanha não encontrada' })
      }

      // Excluir campanha
      const sucesso = await CampaignService.deletarCampanha(id, user.id, supabase)

      if (!sucesso) {
        return res.status(500).json({ error: 'Erro ao excluir campanha' })
      }

      return res.status(200).json({ 
        success: true,
        message: 'Campanha excluída com sucesso' 
      })
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

