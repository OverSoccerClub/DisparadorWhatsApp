'use client'

import { useState, useEffect } from 'react'
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
  ServerIcon,
  ClockIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WahaServer {
  id?: string
  name: string
  apiUrl: string
  apiKey: string
  webhookUrl: string
  webhookSecret: string
  timeout: number
  retryAttempts: number
  rateLimit: number
  enableAutoReconnect: boolean
  enableQrCode: boolean
  enablePresence: boolean
  status?: {
    connected: boolean
    lastTest?: string
    responseTime?: number
    errors: number
    instances?: number
    activeConnections?: number
  }
}

interface TestStatus {
  testing: boolean
  connected: boolean | null
  lastTest: string | null
  responseTime: number | null
  error: string | null
  instances: number
  activeConnections: number
}

interface Props {
  userId: string
}

export default function WahaServersManager({ userId }: Props) {
  const [servers, setServers] = useState<WahaServer[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingServer, setEditingServer] = useState<WahaServer | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>({
    testing: false,
    connected: null,
    lastTest: null,
    responseTime: null,
    error: null,
    instances: 0,
    activeConnections: 0
  })

  // Carregar lista de servidores
  const loadServers = async () => {
    try {
      const response = await fetch('/api/config/waha/list')
      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
        
        // Verificar status automaticamente se houver servidores
        if (data.servers && data.servers.length > 0) {
          await checkAllServersStatus(data.servers.map((s: WahaServer) => s.id).filter(Boolean))
        }
      } else if (response.status === 401) {
        console.log('Usuário não autenticado')
      }
    } catch (error) {
      console.error('Erro ao carregar servidores WAHA:', error)
    }
  }

  // Verificar status de todos os servidores
  const checkAllServersStatus = async (serverIds: string[]) => {
    if (serverIds.length === 0) return

    try {
      const response = await fetch('/api/config/waha/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverIds })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Atualizar status dos servidores
        setServers(prev => prev.map(server => {
          const statusResult = data.results.find((r: any) => r.id === server.id)
          if (statusResult) {
            return {
              ...server,
              status: {
                connected: statusResult.status === 'online',
                lastTest: statusResult.lastCheck,
                responseTime: statusResult.responseTime,
                errors: statusResult.status === 'offline' ? (server.status?.errors || 0) + 1 : 0,
                instances: statusResult.instances || 0,
                activeConnections: statusResult.activeConnections || 0
              }
            }
          }
          return server
        }))
      }
    } catch (error) {
      console.error('Erro ao verificar status dos servidores:', error)
    }
  }

  useEffect(() => {
    loadServers()
  }, [userId])

  // Abrir modal para adicionar novo servidor
  const handleAdd = () => {
    setEditingServer({
      name: '',
      apiUrl: '',
      apiKey: '',
      webhookUrl: '',
      webhookSecret: '',
      timeout: 30,
      retryAttempts: 3,
      rateLimit: 100,
      enableAutoReconnect: true,
      enableQrCode: true,
      enablePresence: true
    })
    setTestStatus({
      testing: false,
      connected: null,
      lastTest: null,
      responseTime: null,
      error: null,
      instances: 0,
      activeConnections: 0
    })
    setShowModal(true)
  }

  // Abrir modal para editar servidor
  const handleEdit = (server: WahaServer) => {
    setEditingServer({ ...server })
    setTestStatus({
      testing: false,
      connected: server.status?.connected || null,
      lastTest: server.status?.lastTest || null,
      responseTime: server.status?.responseTime || null,
      error: null,
      instances: server.status?.instances || 0,
      activeConnections: server.status?.activeConnections || 0
    })
    setShowModal(true)
  }

  // Testar conexão no modal (antes de salvar)
  const handleTestInModal = async () => {
    if (!editingServer?.apiUrl) {
      toast.error('URL da API é obrigatória para testar')
      return
    }

    setTestStatus(prev => ({ ...prev, testing: true }))
    const startTime = Date.now()

    try {
      const response = await fetch('/api/config/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiUrl: editingServer.apiUrl, 
          apiKey: editingServer.apiKey 
        })
      })

      const data = await response.json()
      const responseTime = Date.now() - startTime

      if (data.success) {
        setTestStatus({
          testing: false,
          connected: true,
          lastTest: new Date().toISOString(),
          responseTime,
          error: null,
          instances: data.data?.instances || 0,
          activeConnections: data.data?.activeConnections || 0
        })
        toast.success('Conexão testada com sucesso!')
      } else {
        setTestStatus({
          testing: false,
          connected: false,
          lastTest: new Date().toISOString(),
          responseTime,
          error: data.error || 'Erro ao testar conexão',
          instances: 0,
          activeConnections: 0
        })
        toast.error(data.error || 'Erro ao testar conexão')
      }
    } catch (error) {
      setTestStatus({
        testing: false,
        connected: false,
        lastTest: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: 'Erro de conexão',
        instances: 0,
        activeConnections: 0
      })
      toast.error('Erro ao testar conexão')
    }
  }

  // Salvar servidor (criar ou atualizar)
  const handleSave = async () => {
    if (!editingServer) return

    if (!editingServer.name || !editingServer.apiUrl) {
      toast.error('Nome e URL são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/config/waha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingServer,
          user_id: userId
        })
      })

      if (response.ok) {
        toast.success(`Servidor "${editingServer.name}" salvo com sucesso!`)
        setShowModal(false)
        setEditingServer(null)
        await loadServers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar servidor WAHA')
      }
    } catch (error) {
      toast.error('Erro ao salvar servidor WAHA')
    } finally {
      setLoading(false)
    }
  }

  // Excluir servidor
  const handleDelete = async (serverId: string, serverName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o servidor "${serverName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/config/waha?id=${serverId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Servidor WAHA excluído com sucesso')
        await loadServers()
      } else {
        toast.error('Erro ao excluir servidor WAHA')
      }
    } catch (error) {
      toast.error('Erro ao excluir servidor WAHA')
    } finally {
      setLoading(false)
    }
  }

  // Testar conexão com servidor
  const handleTest = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (!server) return

    setLoading(true)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/config/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: server.apiUrl, apiKey: server.apiKey })
      })

      const data = await response.json()
      const responseTime = Date.now() - startTime

      if (data.success) {
        setServers(prev => prev.map(s =>
          s.id === serverId
            ? {
                ...s,
                status: {
                  connected: true,
                  lastTest: new Date().toISOString(),
                  responseTime,
                  errors: 0,
                  instances: data.data?.instances || 0,
                  activeConnections: data.data?.activeConnections || 0
                }
              }
            : s
        ))
        toast.success(`Conexão com "${server.name}" testada com sucesso!`)
      } else {
        setServers(prev => prev.map(s =>
          s.id === serverId
            ? {
                ...s,
                status: {
                  connected: false,
                  lastTest: new Date().toISOString(),
                  responseTime,
                  errors: (s.status?.errors || 0) + 1
                }
              }
            : s
        ))
        toast.error(data.error || `Erro ao testar conexão com "${server.name}"`)
      }
    } catch (error) {
      console.error('Erro ao testar conexão com WAHA:', error)
      setServers(prev => prev.map(s =>
        s.id === serverId
          ? {
              ...s,
              status: {
                connected: false,
                lastTest: new Date().toISOString(),
                responseTime: Date.now() - startTime,
                errors: (s.status?.errors || 0) + 1
              }
            }
          : s
      ))
      toast.error(`Erro ao testar conexão com "${server.name}"`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
          <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
          Servidores WAHA
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const serverIds = servers.map(s => s.id).filter(Boolean) as string[]
              if (serverIds.length > 0) {
                checkAllServersStatus(serverIds)
                toast.success('Verificando status dos servidores...')
              }
            }}
            disabled={loading || servers.length === 0}
            className="btn btn-secondary btn-sm"
          >
            <WifiIcon className="h-4 w-4 mr-2" />
            Verificar Status
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Servidor
          </button>
        </div>
      </div>

      {/* Resumo de Status */}
      {servers.length > 0 && (
        <div className="mb-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-500 dark:bg-success-400 rounded-full mr-2"></div>
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Online: {servers.filter(s => s.status?.connected).length}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-error-500 dark:bg-error-400 rounded-full mr-2"></div>
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Offline: {servers.filter(s => s.status && !s.status.connected).length}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-secondary-400 dark:bg-secondary-500 rounded-full mr-2"></div>
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Não testado: {servers.filter(s => !s.status).length}
                </span>
              </div>
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Total: {servers.length} servidor{servers.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Servidores */}
      {servers.length === 0 ? (
        <div className="text-center py-12 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <ServerIcon className="h-12 w-12 mx-auto text-secondary-400 dark:text-secondary-600 mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">Nenhum servidor WAHA configurado</p>
          <button
            onClick={handleAdd}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Primeiro Servidor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-secondary-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
                    {server.name}
                    {server.status ? (
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                          server.status.connected 
                            ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300' 
                            : 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300'
                        }`}
                      >
                        {server.status.connected ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full font-medium bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400">
                        NÃO TESTADO
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 break-all mt-1 leading-tight">
                    {server.apiUrl}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(server)}
                    className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                  </button>
                  <button
                    onClick={() => server.id && handleDelete(server.id, server.name)}
                    className="p-1 hover:bg-error-50 dark:hover:bg-error-900/30 rounded transition-colors"
                    title="Excluir"
                  >
                    <TrashIcon className="h-4 w-4 text-error-600 dark:text-error-400" />
                  </button>
                </div>
              </div>

              {/* Status */}
              {server.status && (
                <div className="text-xs text-secondary-600 dark:text-secondary-400 space-y-1 mb-3">
                  {server.status.lastTest && (
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Último teste: {new Date(server.status.lastTest).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {server.status.responseTime && (
                    <div className="flex items-center">
                      <ServerIcon className="h-3 w-3 mr-1" />
                      Tempo: {server.status.responseTime}ms
                    </div>
                  )}
                  {server.status.instances !== undefined && (
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
                      Instâncias: {server.status.instances} ({server.status.activeConnections} ativas)
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => server.id && handleTest(server.id)}
                disabled={loading}
                className="btn btn-secondary btn-sm w-full"
              >
                <WifiIcon className="h-4 w-4 mr-2" />
                Testar Conexão
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && editingServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                  {editingServer.id ? 'Editar Servidor WAHA' : 'Novo Servidor WAHA'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingServer(null)
                  }}
                  className="text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Nome do Servidor *
                  </label>
                  <input
                    type="text"
                    value={editingServer.name}
                    onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                    placeholder="Ex: WAHA Servidor 1"
                    className="input w-full"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    URL da API *
                  </label>
                  <input
                    type="url"
                    value={editingServer.apiUrl}
                    onChange={(e) => setEditingServer({ ...editingServer, apiUrl: e.target.value })}
                    placeholder="https://waha-api.exemplo.com"
                    className="input w-full"
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={editingServer.apiKey}
                    onChange={(e) => setEditingServer({ ...editingServer, apiKey: e.target.value })}
                    placeholder="Sua API Key do WAHA"
                    className="input w-full"
                  />
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Webhook URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={editingServer.webhookUrl}
                    onChange={(e) => setEditingServer({ ...editingServer, webhookUrl: e.target.value })}
                    placeholder="https://sua-api.com/webhook/waha"
                    className="input w-full"
                  />
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Chave Secreta do Webhook
                  </label>
                  <input
                    type="password"
                    value={editingServer.webhookSecret}
                    onChange={(e) => setEditingServer({ ...editingServer, webhookSecret: e.target.value })}
                    placeholder="Sua chave secreta"
                    className="input w-full"
                  />
                </div>

                {/* Configurações Numéricas */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Timeout (s)
                    </label>
                    <input
                      type="number"
                      value={editingServer.timeout}
                      onChange={(e) => setEditingServer({ ...editingServer, timeout: parseInt(e.target.value) })}
                      min="5"
                      max="300"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Tentativas
                    </label>
                    <input
                      type="number"
                      value={editingServer.retryAttempts}
                      onChange={(e) => setEditingServer({ ...editingServer, retryAttempts: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Rate Limit
                    </label>
                    <input
                      type="number"
                      value={editingServer.rateLimit}
                      onChange={(e) => setEditingServer({ ...editingServer, rateLimit: parseInt(e.target.value) })}
                      min="10"
                      max="1000"
                      className="input w-full"
                    />
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3 flex items-center">
                    <CogIcon className="h-4 w-4 mr-2" />
                    Configurações Avançadas
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableAutoReconnect"
                        checked={editingServer.enableAutoReconnect}
                        onChange={(e) => setEditingServer({ ...editingServer, enableAutoReconnect: e.target.checked })}
                        className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700"
                      />
                      <label htmlFor="enableAutoReconnect" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                        Reconexão Automática
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableQrCode"
                        checked={editingServer.enableQrCode}
                        onChange={(e) => setEditingServer({ ...editingServer, enableQrCode: e.target.checked })}
                        className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700"
                      />
                      <label htmlFor="enableQrCode" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                        QR Code Automático
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enablePresence"
                        checked={editingServer.enablePresence}
                        onChange={(e) => setEditingServer({ ...editingServer, enablePresence: e.target.checked })}
                        className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700"
                      />
                      <label htmlFor="enablePresence" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                        Status de Presença
                      </label>
                    </div>
                  </div>
                </div>

                {/* Resumo de Status da Conexão */}
                {testStatus.lastTest && (
                  <div className={`p-4 rounded-lg border-2 ${
                    testStatus.connected 
                      ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800' 
                      : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center">
                        {testStatus.connected ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5 text-success-600 dark:text-success-400 mr-2" />
                            <span className="text-success-900 dark:text-success-200">Conexão Testada com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-5 w-5 text-error-600 dark:text-error-400 mr-2" />
                            <span className="text-error-900 dark:text-error-200">Erro na Conexão</span>
                          </>
                        )}
                      </h4>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center text-secondary-700 dark:text-secondary-300">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Último teste: {new Date(testStatus.lastTest).toLocaleString('pt-BR')}
                      </div>
                      
                      {testStatus.responseTime && (
                        <div className="flex items-center text-secondary-700 dark:text-secondary-300">
                          <ServerIcon className="h-3 w-3 mr-1" />
                          Tempo de resposta: {testStatus.responseTime}ms
                        </div>
                      )}
                      
                      {testStatus.connected && testStatus.instances > 0 && (
                        <div className="flex items-center text-secondary-700 dark:text-secondary-300">
                          <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
                          Instâncias: {testStatus.instances} ({testStatus.activeConnections} ativas)
                        </div>
                      )}
                      
                      {testStatus.error && (
                        <div className="text-error-700 dark:text-error-300 mt-2">
                          <strong>Erro:</strong> {testStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handleTestInModal}
                  disabled={testStatus.testing || !editingServer.apiUrl}
                  className="btn btn-secondary btn-md"
                >
                  <WifiIcon className="h-4 w-4 mr-2" />
                  {testStatus.testing ? 'Testando...' : 'Testar Conexão'}
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setEditingServer(null)
                      setTestStatus({
                        testing: false,
                        connected: null,
                        lastTest: null,
                        responseTime: null,
                        error: null,
                        instances: 0,
                        activeConnections: 0
                      })
                    }}
                    className="btn btn-secondary btn-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || !editingServer.name || !editingServer.apiUrl}
                    className="btn btn-primary btn-md"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

