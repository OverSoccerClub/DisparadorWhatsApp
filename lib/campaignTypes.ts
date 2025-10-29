// Interfaces para sistema de campanhas de disparo

export interface CampanhaCriterios {
  status: 'ativo' | 'inativo' | 'todos'
  // Futuro: região, segmento, tags, etc.
}

export interface CampanhaConfiguracao {
  clientesPorLote: number // padrão: 100
  intervaloMensagens: number // padrão: 10 segundos
  agendamento: 'imediato' | Date
}

export interface CampanhaProgresso {
  totalClientes: number
  totalLotes: number
  lotesProcessados: number
  clientesEnviados: number
  clientesFalharam: number
  status: 'rascunho' | 'agendada' | 'processando' | 'pausada' | 'concluida'
  iniciadoEm?: Date
  concluidoEm?: Date
  tempoEstimado?: number // em minutos
}

export interface CampanhaRelatorio {
  entregues: number
  falhas: number
  engajamento: {
    lidos: number
    respondidos: number
    cliques: number
  }
  detalhesFalhas: Array<{
    telefone: string
    motivo: string
    tentativa: number
  }>
}

export interface Campanha {
  id: string
  nome: string
  mensagem: string
  criterios: CampanhaCriterios
  configuracao: CampanhaConfiguracao
  progresso: CampanhaProgresso
  relatorio: CampanhaRelatorio
  created_at: string
  updated_at: string
}

export interface LoteCampanha {
  id: string
  campanha_id: string
  numero_lote: number
  clientes: Array<{
    id: string
    nome: string
    telefone: string
  }>
  status: 'pendente' | 'processando' | 'concluido' | 'erro'
  processado_at?: string
  created_at: string
}

export interface DisparoIndividual {
  id: string
  lote_id: string
  cliente_id: string
  telefone: string
  mensagem: string
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'erro'
  resposta?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  error_message?: string
  tentativas: number
  created_at: string
}

// Tipos para criação de campanha
export interface CriarCampanhaRequest {
  nome: string
  mensagem: string
  criterios: CampanhaCriterios
  configuracao: CampanhaConfiguracao
}

// Tipos para atualização de campanha
export interface AtualizarCampanhaRequest {
  nome?: string
  mensagem?: string
  criterios?: CampanhaCriterios
  configuracao?: CampanhaConfiguracao
}

// Tipos para controle de campanha
export interface ControleCampanhaRequest {
  acao: 'iniciar' | 'pausar' | 'retomar' | 'cancelar'
}

// Tipos para relatórios
export interface RelatorioCampanha {
  campanha: Campanha
  estatisticas: {
    totalClientes: number
    clientesEnviados: number
    clientesFalharam: number
    taxaEntrega: number
    tempoTotal: number
    velocidadeMedia: number
  }
  lotes: Array<{
    numero: number
    status: string
    clientes: number
    enviados: number
    falhas: number
    tempoProcessamento: number
  }>
  engajamento: {
    lidos: number
    respondidos: number
    cliques: number
    taxaLeitura: number
    taxaResposta: number
  }
}
