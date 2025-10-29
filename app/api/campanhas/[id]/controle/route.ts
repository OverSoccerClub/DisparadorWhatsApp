import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/campaignService'
import { ControleCampanhaRequest } from '@/lib/campaignTypes'

// POST /api/campanhas/[id]/controle - Controlar campanha
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: ControleCampanhaRequest = await request.json()
    const { acao } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    if (!acao) {
      return NextResponse.json({ error: 'Ação é obrigatória' }, { status: 400 })
    }

    // Verificar se campanha existe
    const { data: campanha, error: campanhaError } = await CampaignService.getCampanhaById(id)
    if (campanhaError || !campanha) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Validar ações baseado no status atual
    const statusAtual = campanha.progresso?.status || 'rascunho'
    
    if (acao === 'iniciar' && statusAtual !== 'rascunho' && statusAtual !== 'agendada' && statusAtual !== 'pausada') {
      return NextResponse.json({ 
        error: 'Só é possível iniciar campanhas em rascunho, agendadas ou pausadas' 
      }, { status: 400 })
    }

    if (acao === 'pausar' && statusAtual !== 'processando') {
      return NextResponse.json({ 
        error: 'Só é possível pausar campanhas em processamento' 
      }, { status: 400 })
    }

    if (acao === 'retomar' && statusAtual !== 'pausada') {
      return NextResponse.json({ 
        error: 'Só é possível retomar campanhas pausadas' 
      }, { status: 400 })
    }

    if (acao === 'cancelar' && (statusAtual === 'processando' || statusAtual === 'concluida')) {
      return NextResponse.json({ 
        error: 'Não é possível cancelar campanhas em processamento ou concluídas' 
      }, { status: 400 })
    }

    // Executar controle
    const sucesso = await CampaignService.controlarCampanha(id, { acao })

    if (!sucesso) {
      return NextResponse.json({ error: 'Erro ao controlar campanha' }, { status: 500 })
    }

    // Se for iniciar, criar lotes se ainda não existirem
    if (acao === 'iniciar' && campanha.progresso.totalLotes === 0) {
      // Buscar clientes baseado nos critérios
      const clientes = await CampaignService.buscarClientesPorCriterios(campanha.criterios)
      
      if (clientes.length === 0) {
        return NextResponse.json({ 
          error: 'Nenhum cliente encontrado com os critérios especificados' 
        }, { status: 400 })
      }

      // Criar lotes
      const lotesCriados = await CampaignService.criarLotes(
        id, 
        clientes, 
        campanha.configuracao.clientesPorLote
      )

      if (!lotesCriados) {
        return NextResponse.json({ 
          error: 'Erro ao criar lotes da campanha' 
        }, { status: 500 })
      }
    }

    // Buscar campanha atualizada
    const { data: campanhaAtualizada } = await CampaignService.getCampanhaById(id)
    return NextResponse.json({ 
      data: campanhaAtualizada,
      message: `Campanha ${acao}da com sucesso`
    })
  } catch (error) {
    console.error('Erro ao controlar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
