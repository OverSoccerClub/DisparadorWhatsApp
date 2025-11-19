import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

interface RelatorioResponse {
  success: boolean
  data?: {
    // Métricas principais
    totalEnviadas: number
    totalEntregues: number
    totalLidas: number
    totalErros: number
    taxaEntrega: number
    taxaLeitura: number
    taxaErro: number
    
    // Evolução mensal
    evolucaoMensal: Array<{
      name: string
      enviadas: number
      entregues: number
      lidas: number
      erros: number
    }>
    
    // Distribuição por status
    distribuicaoStatus: Array<{
      name: string
      value: number
      color: string
    }>
    
    // Performance por campanha
    performanceCampanhas: Array<{
      nome: string
      enviadas: number
      entregues: number
      taxaEntrega: number
    }>
    
    // Horários de maior engajamento
    horariosEngajamento: Array<{
      hora: string
      envios: number
    }>
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RelatorioResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

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
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    const periodo = (req.query.periodo as string) || '30d'
    
    // Calcular data inicial baseada no período
    const dataInicial = new Date()
    switch (periodo) {
      case '7d':
        dataInicial.setDate(dataInicial.getDate() - 7)
        break
      case '30d':
        dataInicial.setDate(dataInicial.getDate() - 30)
        break
      case '90d':
        dataInicial.setDate(dataInicial.getDate() - 90)
        break
      case '1y':
        dataInicial.setFullYear(dataInicial.getFullYear() - 1)
        break
      default:
        dataInicial.setDate(dataInicial.getDate() - 30)
    }
    dataInicial.setHours(0, 0, 0, 0)

    // Buscar disparos do usuário (tabela disparos)
    const { data: disparos, error: disparosError } = await supabase
      .from('disparos')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dataInicial.toISOString())
      .order('created_at', { ascending: false })

    if (disparosError) {
      console.error('Erro ao buscar disparos:', disparosError)
    }

    // Buscar disparos WAHA
    const { data: wahaDisparos, error: wahaError } = await supabase
      .from('waha_dispatches')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dataInicial.toISOString())
      .order('created_at', { ascending: false })

    if (wahaError) {
      console.error('Erro ao buscar disparos WAHA:', wahaError)
    }

    // Buscar campanhas do usuário
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dataInicial.toISOString())

    if (campanhasError) {
      console.error('Erro ao buscar campanhas:', campanhasError)
    }

    // Combinar todos os disparos
    const todosDisparos = [
      ...(disparos || []).map(d => ({
        ...d,
        status: d.status,
        enviado_em: d.enviado_em || d.created_at,
        campanha_id: d.campanha_id
      })),
      ...(wahaDisparos || []).map(d => ({
        ...d,
        status: d.status === 'sent' ? 'entregue' : d.status === 'failed' ? 'erro' : d.status === 'pending' ? 'pendente' : d.status,
        enviado_em: d.sent_at || d.created_at,
        campanha_id: d.campaign_id
      }))
    ]

    // Calcular métricas principais
    const totalEnviadas = todosDisparos.length
    const totalEntregues = todosDisparos.filter(d => 
      d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
    ).length
    const totalLidas = todosDisparos.filter(d => d.status === 'lido').length
    const totalErros = todosDisparos.filter(d => 
      d.status === 'erro' || d.status === 'falhou' || d.status === 'failed'
    ).length

    const taxaEntrega = totalEnviadas > 0 ? (totalEntregues / totalEnviadas) * 100 : 0
    const taxaLeitura = totalEnviadas > 0 ? (totalLidas / totalEnviadas) * 100 : 0
    const taxaErro = totalEnviadas > 0 ? (totalErros / totalEnviadas) * 100 : 0

    // Evolução temporal (ajustada por período)
    const evolucaoMensal: Array<{ name: string; enviadas: number; entregues: number; lidas: number; erros: number }> = []
    
    if (periodo === '7d') {
      // Últimos 7 dias - mostrar cada dia
      for (let i = 6; i >= 0; i--) {
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - i)
        dataInicio.setHours(0, 0, 0, 0)
        
        const dataFim = new Date(dataInicio)
        dataFim.setDate(dataFim.getDate() + 1)

        const disparosPeriodo = todosDisparos.filter(d => {
          const dataDisparo = new Date(d.enviado_em || d.created_at)
          return dataDisparo >= dataInicio && dataDisparo < dataFim
        })

        evolucaoMensal.push({
          name: dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          enviadas: disparosPeriodo.length,
          entregues: disparosPeriodo.filter(d => 
            d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
          ).length,
          lidas: disparosPeriodo.filter(d => d.status === 'lido').length,
          erros: disparosPeriodo.filter(d => 
            d.status === 'erro' || d.status === 'falhou' || d.status === 'failed'
          ).length
        })
      }
    } else if (periodo === '30d') {
      // Últimos 30 dias - mostrar por semana (4 semanas)
      for (let i = 3; i >= 0; i--) {
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - (i * 7 + 7))
        dataInicio.setHours(0, 0, 0, 0)
        
        const dataFim = new Date(dataInicio)
        dataFim.setDate(dataFim.getDate() + 7)

        const disparosPeriodo = todosDisparos.filter(d => {
          const dataDisparo = new Date(d.enviado_em || d.created_at)
          return dataDisparo >= dataInicio && dataDisparo < dataFim
        })

        evolucaoMensal.push({
          name: `Sem ${4 - i}`,
          enviadas: disparosPeriodo.length,
          entregues: disparosPeriodo.filter(d => 
            d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
          ).length,
          lidas: disparosPeriodo.filter(d => d.status === 'lido').length,
          erros: disparosPeriodo.filter(d => 
            d.status === 'erro' || d.status === 'falhou' || d.status === 'failed'
          ).length
        })
      }
    } else if (periodo === '90d') {
      // Últimos 90 dias - mostrar por mês (3 meses)
      for (let i = 2; i >= 0; i--) {
        const dataInicio = new Date()
        dataInicio.setMonth(dataInicio.getMonth() - i)
        dataInicio.setDate(1)
        dataInicio.setHours(0, 0, 0, 0)
        
        const dataFim = new Date(dataInicio)
        dataFim.setMonth(dataFim.getMonth() + 1)

        const disparosPeriodo = todosDisparos.filter(d => {
          const dataDisparo = new Date(d.enviado_em || d.created_at)
          return dataDisparo >= dataInicio && dataDisparo < dataFim
        })

        evolucaoMensal.push({
          name: dataInicio.toLocaleDateString('pt-BR', { month: 'short' }),
          enviadas: disparosPeriodo.length,
          entregues: disparosPeriodo.filter(d => 
            d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
          ).length,
          lidas: disparosPeriodo.filter(d => d.status === 'lido').length,
          erros: disparosPeriodo.filter(d => 
            d.status === 'erro' || d.status === 'falhou' || d.status === 'failed'
          ).length
        })
      }
    } else {
      // Último ano - mostrar por mês (12 meses)
      for (let i = 11; i >= 0; i--) {
        const dataInicio = new Date()
        dataInicio.setMonth(dataInicio.getMonth() - i)
        dataInicio.setDate(1)
        dataInicio.setHours(0, 0, 0, 0)
        
        const dataFim = new Date(dataInicio)
        dataFim.setMonth(dataFim.getMonth() + 1)

        const disparosPeriodo = todosDisparos.filter(d => {
          const dataDisparo = new Date(d.enviado_em || d.created_at)
          return dataDisparo >= dataInicio && dataDisparo < dataFim
        })

        evolucaoMensal.push({
          name: dataInicio.toLocaleDateString('pt-BR', { month: 'short' }),
          enviadas: disparosPeriodo.length,
          entregues: disparosPeriodo.filter(d => 
            d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
          ).length,
          lidas: disparosPeriodo.filter(d => d.status === 'lido').length,
          erros: disparosPeriodo.filter(d => 
            d.status === 'erro' || d.status === 'falhou' || d.status === 'failed'
          ).length
        })
      }
    }

    // Distribuição por status
    const distribuicaoStatus = [
      { 
        name: 'Entregues', 
        value: taxaEntrega, 
        color: '#10b981' 
      },
      { 
        name: 'Pendentes', 
        value: totalEnviadas > 0 ? ((todosDisparos.filter(d => d.status === 'pendente' || d.status === 'pending').length / totalEnviadas) * 100) : 0, 
        color: '#f59e0b' 
      },
      { 
        name: 'Erros', 
        value: taxaErro, 
        color: '#ef4444' 
      }
    ]

    // Performance por campanha
    const performanceCampanhas: Array<{ nome: string; enviadas: number; entregues: number; taxaEntrega: number }> = []
    
    if (campanhas && campanhas.length > 0) {
      for (const campanha of campanhas) {
        const disparosCampanha = todosDisparos.filter(d => d.campanha_id === campanha.id)
        const enviadas = disparosCampanha.length
        const entregues = disparosCampanha.filter(d => 
          d.status === 'entregue' || d.status === 'enviado' || d.status === 'lido'
        ).length
        const taxaEntrega = enviadas > 0 ? (entregues / enviadas) * 100 : 0

        if (enviadas > 0) {
          performanceCampanhas.push({
            nome: campanha.nome,
            enviadas,
            entregues,
            taxaEntrega: Math.round(taxaEntrega * 10) / 10
          })
        }
      }
    }

    // Ordenar por enviadas (maior primeiro)
    performanceCampanhas.sort((a, b) => b.enviadas - a.enviadas)

    // Horários de maior engajamento (agrupar por hora do dia)
    const horariosEngajamento: Array<{ hora: string; envios: number }> = []
    const enviosPorHora: { [key: string]: number } = {}

    todosDisparos.forEach(d => {
      const dataDisparo = new Date(d.enviado_em || d.created_at)
      const hora = dataDisparo.getHours().toString().padStart(2, '0') + ':00'
      enviosPorHora[hora] = (enviosPorHora[hora] || 0) + 1
    })

    // Criar array de horários (8h às 19h)
    for (let h = 8; h <= 19; h++) {
      const hora = h.toString().padStart(2, '0') + ':00'
      horariosEngajamento.push({
        hora,
        envios: enviosPorHora[hora] || 0
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEnviadas,
        totalEntregues,
        totalLidas,
        totalErros,
        taxaEntrega: Math.round(taxaEntrega * 10) / 10,
        taxaLeitura: Math.round(taxaLeitura * 10) / 10,
        taxaErro: Math.round(taxaErro * 10) / 10,
        evolucaoMensal,
        distribuicaoStatus,
        performanceCampanhas: performanceCampanhas.slice(0, 10), // Top 10 campanhas
        horariosEngajamento
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}

