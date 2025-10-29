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
  EyeIcon
} from '@heroicons/react/24/outline'
import { Cliente } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// Mock data - em produção viria do Supabase
const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '5511999999999',
    email: 'joao@exemplo.com',
    created_at: '2024-01-15T10:30:00Z',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Maria Santos',
    telefone: '5511888888888',
    email: 'maria@exemplo.com',
    created_at: '2024-01-14T14:20:00Z',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Pedro Oliveira',
    telefone: '5511777777777',
    email: 'pedro@exemplo.com',
    created_at: '2024-01-13T09:15:00Z',
    status: 'inativo'
  },
  {
    id: '4',
    nome: 'Ana Costa',
    telefone: '5511666666666',
    email: 'ana@exemplo.com',
    created_at: '2024-01-12T16:45:00Z',
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'Carlos Ferreira',
    telefone: '5511555555555',
    email: 'carlos@exemplo.com',
    created_at: '2024-01-11T11:30:00Z',
    status: 'ativo'
  }
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes)
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>(mockClientes)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit' | 'import'>('create')
  const [loading, setLoading] = useState(false)

  // Filtros
  useEffect(() => {
    let filtered = clientes

    if (searchTerm) {
      filtered = filtered.filter(cliente =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(cliente => cliente.status === statusFilter)
    }

    setFilteredClientes(filtered)
  }, [clientes, searchTerm, statusFilter])

  const handleSelectCliente = (clienteId: string) => {
    setSelectedClientes(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    )
  }

  const handleSelectAll = () => {
    if (selectedClientes.length === filteredClientes.length) {
      setSelectedClientes([])
    } else {
      setSelectedClientes(filteredClientes.map(c => c.id))
    }
  }

  const handleDeleteCliente = async (clienteId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setLoading(true)
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setClientes(prev => prev.filter(c => c.id !== clienteId))
        toast.success('Cliente excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir cliente')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedClientes.length === 0) return
    
    if (confirm(`Tem certeza que deseja excluir ${selectedClientes.length} cliente(s)?`)) {
      setLoading(true)
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setClientes(prev => prev.filter(c => !selectedClientes.includes(c.id)))
        setSelectedClientes([])
        toast.success(`${selectedClientes.length} cliente(s) excluído(s) com sucesso!`)
      } catch (error) {
        toast.error('Erro ao excluir clientes')
      } finally {
        setLoading(false)
      }
    }
  }

  const openModal = (type: 'create' | 'edit' | 'import') => {
    setModalType(type)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Clientes</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Gerencie sua base de clientes para disparos WhatsApp
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openModal('import')}
            className="btn btn-secondary btn-md"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Importar CSV
          </button>
          <button
            onClick={() => openModal('create')}
            className="btn btn-primary btn-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {clientes.length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total de Clientes</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {clientes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <span className="text-success-600 font-semibold text-sm">
                  {clientes.filter(c => c.status === 'ativo').length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Clientes Ativos</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {clientes.filter(c => c.status === 'ativo').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <span className="text-warning-600 font-semibold text-sm">
                  {clientes.filter(c => c.status === 'inativo').length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Clientes Inativos</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {clientes.filter(c => c.status === 'inativo').length}
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
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input w-40"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
          
          {selectedClientes.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">
                {selectedClientes.length} selecionado(s)
              </span>
              <button
                onClick={handleBulkDelete}
                className="btn btn-error btn-sm"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Excluir
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
                    checked={selectedClientes.length === filteredClientes.length && filteredClientes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Cadastrado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedClientes.includes(cliente.id)}
                      onChange={() => handleSelectCliente(cliente.id)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                        <span className="text-secondary-600 font-medium text-sm">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {cliente.nome}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {cliente.telefone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {cliente.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                        onClick={() => openModal('edit')}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCliente(cliente.id)}
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
          Mostrando {filteredClientes.length} de {clientes.length} clientes
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-ghost btn-sm">Anterior</button>
          <button className="btn btn-primary btn-sm">1</button>
          <button className="btn btn-ghost btn-sm">2</button>
          <button className="btn btn-ghost btn-sm">3</button>
          <button className="btn btn-ghost btn-sm">Próximo</button>
        </div>
      </div>
    </div>
  )
}
