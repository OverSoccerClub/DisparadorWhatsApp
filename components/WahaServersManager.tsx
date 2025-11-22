'use client'

import React, { useState, useEffect } from 'react'
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
  CogIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import { useAlertContext } from '@/lib/contexts/AlertContext'
import SuccessModal from './SuccessModal'
import ConfirmModal from './ConfirmModal'

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

interface WahaSession {
  name: string
  status: string
  config?: any
  me?: any
  serverId: string
  serverName: string
  avatar?: string | null
  connectedAt?: string | null
  phoneNumber?: string | null
}

interface Props {
  userId?: string
}

export default function WahaServersManager({ userId }: Props = {}) {
  const { showSuccess, showError } = useAlertContext()
  const [servers, setServers] = useState<WahaServer[]>([])
  const [sessions, setSessions] = useState<WahaSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingServer, setEditingServer] = useState<WahaServer | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WahaSession | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(false)
  const connectionCheckIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const qrRefreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>({
    testing: false,
    connected: null,
    lastTest: null,
    responseTime: null,
    error: null,
    instances: 0,
    activeConnections: 0
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
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

  // Função para traduzir status para português
  const translateStatus = (status: string): string => {
    const statusUpper = status.toUpperCase()
    const statusMap: Record<string, string> = {
      'WORKING': 'Conectado',
      'CONNECTED': 'Conectado',
      'OPEN': 'Conectado',
      'READY': 'Pronto',
      'AUTHENTICATED': 'Autenticado',
      'SCAN_QR_CODE': 'Aguardando QR Code',
      'STARTING': 'Iniciando',
      'STOPPED': 'Parado',
      'FAILED': 'Falhou',
      'DISCONNECTED': 'Desconectado',
      'CLOSED': 'Fechado',
      'PAIRING': 'Pareando'
    }
    return statusMap[statusUpper] || status
  }
  
  // Função para obter cor do status
  const getStatusColor = (status: string): string => {
    const statusUpper = status.toUpperCase()
    if (statusUpper === 'WORKING' || statusUpper === 'CONNECTED' || statusUpper === 'OPEN' || statusUpper === 'AUTHENTICATED') {
      return 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
    }
    if (statusUpper === 'SCAN_QR_CODE' || statusUpper === 'STARTING' || statusUpper === 'PAIRING') {
      return 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300'
    }
    if (statusUpper === 'FAILED' || statusUpper === 'STOPPED' || statusUpper === 'DISCONNECTED' || statusUpper === 'CLOSED') {
      return 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300'
    }
    return 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
  }

  // Carregar sessões WAHA
  const loadSessions = async () => {
    try {
      setLoadingSessions(true)
      const response = await fetch('/api/waha/sessions/all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSessions(data.sessions || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessões WAHA:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  // Buscar QR code da sessão
  const loadQrCode = async (session: WahaSession) => {
    try {
      setLoadingQr(true)
      const server = servers.find(s => s.id === session.serverId)
      if (!server) {
        showError('Servidor não encontrado')
        return
      }

      const response = await fetch(`/api/waha/sessions/${session.name}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: session.serverId,
          apiUrl: server.apiUrl,
          apiKey: server.apiKey
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}: ${response.statusText}` }))
        showError(errorData.error || `Erro ao buscar QR code (${response.status})`)
        return
      }

      const data = await response.json()
      
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode)
        setSelectedSession(session)
        setShowQrModal(true)
        // Iniciar verificação de conexão
        startConnectionCheck(session)
        // Iniciar atualização automática do QR code após 25 segundos
        startQrRefresh(session)
      } else {
        showError(data.error || 'Erro ao buscar QR code. A sessão pode não existir ou não estar pronta.')
      }
    } catch (error) {
      console.error('Erro ao buscar QR code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      showError(`Erro ao buscar QR code: ${errorMessage}. Verifique se a URL da API WAHA está correta e se a sessão existe.`)
    } finally {
      setLoadingQr(false)
    }
  }

  // Limpar verificação de conexão
  const stopConnectionCheck = () => {
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current)
      connectionCheckIntervalRef.current = null
    }
    setCheckingConnection(false)
  }

  // Limpar atualização de QR code
  const stopQrRefresh = () => {
    if (qrRefreshIntervalRef.current) {
      clearInterval(qrRefreshIntervalRef.current)
      qrRefreshIntervalRef.current = null
    }
  }

  // Atualizar QR code automaticamente após 25 segundos
  const startQrRefresh = (session: WahaSession) => {
    // Limpar intervalo anterior se existir
    stopQrRefresh()
    
    // Aguardar 25 segundos antes de atualizar
    const timeout = setTimeout(async () => {
      // Verificar se o modal ainda está aberto e a sessão ainda não conectou
      if (showQrModal && selectedSession && selectedSession.name === session.name) {
        // Verificar status antes de atualizar
        try {
          const statusResponse = await fetch('/api/waha/sessions/all', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.success) {
              const currentSession = statusData.sessions.find((s: WahaSession) => 
                s.serverId === session.serverId && s.name === session.name
              )
              
              // Só atualizar se ainda não estiver conectado
              if (currentSession) {
                const isWorking = currentSession.status === 'WORKING' || 
                                 currentSession.status === 'CONNECTED' || 
                                 currentSession.status === 'OPEN' ||
                                 currentSession.status === 'AUTHENTICATED'
                
                if (!isWorking) {
                  console.log('🔄 Atualizando QR code após 25 segundos...')
                  
                  // Buscar novo QR code diretamente
                  try {
                    setLoadingQr(true)
                    const server = servers.find(s => s.id === session.serverId)
                    if (server) {
                      const response = await fetch(`/api/waha/sessions/${session.name}/qr`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          serverId: session.serverId,
                          apiUrl: server.apiUrl,
                          apiKey: server.apiKey
                        })
                      })
                      
                      if (response.ok) {
                        const data = await response.json()
                        if (data.success && data.qrCode) {
                          setQrCode(data.qrCode)
                          // Reiniciar o timer de atualização para próxima vez (se ainda não conectou)
                          if (showQrModal && selectedSession && selectedSession.name === session.name) {
                            startQrRefresh(session)
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Erro ao atualizar QR code:', error)
                  } finally {
                    setLoadingQr(false)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status antes de atualizar QR:', error)
        }
      }
    }, 25000) // 25 segundos

    qrRefreshIntervalRef.current = timeout as any
  }

  // Verificar conexão automaticamente
  const startConnectionCheck = (session: WahaSession) => {
    // Limpar intervalo anterior se existir
    stopConnectionCheck()
    
    setCheckingConnection(true)
    let checkCount = 0
    const maxChecks = 60 // 3 minutos (60 * 3 segundos)
    
    const interval = setInterval(async () => {
      checkCount++
      
      // Buscar sessão atualizada
      const response = await fetch('/api/waha/sessions/all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const updatedSession = data.sessions.find((s: WahaSession) => 
            s.serverId === session.serverId && s.name === session.name
          )
          
          if (updatedSession) {
            const isWorking = updatedSession.status === 'WORKING' || 
                             updatedSession.status === 'CONNECTED' || 
                             updatedSession.status === 'OPEN' ||
                             updatedSession.status === 'AUTHENTICATED' ||
                             updatedSession.status === 'READY'
            
            if (isWorking) {
              // Parar todas as verificações
              stopConnectionCheck()
              stopQrRefresh()
              
              // Fechar modal
              setShowQrModal(false)
              setQrCode(null)
              setSelectedSession(null)
              
              // Recarregar sessões para atualizar a lista
              await loadSessions()
              
              // Mostrar mensagem de sucesso
              showSuccess('✅ Conexão estabelecida com sucesso! A sessão está ativa.')
            }
          }
        }
      }
      
      // Parar após maxChecks tentativas
      if (checkCount >= maxChecks) {
        stopConnectionCheck()
      }
    }, 3000) // Verificar a cada 3 segundos

    connectionCheckIntervalRef.current = interval
  }

  useEffect(() => {
    loadServers()
    loadSessions()
    
    // Limpar intervalos ao desmontar
    return () => {
      stopConnectionCheck()
      stopQrRefresh()
    }
  }, [])

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
      showError('URL da API é obrigatória para testar')
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
        showSuccess('Conexão testada com sucesso!')
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
        showError(data.error || 'Erro ao testar conexão')
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
      showError('Erro ao testar conexão')
    }
  }

  // Salvar servidor (criar ou atualizar)
  const handleSave = async () => {
    if (!editingServer) return

    if (!editingServer.name || !editingServer.apiUrl) {
      showError('Nome e URL são obrigatórios')
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
        setSuccessMessage(`Servidor "${editingServer.name}" salvo com sucesso!`)
        setShowSuccessModal(true)
        setShowModal(false)
        setEditingServer(null)
        await loadServers()
        await loadSessions() // Recarregar sessões após salvar servidor
      } else {
        const error = await response.json()
        showError(error.error || 'Erro ao salvar servidor WAHA')
      }
    } catch (error) {
      showError('Erro ao salvar servidor WAHA')
    } finally {
      setLoading(false)
    }
  }

  // Excluir servidor
  const handleDelete = async (serverId: string, serverName: string) => {
    setConfirmModal({
      open: true,
      title: 'Excluir servidor',
      message: `Tem certeza que deseja excluir o servidor "${serverName}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setConfirmModal({ open: false, title: '', message: '', onConfirm: () => {} })
        confirmarExclusao(serverId)
      }
    })
  }

  const confirmarExclusao = async (serverId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/config/waha?id=${serverId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('Servidor WAHA excluído com sucesso!')
        setShowSuccessModal(true)
        await loadServers()
        await loadSessions() // Recarregar sessões após excluir servidor
      } else {
        showError('Erro ao excluir servidor WAHA')
      }
    } catch (error) {
      showError('Erro ao excluir servidor WAHA')
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
        showSuccess(`Conexão com "${server.name}" testada com sucesso!`)
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
        showError(data.error || `Erro ao testar conexão com "${server.name}"`)
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
      showError(`Erro ao testar conexão com "${server.name}"`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header padronizado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center mb-2">
            <DevicePhoneMobileIcon className="h-7 w-7 mr-3 text-primary-600 dark:text-primary-400" />
            Sessões WAHA
          </h1>
          <p className="text-base text-secondary-600 dark:text-secondary-400">
            Gerencie seus servidores e sessões WAHA de forma centralizada
          </p>
        </div>
        <div className="flex space-x-3 flex-wrap">
          <button
            onClick={() => {
              const serverIds = servers.map(s => s.id).filter(Boolean) as string[]
              if (serverIds.length > 0) {
                checkAllServersStatus(serverIds)
                showSuccess('Verificando status dos servidores...')
              }
            }}
            disabled={loading || servers.length === 0}
            className="btn btn-secondary btn-md"
          >
            <WifiIcon className="h-4 w-4 mr-2" />
            Verificar Status
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="btn btn-primary btn-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Adicionar Servidor
          </button>
        </div>
      </div>

      {/* Resumo de Status */}
      {servers.length > 0 && (
        <div className="mb-6 p-5 bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-800 dark:to-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-6 flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-success-500 dark:bg-success-400 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  <span className="font-semibold text-success-700 dark:text-success-300">
                    {servers.filter(s => s.status?.connected).length}
                  </span> Online
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-error-500 dark:bg-error-400 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  <span className="font-semibold text-error-700 dark:text-error-300">
                    {servers.filter(s => s.status && !s.status.connected).length}
                  </span> Offline
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-secondary-400 dark:bg-secondary-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  <span className="font-semibold text-secondary-600 dark:text-secondary-400">
                    {servers.filter(s => !s.status).length}
                  </span> Não testado
                </span>
              </div>
            </div>
            <div className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
              Total: {servers.length} servidor{servers.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Servidores */}
      {servers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
            <ServerIcon className="h-8 w-8 text-secondary-400 dark:text-secondary-600" />
          </div>
          <p className="text-lg font-medium text-secondary-700 dark:text-secondary-300 mb-2">Nenhum servidor WAHA configurado</p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">Comece adicionando seu primeiro servidor WAHA</p>
          <button
            onClick={handleAdd}
            className="btn btn-primary btn-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Adicionar Primeiro Servidor
          </button>
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
            <ServerIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Servidores WAHA
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {servers.map((server) => (
              <div
                key={server.id}
                className={`group relative border-2 rounded-xl p-5 transition-all duration-200 bg-white dark:bg-secondary-800 hover:shadow-lg hover:-translate-y-1 ${
                  server.status?.connected
                    ? 'border-success-200 dark:border-success-800 hover:border-success-300 dark:hover:border-success-700'
                    : server.status && !server.status.connected
                    ? 'border-error-200 dark:border-error-800 hover:border-error-300 dark:hover:border-error-700'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                {/* Badge de Status no topo */}
                <div className="absolute top-3 right-3">
                  {server.status ? (
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                        server.status.connected 
                          ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800' 
                          : 'bg-error-100 dark:bg-error-900/40 text-error-700 dark:text-error-300 border border-error-200 dark:border-error-800'
                      }`}
                    >
                      {server.status.connected ? '● ONLINE' : '● OFFLINE'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full shadow-sm bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-600">
                      NÃO TESTADO
                    </span>
                  )}
                </div>

                {/* Ícone e Nome do Servidor */}
                <div className="flex items-start mb-4 pr-20">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
                    server.status?.connected
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                      : server.status && !server.status.connected
                      ? 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
                      : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
                  }`}>
                    <ServerIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 text-base mb-1 truncate">
                      {server.name}
                    </h4>
                    <p className="text-xs text-secondary-500 dark:text-secondary-500 break-all leading-relaxed line-clamp-2">
                      {server.apiUrl}
                    </p>
                  </div>
                </div>

                {/* Informações de Status */}
                {server.status && (
                  <div className="mb-4 space-y-2 p-3 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    {server.status.responseTime && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary-600 dark:text-secondary-400 flex items-center">
                          <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                          Tempo de resposta
                        </span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {server.status.responseTime}ms
                        </span>
                      </div>
                    )}
                    {server.status.instances !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary-600 dark:text-secondary-400 flex items-center">
                          <DevicePhoneMobileIcon className="h-3.5 w-3.5 mr-1.5" />
                          Instâncias
                        </span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {server.status.instances} ({server.status.activeConnections} ativas)
                        </span>
                      </div>
                    )}
                    {server.status.lastTest && (
                      <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-500 pt-1 border-t border-secondary-200 dark:border-secondary-700">
                        <ClockIcon className="h-3 w-3 mr-1.5" />
                        {new Date(server.status.lastTest).toLocaleString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(server)}
                    className="flex-1 btn btn-secondary btn-sm"
                    title="Editar servidor"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => server.id && handleTest(server.id)}
                    disabled={loading}
                    className="flex-1 btn btn-primary btn-sm"
                    title="Testar conexão"
                  >
                    <WifiIcon className="h-4 w-4 mr-1.5" />
                    Testar
                  </button>
                  <button
                    onClick={() => server.id && handleDelete(server.id, server.name)}
                    className="p-2 btn btn-error btn-sm"
                    title="Excluir servidor"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Sessões WAHA */}
      {servers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Sessões WAHA
              </h2>
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                Gerencie e monitore as sessões conectadas nos servidores
              </p>
            </div>
            <button
              onClick={loadSessions}
              disabled={loadingSessions}
              className="btn btn-secondary btn-md"
              title="Recarregar sessões"
            >
              {loadingSessions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <WifiIcon className="h-4 w-4 mr-2" />
                  Atualizar
                </>
              )}
            </button>
          </div>

          {loadingSessions ? (
            <div className="card p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-3"></div>
              <p className="text-secondary-600 dark:text-secondary-400">Carregando sessões...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="card p-10 text-center bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-800 dark:to-secondary-900 border border-secondary-200 dark:border-secondary-700">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
                <DevicePhoneMobileIcon className="h-8 w-8 text-secondary-400 dark:text-secondary-600" />
              </div>
              <p className="text-base font-medium text-secondary-700 dark:text-secondary-300 mb-2">Nenhuma sessão encontrada</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-500">
                As sessões aparecerão aqui quando estiverem conectadas nos servidores WAHA
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agrupar sessões por servidor */}
              {servers.map((server) => {
                const serverSessions = sessions.filter(s => s.serverId === server.id)
                if (serverSessions.length === 0) return null

                return (
                  <div key={server.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <ServerIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
                            {server.name}
                          </h3>
                          <p className="text-xs text-secondary-500 dark:text-secondary-500">
                            {serverSessions.length} sessão{serverSessions.length !== 1 ? 'ões' : ''} ativa{serverSessions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sessões em layout horizontal com scroll */}
                    <div 
                      className="overflow-x-auto -mx-6 px-6 scroll-smooth" 
                      style={{ 
                        scrollbarWidth: 'thin', 
                        WebkitOverflowScrolling: 'touch',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div 
                        className="flex pb-3" 
                        style={{ 
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'nowrap',
                          gap: '1rem',
                          alignItems: 'stretch'
                        }}
                      >
                        {serverSessions.map((session) => {
                          const isWorking = session.status === 'WORKING' || session.status === 'CONNECTED' || session.status === 'OPEN' || session.status === 'AUTHENTICATED'
                          return (
                            <div
                              key={`${session.serverId}:${session.name}`}
                              className={`group relative border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                                isWorking
                                  ? 'border-success-200 dark:border-success-800 bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-secondary-800'
                                  : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                              }`}
                              style={{ 
                                flexShrink: 0,
                                flexGrow: 0,
                                minWidth: '280px',
                                maxWidth: '280px',
                                width: '280px'
                              }}
                            >
                              {/* Badge de Status */}
                              <div className="absolute top-3 right-3">
                                <span
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(session.status)}`}
                                >
                                  {translateStatus(session.status)}
                                </span>
                              </div>

                              {/* Avatar e Nome */}
                              <div className="flex items-start mb-3 pr-20">
                                <div className="flex-shrink-0">
                                  {session.avatar ? (
                                    <img
                                      src={session.avatar}
                                      alt={session.name}
                                      className="w-12 h-12 rounded-full border-2 border-secondary-200 dark:border-secondary-700 shadow-sm"
                                    />
                                  ) : (
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm ${
                                      isWorking
                                        ? 'bg-success-100 dark:bg-success-900/40 border-success-200 dark:border-success-800'
                                        : 'bg-secondary-100 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600'
                                    }`}>
                                      <DevicePhoneMobileIcon className={`h-6 w-6 ${
                                        isWorking
                                          ? 'text-success-600 dark:text-success-400'
                                          : 'text-secondary-500 dark:text-secondary-400'
                                      }`} />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate mb-0.5">
                                    {session.name}
                                  </p>
                                  {session.phoneNumber && (
                                    <p className="text-xs text-secondary-600 dark:text-secondary-400 font-medium">
                                      {session.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Informações adicionais */}
                              {session.connectedAt && (
                                <div className="mb-3 p-2.5 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg border border-secondary-200 dark:border-secondary-700">
                                  <div className="flex items-center text-xs text-secondary-600 dark:text-secondary-400">
                                    <ClockIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                    <span className="truncate">
                                      Conectado: {new Date(session.connectedAt).toLocaleString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Botão de ação */}
                              {!isWorking && (
                                <button
                                  onClick={() => loadQrCode(session)}
                                  disabled={loadingQr}
                                  className="w-full btn btn-primary btn-sm"
                                  title="Escanear QR Code"
                                >
                                  <QrCodeIcon className="h-4 w-4 mr-2" />
                                  {loadingQr ? 'Carregando...' : 'Escanear QR Code'}
                                </button>
                              )}
                              
                              {isWorking && (
                                <div className="w-full px-3 py-2 bg-success-100 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg text-center">
                                  <p className="text-xs font-medium text-success-700 dark:text-success-300">
                                    ✓ Sessão Ativa
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

      {/* Modal de QR Code e Detalhes da Sessão */}
      {showQrModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                  Sessão: {selectedSession.name}
                </h3>
                <button
                  onClick={() => {
                    stopConnectionCheck()
                    stopQrRefresh()
                    setShowQrModal(false)
                    setQrCode(null)
                    setSelectedSession(null)
                  }}
                  className="text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações da Sessão */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Status
                    </label>
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-medium inline-block ${getStatusColor(selectedSession.status)}`}
                    >
                      {translateStatus(selectedSession.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Servidor
                    </label>
                    <p className="text-sm text-secondary-900 dark:text-secondary-100">
                      {selectedSession.serverName}
                    </p>
                  </div>
                  {selectedSession.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Número de Telefone
                      </label>
                      <p className="text-sm text-secondary-900 dark:text-secondary-100">
                        {selectedSession.phoneNumber}
                      </p>
                    </div>
                  )}
                  {selectedSession.connectedAt && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Conectado em
                      </label>
                      <p className="text-sm text-secondary-900 dark:text-secondary-100">
                        {new Date(selectedSession.connectedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Foto de Perfil */}
                {selectedSession.avatar && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Foto de Perfil
                    </label>
                    <img
                      src={selectedSession.avatar}
                      alt={selectedSession.name}
                      className="w-20 h-20 rounded-full border-2 border-secondary-200 dark:border-secondary-700"
                    />
                  </div>
                )}

                {/* QR Code */}
                {(selectedSession.status === 'SCAN_QR_CODE' || selectedSession.status === 'STARTING' || qrCode) && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      QR Code para Conectar
                    </label>
                    <div className="text-center">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                        1. Abra o WhatsApp no seu celular<br/>
                        2. Toque em Menu ou Configurações<br/>
                        3. Toque em "Dispositivos conectados"<br/>
                        4. Toque em "Conectar um dispositivo"<br/>
                        5. Escaneie o QR Code abaixo
                      </p>
                      
                      {qrCode ? (
                        <div className="bg-white dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 inline-block">
                          <img 
                            src={qrCode} 
                            alt="QR Code WhatsApp" 
                            className="w-64 h-64"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => loadQrCode(selectedSession)}
                          disabled={loadingQr}
                          className="btn btn-primary"
                        >
                          <QrCodeIcon className="h-5 w-5" />
                          {loadingQr ? 'Carregando QR Code...' : 'Gerar QR Code'}
                        </button>
                      )}
                      
                      {checkingConnection && (
                        <div className="mt-4 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400 mr-2"></div>
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            Verificando conexão...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Configurações da Sessão */}
                {selectedSession.config && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Configurações
                    </label>
                    <div className="bg-secondary-50 dark:bg-secondary-700/50 rounded-lg p-4">
                      <pre className="text-xs text-secondary-700 dark:text-secondary-300 overflow-auto">
                        {JSON.stringify(selectedSession.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    stopConnectionCheck()
                    stopQrRefresh()
                    setShowQrModal(false)
                    setQrCode(null)
                    setSelectedSession(null)
                  }}
                  className="btn btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Sucesso */}
      <SuccessModal
        open={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        autoCloseDelay={4000}
        onClose={() => setShowSuccessModal(false)}
        onAutoClose={() => setShowSuccessModal(false)}
      />
    </div>
  )
}

