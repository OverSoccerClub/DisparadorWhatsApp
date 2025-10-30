'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Disparo, Cliente } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
// Modal original (ativo)
import DisparoModal from './DisparoModal'
import ConfirmModal from './ConfirmModal'
import WahaDispatchModal from './WahaDispatchModal'

export default function DisparosPage() {
  const [disparos, setDisparos] = useState<Disparo[]>([])
  const [filteredDisparos, setFilteredDisparos] = useState<Disparo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'enviado' | 'entregue' | 'falhou' | 'cancelado'>('todos')
  const [showDisparoModal, setShowDisparoModal] = useState(false)
  const [showWahaModal, setShowWahaModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [dispatchMethod, setDispatchMethod] = useState<'evolution' | 'waha'>('evolution')
  const [dateFilters, setDateFilters] = useState({
    dataInicio: '',
    dataFim: '',
    tipoData: 'created_at' as 'created_at' | 'enviado_em'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Carregar dados da API
  const loadDisparos = async (page = 1, search = '', status = 'todos', dataInicio = '', dataFim = '', tipoData = 'created_at') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
        status,
        data_inicio: dataInicio,
        data_fim: dataFim,
        tipo_data: tipoData
      })

      const response = await fetch(`/api/disparos?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDisparos(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
        setFilteredDisparos(data.data || [])
      } else {
        toast.error('Erro ao carregar disparos')
      }
    } catch (error) {
      console.error('Erro ao carregar disparos:', error)
      toast.error('Erro ao carregar disparos')
    } finally {
      setLoading(false)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      
      if (response.ok) {
        setClientes(data.data || [])
      } else {
        console.error('Erro ao carregar clientes:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadDisparos()
    loadClientes()
  }, [])

  // Filtros
  useEffect(() => {
    loadDisparos(1, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
  }, [searchTerm, statusFilter, dateFilters])

  const handleRefresh = async () => {
    await loadDisparos(pagination.page, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
    toast.success('Dados atualizados!')
  }

  const handlePageChange = (page: number) => {
    loadDisparos(page, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
  }

  const handleDeleteDisparo = (disparoId: string, telefone: string) => {
    setConfirmModal({
      open: true,
      title: 'Excluir Disparo',
      message: `Tem certeza que deseja excluir o disparo para ${telefone}? Esta ação não pode ser desfeita.`,
      onConfirm: () => executeDelete(disparoId)
    })
  }

  const executeDelete = async (disparoId: string) => {
    setConfirmModal({ open: false, title: '', message: '', onConfirm: () => {} })
    
    try {
      const response = await fetch(`/api/disparos/${disparoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Disparo excluído com sucesso!')
        // Recarregar a lista
        await loadDisparos(pagination.page, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir disparo')
      }
    } catch (error) {
      console.error('Erro ao excluir disparo:', error)
      toast.error('Erro ao excluir disparo')
    }
  }

  const getStatusColor = (status: Disparo['status']) => {
    switch (status) {
      case 'pendente':
        return 'bg-warning-100 text-warning-800'
      case 'enviado':
        return 'bg-primary-100 text-primary-800'
      case 'entregue':
        return 'bg-success-100 text-success-800'
      case 'falhou':
        return 'bg-error-100 text-error-800'
      case 'cancelado':
        return 'bg-secondary-100 text-secondary-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const getStatusText = (status: Disparo['status']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente'
      case 'enviado':
        return 'Enviado'
      case 'entregue':
        return 'Entregue'
      case 'falhou':
        return 'Falhou'
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getStatusIcon = (status: Disparo['status']) => {
    switch (status) {
      case 'pendente':
        return <ClockIcon className="h-4 w-4" />
      case 'enviado':
        return <PaperAirplaneIcon className="h-4 w-4" />
      case 'entregue':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'falhou':
        return <ExclamationCircleIcon className="h-4 w-4" />
      case 'cancelado':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const stats = {
    total: pagination.total,
    pendentes: disparos.filter(d => d.status === 'pendente').length,
    enviados: disparos.filter(d => d.status === 'enviado').length,
    entregues: disparos.filter(d => d.status === 'entregue').length,
    falhas: disparos.filter(d => d.status === 'falhou').length,
    cancelados: disparos.filter(d => d.status === 'cancelado').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <PaperAirplaneIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
              <PaperAirplaneIcon className="h-6 w-6 mr-2 text-primary-600" />
              Disparos
            </h1>
            <p className="mt-1 text-sm text-secondary-600 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Histórico e status de todos os disparos realizados
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {/* Seletor de método de envio (Evolution x WAHA) */}
          <div className="hidden lg:flex items-center bg-secondary-100 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setDispatchMethod('evolution')}
              className={`px-3 py-2 text-sm font-medium ${dispatchMethod === 'evolution' ? 'bg-white text-primary-700' : 'text-secondary-700'}`}
              title="Evolution API"
            >
              Evolution
            </button>
            <button
              type="button"
              onClick={() => setDispatchMethod('waha')}
              className={`px-3 py-2 text-sm font-medium ${dispatchMethod === 'waha' ? 'bg-white text-primary-700' : 'text-secondary-700'}`}
              title="WAHA API"
            >
              WAHA
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-secondary btn-md"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => {
              if (dispatchMethod === 'waha') {
                setShowWahaModal(true)
              } else {
                setShowDisparoModal(true)
              }
            }}
            className="btn btn-primary btn-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Disparo ({dispatchMethod === 'waha' ? 'WAHA' : 'Evolution'})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-secondary-600 font-semibold text-sm">
                  {stats.total}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <span className="text-warning-600 font-semibold text-sm">
                  {stats.pendentes}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Pendentes</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.pendentes}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {stats.enviados}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Enviados</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.enviados}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <span className="text-success-600 font-semibold text-sm">
                  {stats.entregues}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Entregues</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.entregues}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center">
                <span className="text-error-600 font-semibold text-sm">
                  {stats.falhas}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Falhas</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.falhas}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-secondary-600 font-semibold text-sm">
                  {stats.cancelados}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Cancelados</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {stats.cancelados}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por telefone ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input w-40"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="falhou">Falhou</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Tipo de Data */}
          <select
            value={dateFilters.tipoData}
            onChange={(e) => setDateFilters(prev => ({ ...prev, tipoData: e.target.value as 'created_at' | 'enviado_em' }))}
            className="input w-40"
          >
            <option value="created_at">Data de criação</option>
            <option value="enviado_em">Data de envio</option>
          </select>

          {/* Data Início */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-secondary-700 whitespace-nowrap">De:</label>
            <input
              type="date"
              value={dateFilters.dataInicio}
              onChange={(e) => setDateFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              className="input w-36"
            />
          </div>

          {/* Data Fim */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-secondary-700 whitespace-nowrap">Até:</label>
            <input
              type="date"
              value={dateFilters.dataFim}
              onChange={(e) => setDateFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              className="input w-36"
            />
          </div>

          {/* Botão Limpar */}
          <button
            onClick={() => setDateFilters({ dataInicio: '', dataFim: '', tipoData: 'created_at' })}
            className="btn btn-ghost btn-sm whitespace-nowrap"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Mensagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Resposta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Enviado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredDisparos.map((disparo) => (
                <tr key={disparo.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {disparo.telefone}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-500 max-w-xs">
                    <div className="truncate" title={disparo.mensagem}>
                      {disparo.mensagem?.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(disparo.status)}`}>
                      {getStatusIcon(disparo.status)}
                      <span className="ml-1">{getStatusText(disparo.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-500 max-w-xs truncate">
                    {disparo.resposta || disparo.erro || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {disparo.enviado_em ? formatDate(disparo.enviado_em) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDate(disparo.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-900"
                        title="Ver detalhes"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDisparo(disparo.id, disparo.telefone)}
                        className="text-error-600 hover:text-error-900"
                        title="Excluir disparo"
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
          Mostrando {filteredDisparos.length} de {pagination.total} disparos
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="btn btn-ghost btn-sm disabled:opacity-50"
          >
            Anterior
          </button>
          
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            const page = i + 1
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`btn btn-sm ${pagination.page === page ? 'btn-primary' : 'btn-ghost'}`}
              >
                {page}
              </button>
            )
          })}
          
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="btn btn-ghost btn-sm disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </div>

      {/* Modal de Disparo Evolution */}
      <DisparoModal
        isOpen={showDisparoModal}
        onClose={() => {
          setShowDisparoModal(false)
          // Recarregar disparos após fechar modal
          loadDisparos(pagination.page, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
        }}
        clientes={clientes}
      />

      {/* Modal de Disparo WAHA */}
      <WahaDispatchModal
        isOpen={showWahaModal}
        onClose={() => {
          setShowWahaModal(false)
          // Recarregar disparos após fechar modal (se aplicável)
          loadDisparos(pagination.page, searchTerm, statusFilter, dateFilters.dataInicio, dateFilters.dataFim, dateFilters.tipoData)
        }}
        clientes={clientes}
      />

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
