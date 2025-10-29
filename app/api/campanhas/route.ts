import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/campaignService'
import { CriarCampanhaRequest, AtualizarCampanhaRequest } from '@/lib/campaignTypes'

// GET /api/campanhas - Listar campanhas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'todos'

    const campanhas = await CampaignService.getCampanhas()

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

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/campanhas - Criar campanha
export async function POST(request: NextRequest) {
  try {
    const body: CriarCampanhaRequest = await request.json()
    const { nome, mensagem, criterios, configuracao } = body

    // Validar dados obrigatórios
    if (!nome || !mensagem || !criterios || !configuracao) {
      return NextResponse.json({ 
        error: 'Nome, mensagem, critérios e configuração são obrigatórios' 
      }, { status: 400 })
    }

    // Validar configurações
    if (configuracao.clientesPorLote < 1 || configuracao.clientesPorLote > 1000) {
      return NextResponse.json({ 
        error: 'Clientes por lote deve estar entre 1 e 1000' 
      }, { status: 400 })
    }

    if (configuracao.intervaloMensagens < 1 || configuracao.intervaloMensagens > 300) {
      return NextResponse.json({ 
        error: 'Intervalo entre mensagens deve estar entre 1 e 300 segundos' 
      }, { status: 400 })
    }

    // Criar campanha
    const campanha = await CampaignService.criarCampanha({
      nome,
      mensagem,
      criterios,
      configuracao
    })

    if (!campanha) {
      return NextResponse.json({ 
        error: 'Erro ao criar campanha' 
      }, { status: 500 })
    }

    return NextResponse.json({ data: campanha }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}