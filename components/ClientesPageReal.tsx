'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserPlusIcon,
  DocumentArrowUpIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  XMarkIcon,
  CheckIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import PageHeader from './PageHeader'
import { Cliente } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ClientesPageReal() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    status: 'ativo'
  })
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadClientes()
  }, [currentPage, recordsPerPage, statusFilter])

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadClientes()
    }, 300) // 300ms de delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        search: searchTerm,
        status: statusFilter
      })
      
      const response = await fetch(`/api/clientes?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta:', response.status, errorText)
        toast.error(`Erro ${response.status}: ${errorText}`)
        return
      }
      
      const result = await response.json()
      
      if (result.error) {
        console.error('Erro na API:', result.error)
        toast.error(`Erro da API: ${result.error}`)
        return
      }
      
      setClientes(result.data || [])
      setTotalRecords(result.pagination?.total || 0)
      setTotalPages(result.pagination?.pages || 0)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error(`Erro de rede: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingCliente ? 'PUT' : 'POST'
      const url = editingCliente ? `/api/clientes` : '/api/clientes'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCliente ? { id: editingCliente.id, ...formData } : formData),
      })

      if (response.ok) {
        toast.success(editingCliente ? 'Cliente atualizado com sucesso!' : 'Cliente adicionado com sucesso!')
        setShowModal(false)
        setEditingCliente(null)
        setFormData({ nome: '', telefone: '', email: '', status: 'ativo' })
        loadClientes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar cliente')
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error('Erro ao salvar cliente')
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || '',
      status: cliente.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const response = await fetch(`/api/clientes?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cliente excluído com sucesso!')
        loadClientes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir cliente')
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Erro ao excluir cliente')
    }
  }

  const handleNewCliente = () => {
    setEditingCliente(null)
    setFormData({ nome: '', telefone: '', email: '', status: 'ativo' })
    setShowModal(true)
  }

  // Funções de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRecordsPerPageChange = (newLimit: number) => {
    setRecordsPerPage(newLimit)
    setCurrentPage(1) // Voltar para primeira página
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Voltar para primeira página ao buscar
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Voltar para primeira página ao filtrar
  }

  // Gerar array de páginas para exibição
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, currentPage - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
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
      {/* Header padronizado */}
      <PageHeader
        title="Clientes"
        subtitle="Gerencie sua base de clientes cadastrados"
        icon={<UsersIcon className="h-6 w-6" />}
        actions={(
          <button
            onClick={handleNewCliente}
            className="btn btn-primary btn-md"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Novo Cliente
          </button>
        )}
      />

      {/* Filtros */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-secondary-500" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-secondary-500" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="input pl-10"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={recordsPerPage}
              onChange={(e) => handleRecordsPerPageChange(parseInt(e.target.value))}
              className="input"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
              <option value={500}>500 por página</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              {totalRecords} clientes encontrados
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Cadastrado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          ID: {cliente.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900 dark:text-secondary-100">{cliente.telefone}</div>
                    {cliente.email && (
                      <div className="text-sm text-secondary-500 dark:text-secondary-400">{cliente.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cliente.status === 'ativo' 
                        ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                        : 'bg-error-100 dark:bg-error-900/20 text-error-800 dark:text-error-400'
                    }`}>
                      {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                    {formatDate(cliente.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="text-error-600 hover:text-error-900"
                        title="Excluir"
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

        {clientes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-secondary-400 dark:text-secondary-500 mb-4">
              <UserPlusIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              {searchTerm || statusFilter !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-secondary-500 dark:text-secondary-400 mb-4">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece adicionando seu primeiro cliente'
              }
            </p>
            {(!searchTerm && statusFilter === 'todos') && (
              <button
                onClick={handleNewCliente}
                className="btn btn-primary"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                ({totalRecords} registros)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botão Anterior */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {/* Números das páginas */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`btn btn-sm ${
                      currentPage === pageNum 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              {/* Botão Próximo */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  {editingCliente ? (
                    <PencilIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <UserPlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                    {editingCliente ? 'Atualize as informações do cliente' : 'Preencha os dados para adicionar um novo cliente'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                title="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <UserCircleIcon className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" />
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input w-full"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <svg className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="input w-full"
                  placeholder="5511999999999"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <svg className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <svg className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 dark:focus:ring-secondary-400 transition-all duration-200"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {editingCliente ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
