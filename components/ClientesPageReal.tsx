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
  UsersIcon
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
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
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
            <span className="text-sm text-secondary-600">
              {totalRecords} clientes encontrados
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Cadastrado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-secondary-500">
                          ID: {cliente.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{cliente.telefone}</div>
                    {cliente.email && (
                      <div className="text-sm text-secondary-500">{cliente.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cliente.status === 'ativo' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
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
            <div className="text-secondary-400 mb-4">
              <UserPlusIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || statusFilter !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-secondary-500 mb-4">
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
              <span className="text-sm text-secondary-600">
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-sm text-secondary-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
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
                <label className="block text-sm font-medium text-secondary-700 mb-1">
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
                <label className="block text-sm font-medium text-secondary-700 mb-1">
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
                <label className="block text-sm font-medium text-secondary-700 mb-1">
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCliente ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
