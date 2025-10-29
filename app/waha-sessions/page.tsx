'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import PageHeader from '@/components/PageHeader'
import Sidebar from '@/components/Sidebar'
import { 
  DevicePhoneMobileIcon, 
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'

interface WahaSession {
  name: string
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED'
  config?: {
    webhooks?: string[]
  }
  me?: {
    id: string
    pushName?: string
    avatar?: string
  }
  serverId?: string
  serverName?: string
  avatar?: string
  connectedAt?: string
  phoneNumber?: string
}

export default function WahaSessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<WahaSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [qrCodeData, setQrCodeData] = useState<{ session: string; qr: string; serverId?: string } | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [qrPollingInterval, setQrPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [connectionDetected, setConnectionDetected] = useState<boolean>(false)
  const [servers, setServers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedServerId, setSelectedServerId] = useState<string>('')
  const [unifiedMode, setUnifiedMode] = useState<boolean>(true)
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      loadServers()
      // Carregar sessões iniciais
      if (unifiedMode) {
        loadAllSessions()
      }
      const interval = setInterval(() => {
        if (unifiedMode) {
          loadAllSessions()
        } else if (selectedServerId) {
          loadSessions(selectedServerId)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [user, unifiedMode, selectedServerId])

  const loadServers = async () => {
    try {
      const response = await fetch('/api/config/waha/list')
      if (response.ok) {
        const data = await response.json()
        const list = (data.servers || []).map((s: any) => ({ id: s.id, name: s.name }))
        setServers(list)
        if (list.length && !selectedServerId) {
          setSelectedServerId(list[0].id)
          loadSessions(list[0].id)
        }
      }
    } catch (e) {
      console.error('Erro ao carregar servidores WAHA', e)
    }
  }

  const loadSessions = async (serverId: string) => {
    try {
      const response = await fetch(`/api/waha/sessions?serverId=${encodeURIComponent(serverId)}`)
      const data = await response.json()
      
      if (data.success) {
        const newSessions = data.sessions || []
        setSessions(newSessions)
        // Limpar avatares falhados que não existem mais nas novas sessões
        setFailedAvatars(prev => {
          const sessionNames = new Set(newSessions.map((s: WahaSession) => s.name))
          return new Set([...prev].filter(name => sessionNames.has(name)))
        })
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllSessions = async () => {
    try {
      console.log('🔄 Carregando sessões de todos os servidores...')
      const response = await fetch('/api/waha/sessions/all')
      const data = await response.json()
      
      console.log('📊 Resposta da API:', data)
      
      if (data.success) {
        console.log('✅ Sessões carregadas:', data.sessions?.length || 0)
        const newSessions = data.sessions || []
        setSessions(newSessions)
        // Limpar avatares falhados que não existem mais nas novas sessões
        setFailedAvatars(prev => {
          const sessionNames = new Set(newSessions.map((s: WahaSession) => s.name))
          return new Set([...prev].filter(name => sessionNames.has(name)))
        })
      } else {
        console.error('❌ Erro na API:', data.error)
      }
    } catch (e) {
      console.error('❌ Erro ao carregar sessões unificadas:', e)
    } finally {
      setLoading(false)
    }
  }

  // Verificar status da sessão para detectar conexão
  const checkSessionStatus = async (sessionName: string, serverId: string) => {
    try {
      const response = await fetch(`/api/waha/sessions/${sessionName}?serverId=${encodeURIComponent(serverId)}`)
      const data = await response.json()
      
      if (data.success && data.session) {
        const session = data.session
        const status: string = (session.status || '').toUpperCase()
        const hasMeId = !!session.me?.id
        const isConnected = ['WORKING', 'CONNECTED', 'READY', 'AUTHENTICATED'].includes(status) || (hasMeId && status !== 'SCAN_QR_CODE')

        // Logs de debug
        console.log('[WAHA] checkSessionStatus', { sessionName, status, hasMeId, isConnected })

        // Se detectou conectado por status conhecido ou presença de me.id, finalizar
        if (isConnected && qrCodeData?.session === sessionName && !connectionDetected) {
          console.log('✅ WhatsApp conectado! Fechando QR Code...')
          
          // Marcar como detectado para evitar múltiplos toasts
          setConnectionDetected(true)
          
          // Parar o polling IMEDIATAMENTE para evitar loop
          if (qrPollingInterval) {
            clearInterval(qrPollingInterval)
            setQrPollingInterval(null)
          }
          
          // Fechar QR Code
          setQrCodeData(null)
          
          // Atualizar lista de sessões
          if (unifiedMode) {
            loadAllSessions()
          } else if (selectedServerId) {
            loadSessions(selectedServerId)
          }
          
          // Mostrar toast apenas uma vez
          toast.success('WhatsApp conectado com sucesso!')
          
          return true // Indica que a conexão foi detectada
        }
        
        return false // Não detectou conexão ainda
      }
    } catch (error) {
      console.error('Erro ao verificar status da sessão:', error)
    }
    return false
  }

  // Iniciar polling para verificar conexão
  const startQrPolling = (sessionName: string, serverId: string) => {
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval)
    }
    
    // Resetar estado de conexão detectada
    setConnectionDetected(false)
    
    const interval = setInterval(async () => {
      const connected = await checkSessionStatus(sessionName, serverId)
      
      // Se detectou conexão, parar o polling
      if (connected) {
        clearInterval(interval)
        setQrPollingInterval(null)
        console.log('🛑 Polling parado - conexão detectada')
      }
    }, 3000) // Verificar a cada 3 segundos
    
    setQrPollingInterval(interval)
  }

  // Parar polling
  const stopQrPolling = () => {
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval)
      setQrPollingInterval(null)
    }
  }

  // Cleanup do polling quando componente desmontar
  useEffect(() => {
    return () => {
      stopQrPolling()
    }
  }, [])

  // Formatar número de telefone brasileiro
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return ''
    
    // Remove caracteres não numéricos
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Se começar com 55 (código do Brasil), remove
    const withoutCountryCode = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned
    
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (withoutCountryCode.length === 11) {
      return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 7)}-${withoutCountryCode.slice(7)}`
    } else if (withoutCountryCode.length === 10) {
      return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 6)}-${withoutCountryCode.slice(6)}`
    }
    
    return phoneNumber // Retorna original se não conseguir formatar
  }

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      toast.error('Digite um nome para a sessão')
      return
    }
    if (!selectedServerId) {
      toast.error('Selecione um servidor WAHA')
      return
    }

    setCreatingSession(true)
    try {
      const response = await fetch('/api/waha/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName, serverId: selectedServerId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Sessão criada com sucesso!')
        setShowNewSessionModal(false)
        setNewSessionName('')
        loadSessions(selectedServerId)
        
        // Se retornou QR code, mostrar e iniciar polling
        if (data.qr) {
          setQrCodeData({ session: newSessionName, qr: data.qr, serverId: selectedServerId })
          // Iniciar polling para detectar conexão
          startQrPolling(newSessionName, selectedServerId)
        }
      } else {
        toast.error(data.error || 'Erro ao criar sessão')
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      toast.error('Erro ao criar sessão')
    } finally {
      setCreatingSession(false)
    }
  }

  const handleDeleteSession = async (sessionName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sessão "${sessionName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/waha/sessions/${sessionName}?serverId=${encodeURIComponent(selectedServerId)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Sessão excluída com sucesso!')
        loadSessions(selectedServerId)
      } else {
        toast.error(data.error || 'Erro ao excluir sessão')
      }
    } catch (error) {
      console.error('Erro ao excluir sessão:', error)
      toast.error('Erro ao excluir sessão')
    }
  }

  const handleGetQrCode = async (sessionName: string, serverId?: string) => {
    try {
      const targetServerId = serverId || selectedServerId
      if (!targetServerId) {
        toast.error('Servidor não identificado')
        return
      }
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/qr?serverId=${encodeURIComponent(targetServerId)}`)
      const data = await response.json()

      if (data.success && data.qr) {
        setQrCodeData({ session: sessionName, qr: data.qr, serverId: targetServerId })
        // Iniciar polling para detectar conexão
        startQrPolling(sessionName, targetServerId)
      } else {
        toast.error(data.error || 'QR Code não disponível')
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error)
      toast.error('Erro ao obter QR Code')
    }
  }

  const handleRestartSession = async (sessionName: string) => {
    try {
      const response = await fetch(`/api/waha/sessions/${sessionName}/restart?serverId=${encodeURIComponent(selectedServerId)}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Sessão reiniciada com sucesso!')
        loadSessions()
      } else {
        toast.error(data.error || 'Erro ao reiniciar sessão')
      }
    } catch (error) {
      console.error('Erro ao reiniciar sessão:', error)
      toast.error('Erro ao reiniciar sessão')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'WORKING': {
        bg: 'bg-success-100',
        text: 'text-success-800',
        icon: CheckCircleIcon,
        label: 'Conectado'
      },
      'SCAN_QR_CODE': {
        bg: 'bg-warning-100',
        text: 'text-warning-800',
        icon: QrCodeIcon,
        label: 'Aguardando QR'
      },
      'STARTING': {
        bg: 'bg-primary-100',
        text: 'text-primary-800',
        icon: ClockIcon,
        label: 'Iniciando'
      },
      'STOPPED': {
        bg: 'bg-secondary-100',
        text: 'text-secondary-800',
        icon: XCircleIcon,
        label: 'Parado'
      },
      'FAILED': {
        bg: 'bg-error-100',
        text: 'text-error-800',
        icon: XCircleIcon,
        label: 'Erro'
      }
    }

    const badge = badges[status as keyof typeof badges] || badges.STOPPED
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        
        <main className="py-6" suppressHydrationWarning>
          <div className="px-3 md:px-4 lg:px-6" suppressHydrationWarning>
            {/* Header padronizado */}
            <PageHeader
              title="Sessões WAHA"
              subtitle="Gerencie suas sessões do WhatsApp com WAHA API"
              icon={<DevicePhoneMobileIcon className="h-6 w-6" />}
              actions={(
                <>
                  <label className="flex items-center space-x-2 text-sm text-secondary-700">
                    <input
                      type="checkbox"
                      checked={unifiedMode}
                      onChange={(e) => {
                        setUnifiedMode(e.target.checked)
                        if (e.target.checked) loadAllSessions()
                      }}
                    />
                    <span>Exibir sessões de todos servidores</span>
                  </label>
                  {!unifiedMode ? (
                    <select
                      className="input"
                      value={selectedServerId}
                      onChange={(e) => {
                        setSelectedServerId(e.target.value)
                        if (e.target.value) loadSessions(e.target.value)
                      }}
                    >
                      <option value="">Selecione um servidor</option>
                      {servers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="btn btn-primary btn-md"
                    disabled={!unifiedMode && !selectedServerId}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nova Sessão
                  </button>
                </>
              )}
            />

            {/* Lista de Sessões */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
                <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">Nenhuma sessão</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  Comece criando uma nova sessão do WhatsApp
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="btn btn-primary btn-md"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Primeira Sessão
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {sessions.map((session, index) => (
                  <div key={`session-${session.name}-${session.serverId || 'noserver'}-${index}`} className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-secondary-900">{session.name}</h3>
                        {session.serverName ? (
                          <p className="text-xs text-secondary-500 mt-1">Servidor: {session.serverName}</p>
                        ) : null}
                      </div>
                      <div>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>

                    {session.me ? (
                      <div className="mb-4 p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {/* Foto de Perfil */}
                          {session.avatar && !failedAvatars.has(session.name) ? (
                            <div className="w-12 h-12 rounded-full border-2 border-secondary-200 overflow-hidden flex-shrink-0 flex items-center justify-center bg-primary-100">
                              <img 
                                src={session.avatar} 
                                alt="Foto de perfil" 
                                className="w-full h-full object-cover rounded-full"
                                onError={() => {
                                  setFailedAvatars(prev => new Set(prev).add(session.name))
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-secondary-200 flex-shrink-0 flex items-center justify-center bg-primary-100">
                              <DevicePhoneMobileIcon className="h-6 w-6 text-primary-600" />
                            </div>
                          )}
                          
                          {/* Informações */}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">
                              {session.me.pushName || 'Sem nome'}
                            </p>
                            {session.phoneNumber ? (
                              <p className="text-[10px] text-secondary-600 whitespace-nowrap">
                                {formatPhoneNumber(session.phoneNumber)}
                              </p>
                            ) : null}
                            {session.connectedAt ? (
                              <p className="text-[9px] text-secondary-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                Conectado em: {new Date(session.connectedAt).toLocaleString('pt-BR')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex space-x-2">
                      {session.status === 'SCAN_QR_CODE' ? (
                        <button
                          onClick={() => handleGetQrCode(session.name, session.serverId)}
                          className="flex-1 btn btn-primary btn-sm"
                        >
                          <QrCodeIcon className="h-4 w-4 mr-1" />
                          Ver QR
                        </button>
                      ) : null}
                      
                      {session.status === 'WORKING' ? (
                        <button
                          onClick={() => handleRestartSession(session.name)}
                          className="flex-1 btn btn-secondary btn-sm"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Reiniciar
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleDeleteSession(session.name)}
                        className="btn btn-error btn-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nova Sessão */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Nova Sessão WAHA</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nome da Sessão
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="ex: minha-sessao"
                className="input"
                disabled={creatingSession}
              />
              <p className="mt-1 text-xs text-secondary-500">
                Use apenas letras minúsculas, números e hífens
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 btn btn-secondary btn-md"
                disabled={creatingSession}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                className="flex-1 btn btn-primary btn-md"
                disabled={creatingSession}
              >
                {creatingSession ? 'Criando...' : 'Criar Sessão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              QR Code - {qrCodeData.session}
            </h2>
            
            <div className="mb-4 flex justify-center">
              <img 
                src={qrCodeData.qr} 
                alt="QR Code" 
                className="w-64 h-64 border-2 border-secondary-200 rounded-lg"
              />
            </div>

            <p className="text-sm text-secondary-600 mb-4 text-center">
              Escaneie este QR Code com o WhatsApp do seu celular
            </p>
            
            <div className="mb-4 p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-sm text-primary-700">Aguardando conexão...</span>
              </div>
              <p className="text-xs text-primary-600 mt-1 text-center">
                O sistema detectará automaticamente quando o WhatsApp conectar
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  stopQrPolling()
                  setQrCodeData(null)
                  setConnectionDetected(false)
                }}
                className="flex-1 btn btn-secondary btn-md"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  if (qrCodeData) {
                    handleGetQrCode(qrCodeData.session, qrCodeData.serverId)
                  }
                }}
                className="flex-1 btn btn-primary btn-md"
              >
                Atualizar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
