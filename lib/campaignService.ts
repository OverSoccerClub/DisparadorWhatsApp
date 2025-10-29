import { supabase } from './supabaseClient'
import { 
  Campanha, 
  LoteCampanha, 
  CriarCampanhaRequest, 
  AtualizarCampanhaRequest,
  ControleCampanhaRequest,
  RelatorioCampanha
} from './campaignTypes'

export class CampaignService {
  // Buscar todas as campanhas
  static async getCampanhas(): Promise<Campanha[]> {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar campanhas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      return []
    }
  }

  // Buscar campanha por ID
  static async getCampanhaById(id: string): Promise<{ data: Campanha | null, error: any }> {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar campanha:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro ao buscar campanha:', error)
      return { data: null, error }
    }
  }

  // Criar nova campanha
  static async criarCampanha(campanha: CriarCampanhaRequest): Promise<Campanha | null> {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .insert([{
          nome: campanha.nome,
          mensagem: campanha.mensagem,
          criterios: campanha.criterios,
          configuracao: campanha.configuracao,
          status: 'rascunho',
          progresso: {
            totalClientes: 0,
            totalLotes: 0,
            lotesProcessados: 0,
            clientesEnviados: 0,
            clientesFalharam: 0,
            status: 'rascunho'
          },
          relatorio: {
            entregues: 0,
            falhas: 0,
            engajamento: {
              lidos: 0,
              respondidos: 0,
              cliques: 0
            },
            detalhesFalhas: []
          }
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar campanha:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      return null
    }
  }

  // Atualizar campanha
  static async atualizarCampanha(id: string, updates: AtualizarCampanhaRequest): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campanhas')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Erro ao atualizar campanha:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
      return false
    }
  }

  // Deletar campanha
  static async deletarCampanha(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar campanha:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar campanha:', error)
      return false
    }
  }

  // Controle de campanha (iniciar, pausar, retomar, cancelar)
  static async controlarCampanha(id: string, controle: ControleCampanhaRequest): Promise<boolean> {
    try {
      const { acao } = controle
      
      let statusUpdate = ''
      let progressoUpdate = {}

      switch (acao) {
        case 'iniciar':
          statusUpdate = 'processando'
          progressoUpdate = {
            status: 'processando',
            iniciadoEm: new Date().toISOString()
          }
          break
        case 'pausar':
          statusUpdate = 'pausada'
          progressoUpdate = {
            status: 'pausada'
          }
          break
        case 'retomar':
          statusUpdate = 'processando'
          progressoUpdate = {
            status: 'processando'
          }
          break
        case 'cancelar':
          statusUpdate = 'rascunho'
          progressoUpdate = {
            status: 'rascunho'
          }
          break
      }

      const { error } = await supabase
        .from('campanhas')
        .update({
          status: statusUpdate,
          progresso: progressoUpdate
        })
        .eq('id', id)

      if (error) {
        console.error('Erro ao controlar campanha:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao controlar campanha:', error)
      return false
    }
  }

  // Buscar clientes baseado nos critérios
  static async buscarClientesPorCriterios(criterios: any): Promise<any[]> {
    try {
      let query = supabase
        .from('disparos_sms')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros baseado nos critérios
      if (criterios.status && criterios.status !== 'todos') {
        query = query.eq('status', criterios.status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar clientes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return []
    }
  }

  // Criar lotes para uma campanha
  static async criarLotes(campanhaId: string, clientes: any[], clientesPorLote: number): Promise<boolean> {
    try {
      const lotes = []
      const totalLotes = Math.ceil(clientes.length / clientesPorLote)

      for (let i = 0; i < totalLotes; i++) {
        const inicio = i * clientesPorLote
        const fim = Math.min(inicio + clientesPorLote, clientes.length)
        const clientesLote = clientes.slice(inicio, fim)

        lotes.push({
          campanha_id: campanhaId,
          numero_lote: i + 1,
          clientes: clientesLote.map(cliente => ({
            id: cliente.id?.toString() || '',
            nome: cliente.nome,
            telefone: cliente.telefone
          })),
          status: 'pendente'
        })
      }

      const { error } = await supabase
        .from('lotes_campanha')
        .insert(lotes)

      if (error) {
        console.error('Erro ao criar lotes:', error)
        return false
      }

      // Atualizar progresso da campanha
      await supabase
        .from('campanhas')
        .update({
          progresso: {
            totalClientes: clientes.length,
            totalLotes: totalLotes,
            lotesProcessados: 0,
            clientesEnviados: 0,
            clientesFalharam: 0,
            status: 'agendada'
          }
        })
        .eq('id', campanhaId)

      return true
    } catch (error) {
      console.error('Erro ao criar lotes:', error)
      return false
    }
  }

  // Buscar lotes de uma campanha
  static async getLotesCampanha(campanhaId: string): Promise<LoteCampanha[]> {
    try {
      const { data, error } = await supabase
        .from('lotes_campanha')
        .select('*')
        .eq('campanha_id', campanhaId)
        .order('numero_lote', { ascending: true })

      if (error) {
        console.error('Erro ao buscar lotes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar lotes:', error)
      return []
    }
  }

  // Gerar relatório de campanha
  static async gerarRelatorio(campanhaId: string): Promise<RelatorioCampanha | null> {
    try {
      const campanha = await this.getCampanhaById(campanhaId)
      if (!campanha) return null

      const lotes = await this.getLotesCampanha(campanhaId)
      
      const estatisticas = {
        totalClientes: campanha.progresso.totalClientes,
        clientesEnviados: campanha.progresso.clientesEnviados,
        clientesFalharam: campanha.progresso.clientesFalharam,
        taxaEntrega: campanha.progresso.totalClientes > 0 
          ? (campanha.progresso.clientesEnviados / campanha.progresso.totalClientes) * 100 
          : 0,
        tempoTotal: 0, // TODO: Calcular baseado nos timestamps
        velocidadeMedia: 0 // TODO: Calcular baseado no tempo total
      }

      const relatorio: RelatorioCampanha = {
        campanha,
        estatisticas,
        lotes: lotes.map(lote => ({
          numero: lote.numero_lote,
          status: lote.status,
          clientes: lote.clientes.length,
          enviados: 0, // TODO: Calcular baseado nos disparos
          falhas: 0, // TODO: Calcular baseado nos disparos
          tempoProcessamento: 0 // TODO: Calcular baseado nos timestamps
        })),
        engajamento: campanha.relatorio.engajamento
      }

      return relatorio
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      return null
    }
  }
}
