import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/campaignService'
import { AtualizarCampanhaRequest, ControleCampanhaRequest } from '@/lib/campaignTypes'

// GET /api/campanhas/[id] - Buscar campanha por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { data: campanha, error } = await CampaignService.getCampanhaById(id)

    if (error || !campanha) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data: campanha })
  } catch (error) {
    console.error('Erro ao buscar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/campanhas/[id] - Atualizar campanha
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: AtualizarCampanhaRequest = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Verificar se campanha existe
    const { data: campanhaExistente, error: campanhaError } = await CampaignService.getCampanhaById(id)
    if (campanhaError || !campanhaExistente) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Não permitir editar campanhas em processamento
    if (campanhaExistente.progresso?.status === 'processando') {
      return NextResponse.json({ 
        error: 'Não é possível editar campanha em processamento' 
      }, { status: 400 })
    }

    const sucesso = await CampaignService.atualizarCampanha(id, body)

    if (!sucesso) {
      return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 })
    }

    // Buscar campanha atualizada
    const { data: campanhaAtualizada } = await CampaignService.getCampanhaById(id)
    return NextResponse.json({ data: campanhaAtualizada })
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/campanhas/[id] - Deletar campanha
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Verificar se campanha existe
    const { data: campanha, error: campanhaError } = await CampaignService.getCampanhaById(id)
    if (campanhaError || !campanha) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Não permitir deletar campanhas em processamento
    if (campanha.progresso?.status === 'processando') {
      return NextResponse.json({ 
        error: 'Não é possível deletar campanha em processamento' 
      }, { status: 400 })
    }

    const sucesso = await CampaignService.deletarCampanha(id)

    if (!sucesso) {
      return NextResponse.json({ error: 'Erro ao deletar campanha' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Campanha deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
