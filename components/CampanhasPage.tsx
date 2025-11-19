'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PlayIcon,
  PauseIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Campanha } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'

// Mock data - em produção viria do Supabase
const mockCampanhas: Campanha[] = [
  {
    id: '1',
    nome: 'Promoção Black Friday',
    mensagem: '🎉 Black Friday chegou! Aproveite 50% de desconto em todos os produtos. Válido até domingo!',
    destinatarios: ['5511999999999', '5511888888888'],
    agendamento: '2024-01-20T10:00:00Z',
    status: 'agendada',
    created_at: '2024-01-15T10:30:00Z',
    user_id: 'user-1'
  },
  {
    id: '2',
    nome: 'Lembrete de Pagamento',
    mensagem: 'Olá {{nome}}, seu pagamento vence em 3 dias. Acesse o link para pagar: {{link}}',
    destinatarios: ['5511777777777'],
    agendamento: undefined,
    status: 'enviando',
    created_at: '2024-01-14T14:20:00Z',
    user_id: 'user-1'
  },
  {
    id: '3',
    nome: 'Novo Produto',
    mensagem: 'Conheça nosso novo produto! Inovação e qualidade para você.',
    destinatarios: ['5511666666666', '5511555555555'],
    agendamento: undefined,
    status: 'concluida',
    created_at: '2024-01-13T09:15:00Z',
    user_id: 'user-1'
  },
  {
    id: '4',
    nome: 'Pesquisa de Satisfação',
    mensagem: 'Como foi sua experiência conosco? Responda nossa pesquisa rápida!',
    destinatarios: [],
    agendamento: undefined,
    status: 'rascunho',
    created_at: '2024-01-12T16:45:00Z',
    user_id: 'user-1'
  }
]

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>(mockCampanhas)
  const [filteredCampanhas, setFilteredCampanhas] = useState<Campanha[]>(mockCampanhas)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'pausada'>('todos')
  const [selectedCampanhas, setSelectedCampanhas] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create')
  const [loading, setLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Filtros
  useEffect(() => {
    let filtered = campanhas

    if (searchTerm) {
      filtered = filtered.filter(campanha =>
        campanha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campanha.mensagem.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(campanha => campanha.status === statusFilter)
    }

    setFilteredCampanhas(filtered)
  }, [campanhas, searchTerm, statusFilter])

  const handleSelectCampanha = (campanhaId: string) => {
    setSelectedCampanhas(prev =>
      prev.includes(campanhaId)
        ? prev.filter(id => id !== campanhaId)
        : [...prev, campanhaId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCampanhas.length === filteredCampanhas.length) {
      setSelectedCampanhas([])
    } else {
      setSelectedCampanhas(filteredCampanhas.map(c => c.id))
    }
  }

  const handleStatusChange = async (campanhaId: string, newStatus: Campanha['status']) => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCampanhas(prev => prev.map(c => 
        c.id === campanhaId ? { ...c, status: newStatus } : c
      ))
      toast.success('Status da campanha atualizado!')
    } catch (error) {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCampanha = async (campanhaId: string) => {
    const campanha = campanhas.find(c => c.id === campanhaId)
    const nomeCampanha = campanha?.nome || 'esta campanha'
    
    setConfirmModal({
      open: true,
      title: 'Excluir campanha',
      message: `Tem certeza que deseja excluir a campanha "${nomeCampanha}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setConfirmModal({ open: false, title: '', message: '', onConfirm: () => {} })
        confirmarExclusao(campanhaId)
      }
    })
  }

  const confirmarExclusao = async (campanhaId: string) => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCampanhas(prev => prev.filter(c => c.id !== campanhaId))
      toast.success('Campanha excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir campanha')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Campanha['status']) => {
    switch (status) {
      case 'rascunho':
        return 'bg-secondary-100 text-secondary-800'
      case 'agendada':
        return 'bg-warning-100 text-warning-800'
      case 'enviando':
        return 'bg-primary-100 text-primary-800'
      case 'concluida':
        return 'bg-success-100 text-success-800'
      case 'pausada':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const getStatusText = (status: Campanha['status']) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'agendada':
        return 'Agendada'
      case 'enviando':
        return 'Enviando'
      case 'concluida':
        return 'Concluída'
      case 'pausada':
        return 'Pausada'
      default:
        return status
    }
  }

  const openModal = (type: 'create' | 'edit' | 'view') => {
    setModalType(type)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Campanhas</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Gerencie suas campanhas de disparo WhatsApp
          </p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn btn-primary btn-md"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-secondary-600 font-semibold text-sm">
                  {campanhas.length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {campanhas.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {campanhas.filter(c => c.status === 'enviando').length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Enviando</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {campanhas.filter(c => c.status === 'enviando').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <span className="text-warning-600 font-semibold text-sm">
                  {campanhas.filter(c => c.status === 'agendada').length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Agendadas</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {campanhas.filter(c => c.status === 'agendada').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <span className="text-success-600 font-semibold text-sm">
                  {campanhas.filter(c => c.status === 'concluida').length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Concluídas</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {campanhas.filter(c => c.status === 'concluida').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input w-48"
            >
              <option value="todos">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="agendada">Agendada</option>
              <option value="enviando">Enviando</option>
              <option value="concluida">Concluída</option>
              <option value="pausada">Pausada</option>
            </select>
          </div>
          
          {selectedCampanhas.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">
                {selectedCampanhas.length} selecionada(s)
              </span>
              <button
                onClick={() => handleStatusChange(selectedCampanhas[0], 'pausada')}
                className="btn btn-warning btn-sm"
              >
                <PauseIcon className="h-4 w-4 mr-1" />
                Pausar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCampanhas.length === filteredCampanhas.length && filteredCampanhas.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Mensagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Destinatários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Agendamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredCampanhas.map((campanha) => (
                <tr key={campanha.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCampanhas.includes(campanha.id)}
                      onChange={() => handleSelectCampanha(campanha.id)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">
                      {campanha.nome}
                    </div>
                    <div className="text-sm text-secondary-500">
                      Criada em {formatDate(campanha.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-secondary-900 max-w-xs truncate">
                      {campanha.mensagem}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {campanha.destinatarios.length} destinatário(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campanha.status)}`}>
                      {getStatusText(campanha.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {campanha.agendamento ? (
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(campanha.agendamento)}
                      </div>
                    ) : (
                      'Imediato'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openModal('view')}
                        className="text-secondary-600 hover:text-secondary-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit')}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {campanha.status === 'enviando' && (
                        <button
                          onClick={() => handleStatusChange(campanha.id, 'pausada')}
                          className="text-warning-600 hover:text-warning-900"
                        >
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      {campanha.status === 'pausada' && (
                        <button
                          onClick={() => handleStatusChange(campanha.id, 'enviando')}
                          className="text-success-600 hover:text-success-900"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampanha(campanha.id)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary-700">
          Mostrando {filteredCampanhas.length} de {campanhas.length} campanhas
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-ghost btn-sm">Anterior</button>
          <button className="btn btn-primary btn-sm">1</button>
          <button className="btn btn-ghost btn-sm">2</button>
          <button className="btn btn-ghost btn-sm">3</button>
          <button className="btn btn-ghost btn-sm">Próximo</button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  )
}
