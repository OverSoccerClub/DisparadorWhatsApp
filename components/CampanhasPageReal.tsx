'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  MegaphoneIcon, 
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  TrashIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Campanha } from '@/lib/campaignTypes'
import { formatDate } from '@/lib/utils'
import { useNotificationContext } from './NotificationProvider'
import CampanhaModal from './CampanhaModal'
import CampanhaDetalhesModal from './CampanhaDetalhesModal'
import NotificationDemo from './NotificationDemo'

export default function CampanhasPageReal() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const { showSuccess, showError, showWarning, showInfo, showLoading, updateNotification } = useNotificationContext()
  const [showModal, setShowModal] = useState(false)
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null)
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  useEffect(() => {
    loadCampanhas()
  }, [])

  const loadCampanhas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/campanhas')
      const result = await response.json()
      
      if (response.ok) {
        setCampanhas(result.data || [])
      } else {
        showError('Erro ao carregar campanhas', result.error || 'Não foi possível carregar as campanhas')
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
      showError('Erro ao carregar campanhas', 'Verifique sua conexão e tente novamente')
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar filtros
  const campanhasFiltradas = campanhas.filter(campanha => {
    // Filtro por nome
    if (filtros.nome && !campanha.nome.toLowerCase().includes(filtros.nome.toLowerCase())) {
      return false
    }
    
    // Filtro por status
    if (filtros.status && campanha.progresso?.status !== filtros.status) {
      return false
    }
    
    // Filtro por data
    if (filtros.dataInicio || filtros.dataFim) {
      const dataCampanha = new Date(campanha.created_at)
      
      if (filtros.dataInicio) {
        // Criar data de início do dia (00:00:00)
        const dataInicio = new Date(filtros.dataInicio + 'T00:00:00.000Z')
        if (dataCampanha < dataInicio) return false
      }
      
      if (filtros.dataFim) {
        // Criar data de fim do dia (23:59:59.999)
        const dataFim = new Date(filtros.dataFim + 'T23:59:59.999Z')
        if (dataCampanha > dataFim) return false
      }
    }
    
    return true
  })


  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      nome: '',
      status: '',
      dataInicio: '',
      dataFim: ''
    })
  }

  // Função para atualizar filtros
  const atualizarFiltro = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const handleControlarCampanha = async (campanhaId: string, acao: 'iniciar' | 'pausar' | 'retomar' | 'cancelar') => {
    try {
      const response = await fetch(`/api/campanhas/${campanhaId}/controle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao }),
      })

      if (response.ok) {
        const result = await response.json()
        showSuccess('Campanha controlada com sucesso!', result.message)
        loadCampanhas()
      } else {
        const error = await response.json()
        showError('Erro ao controlar campanha', error.error || 'Não foi possível executar a ação')
      }
    } catch (error) {
      console.error('Erro ao controlar campanha:', error)
      showError('Erro ao controlar campanha', 'Verifique sua conexão e tente novamente')
    }
  }

  const handleDeletarCampanha = async (campanhaId: string) => {
    // Buscar dados da campanha para exibir na confirmação
    const campanha = campanhas.find(c => c.id === campanhaId)
    const nomeCampanha = campanha?.nome || 'esta campanha'
    const statusCampanha = campanha?.progresso?.status || 'rascunho'
    const totalClientes = campanha?.progresso?.totalClientes || 0
    const clientesEnviados = campanha?.progresso?.clientesEnviados || 0

    // Verificar se a campanha está em processamento
    const isProcessing = statusCampanha === 'processando'
    const hasProgress = totalClientes > 0 || clientesEnviados > 0

    let mensagemDetalhada = `Tem certeza que deseja excluir "${nomeCampanha}"?\n\n`
    
    if (isProcessing) {
      mensagemDetalhada += `⚠️ ATENÇÃO: Esta campanha está em processamento e tem ${clientesEnviados} mensagens já enviadas.\n\n`
    }
    
    if (hasProgress) {
      mensagemDetalhada += `📊 Dados que serão perdidos:\n`
      mensagemDetalhada += `• ${totalClientes} clientes cadastrados\n`
      mensagemDetalhada += `• ${clientesEnviados} mensagens enviadas\n`
      mensagemDetalhada += `• Relatórios e estatísticas\n\n`
    }
    
    mensagemDetalhada += `Esta ação não pode ser desfeita e todos os dados da campanha serão perdidos permanentemente.`

    showWarning(
      'Confirmar exclusão de campanha',
      mensagemDetalhada,
      [
        {
          label: isProcessing ? 'Excluir Mesmo Assim' : 'Sim, Excluir',
          action: () => confirmarExclusao(campanhaId),
          variant: 'danger'
        },
        {
          label: 'Cancelar',
          action: () => {},
          variant: 'secondary'
        }
      ]
    )
  }

  const confirmarExclusao = async (campanhaId: string) => {
    try {
      const response = await fetch(`/api/campanhas/${campanhaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess(
          'Campanha excluída com sucesso!', 
          'A campanha e todos os seus dados foram removidos permanentemente do sistema.',
          [
            {
              label: 'Ver Campanhas',
              action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
              variant: 'primary'
            }
          ]
        )
        loadCampanhas()
      } else {
        const error = await response.json()
        showError('Erro ao excluir campanha', error.error || 'Não foi possível excluir a campanha')
      }
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
      showError('Erro ao excluir campanha', 'Verifique sua conexão e tente novamente')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-secondary-100 text-secondary-800'
      case 'agendada':
        return 'bg-warning-100 text-warning-800'
      case 'processando':
        return 'bg-primary-100 text-primary-800'
      case 'pausada':
        return 'bg-error-100 text-error-800'
      case 'concluida':
        return 'bg-success-100 text-success-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <MegaphoneIcon className="h-4 w-4" />
      case 'agendada':
        return <ClockIcon className="h-4 w-4" />
      case 'processando':
        return <PlayIcon className="h-4 w-4" />
      case 'pausada':
        return <PauseIcon className="h-4 w-4" />
      case 'concluida':
        return <CheckCircleIcon className="h-4 w-4" />
      default:
        return <MegaphoneIcon className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'agendada':
        return 'Agendada'
      case 'processando':
        return 'Processando'
      case 'pausada':
        return 'Pausada'
      case 'concluida':
        return 'Concluída'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
                <MegaphoneIcon className="h-6 w-6 mr-2" />
                Campanhas
              </h1>
              <p className="mt-1 text-sm text-secondary-600">
                Gerencie suas campanhas de disparo em massa
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`btn ${mostrarFiltros ? 'btn-primary' : 'btn-secondary'} btn-md`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary btn-md"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Campanha
              </button>
            </div>
          </div>

          {/* Filtros */}
          {mostrarFiltros && (
            <div className="bg-white rounded-lg border border-secondary-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-secondary-900 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filtros de Busca
                </h3>
                <button
                  onClick={() => setMostrarFiltros(false)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por Nome */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                    Nome da Campanha
                  </label>
                  <input
                    type="text"
                    value={filtros.nome}
                    onChange={(e) => atualizarFiltro('nome', e.target.value)}
                    placeholder="Digite o nome da campanha..."
                    className="input"
                  />
                </div>

                {/* Filtro por Status */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <ChartBarIcon className="h-4 w-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    value={filtros.status}
                    onChange={(e) => atualizarFiltro('status', e.target.value)}
                    className="input"
                  >
                    <option value="">Todos os status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="agendada">Agendada</option>
                    <option value="processando">Processando</option>
                    <option value="pausada">Pausada</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Filtro por Data Início */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => atualizarFiltro('dataInicio', e.target.value)}
                    className="input"
                  />
                </div>

                {/* Filtro por Data Fim */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => atualizarFiltro('dataFim', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Botões de Ação dos Filtros */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-secondary-200">
                <div className="text-sm text-secondary-500">
                  {campanhasFiltradas.length} de {campanhas.length} campanhas encontradas
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={limparFiltros}
                    className="btn btn-secondary btn-sm"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Campanhas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campanhasFiltradas.map((campanha) => (
          <div key={campanha.id} className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900 truncate">
                {campanha.nome}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campanha.progresso?.status || 'rascunho')}`}>
                {getStatusIcon(campanha.progresso?.status || 'rascunho')}
                <span className="ml-1">{getStatusText(campanha.progresso?.status || 'rascunho')}</span>
              </span>
            </div>

            {/* Preview do WhatsApp */}
            <div className="mb-4 flex justify-end">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-80 transform scale-90 origin-top h-[500px] flex flex-col">
                {/* Header do WhatsApp */}
                <div className="bg-green-700 text-white p-2.5 flex items-center space-x-2">
                  <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">C</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">Cliente</h3>
                    <p className="text-green-200 text-xs">Online</p>
                  </div>
                  <div className="flex space-x-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>

                {/* Área de mensagens */}
                <div className="bg-amber-50 p-3 flex-1 overflow-y-auto" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                  {/* Balão da mensagem */}
                  <div className="flex justify-end mb-2">
                    <div className="max-w-64">
                      <div className="bg-green-200 text-gray-800 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm relative min-h-[60px]">
                        <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ fontSize: '11px' }}>
                          {campanha.mensagem}
                        </p>
                        {/* Cauda do balão */}
                        <div className="absolute -bottom-1 right-0 w-3 h-3 bg-green-200 transform rotate-45"></div>
                      </div>
                      <div className="flex justify-end mt-1 items-center space-x-1">
                        <span className="text-xs text-gray-500">12:34</span>
                        <div className="flex -space-x-1">
                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input do WhatsApp */}
                <div className="bg-white p-2.5 border-t border-gray-200">
                  <div className="flex items-center space-x-1.5">
                    <button className="w-7 h-7 text-gray-500 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 flex items-center space-x-1.5">
                      <span className="text-gray-500 text-xs">Digite uma mensagem</span>
                      <div className="flex space-x-1.5 ml-auto">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                        </svg>
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                    <button className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-secondary-500">Clientes</span>
                <div className="text-sm font-medium text-secondary-900">
                  {(campanha.progresso?.totalClientes || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-xs text-secondary-500">Enviados</span>
                <div className="text-sm font-medium text-success-600">
                  {(campanha.progresso?.clientesEnviados || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {campanha.progresso?.status === 'processando' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-secondary-600 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(((campanha.progresso?.lotesProcessados || 0) / (campanha.progresso?.totalLotes || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((campanha.progresso?.lotesProcessados || 0) / (campanha.progresso?.totalLotes || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Data */}
            <div className="text-xs text-secondary-500 mb-4">
              Criada em {formatDate(campanha.created_at)}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {campanha.progresso?.status === 'rascunho' && (
                  <button
                    onClick={() => handleControlarCampanha(campanha.id, 'iniciar')}
                    className="btn btn-success btn-sm"
                    title="Iniciar campanha"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}

                {campanha.progresso?.status === 'processando' && (
                  <button
                    onClick={() => handleControlarCampanha(campanha.id, 'pausar')}
                    className="btn btn-warning btn-sm"
                    title="Pausar campanha"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}

                {campanha.progresso?.status === 'pausada' && (
                  <button
                    onClick={() => handleControlarCampanha(campanha.id, 'retomar')}
                    className="btn btn-primary btn-sm"
                    title="Retomar campanha"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCampanha(campanha)}
                  className="btn btn-secondary btn-sm"
                  title="Ver detalhes"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDeletarCampanha(campanha.id)}
                  className="btn btn-error btn-sm"
                  title="Excluir campanha"
                  disabled={campanha.progresso?.status === 'processando'}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

          {campanhasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <div className="text-secondary-400 mb-4">
                <MegaphoneIcon className="h-12 w-12 mx-auto" />
              </div>
              {campanhas.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    Nenhuma campanha criada
                  </h3>
                  <p className="text-secondary-500 mb-4">
                    Comece criando sua primeira campanha de disparo
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Primeira Campanha
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    Nenhuma campanha encontrada
                  </h3>
                  <p className="text-secondary-500 mb-4">
                    Tente ajustar os filtros de busca ou limpar os filtros
                  </p>
                  <button
                    onClick={limparFiltros}
                    className="btn btn-secondary"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </button>
                </>
              )}
            </div>
          )}

      {/* Modal de Criação */}
      <CampanhaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadCampanhas}
      />

      {/* Modal de Detalhes */}
      <CampanhaDetalhesModal
        isOpen={selectedCampanha !== null}
        onClose={() => setSelectedCampanha(null)}
        campanha={selectedCampanha}
      />
      
      {/* Demo de notificações - desabilitado */}
      {/* <NotificationDemo /> */}
    </div>
  )
}
