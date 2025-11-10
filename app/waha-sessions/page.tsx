'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [qrAutoRefreshTimer, setQrAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null)
  const [qrCountdown, setQrCountdown] = useState<number>(25)
  const [qrCodeGenerating, setQrCodeGenerating] = useState<boolean>(false) // Mutex para evitar gerações simultâneas
  const [qrAutoRefreshPaused, setQrAutoRefreshPaused] = useState<boolean>(false) // Pausar atualização automática
  const [servers, setServers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedServerId, setSelectedServerId] = useState<string>('')
  const [unifiedMode, setUnifiedMode] = useState<boolean>(true)
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set())
  const [restartingSession, setRestartingSession] = useState<string | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const restartPollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) return

    let interval: NodeJS.Timeout | null = null
    
    const loadInitialData = async () => {
      await loadServers()
      if (unifiedMode) {
        loadAllSessions()
      } else if (selectedServerId) {
        loadSessions(selectedServerId)
      }
    }

    loadInitialData()

    // Configurar polling apenas após carregar dados iniciais
    interval = setInterval(() => {
      if (unifiedMode) {
        loadAllSessions()
      } else if (selectedServerId) {
        loadSessions(selectedServerId)
      }
    }, 5000)

    return () => {
      if (interval) clearInterval(interval)
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
    // Prevenir múltiplas chamadas simultâneas
    if (loadingSessions) {
      return
    }

    try {
      setLoadingSessions(true)
      const response = await fetch('/api/waha/sessions/all')
      const data = await response.json()
      
      if (data.success) {
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
      setLoadingSessions(false)
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
        const hasPhoneNumber = !!session.phoneNumber || !!session.me?.id // phoneNumber pode estar em me.id também
        const hasPushName = !!session.me?.pushName
        
        // Verificar múltiplas condições de conexão
        // Status WORKING indica conexão estabelecida
        const isConnectedByStatus = ['WORKING', 'CONNECTED', 'READY', 'AUTHENTICATED'].includes(status)
        // Se tem me.id e não está em SCAN_QR_CODE ou STARTING, está conectado
        const isConnectedByMe = hasMeId && status !== 'SCAN_QR_CODE' && status !== 'STARTING' && status !== 'STOPPED'
        // Se tem phoneNumber e não está escaneando QR, está conectado
        const isConnectedByPhone = hasPhoneNumber && status !== 'SCAN_QR_CODE' && status !== 'STARTING'
        
        // Considerar conectado se qualquer uma das condições for verdadeira
        const isConnected = isConnectedByStatus || isConnectedByMe || isConnectedByPhone

        // Se detectou conectado e há QR code aberto para esta sessão
        if (isConnected) {
          // Verificar se é a sessão do QR code atual ou se não há QR code aberto (conexão já estabelecida)
          const shouldClose = qrCodeData?.session === sessionName || !qrCodeData
          
          if (shouldClose && !connectionDetected) {
            
            // Marcar como detectado para evitar múltiplos toasts
            setConnectionDetected(true)
            
            // Parar o polling IMEDIATAMENTE para evitar loop
            if (qrPollingInterval) {
              clearInterval(qrPollingInterval)
              setQrPollingInterval(null)
            }
            
            // Parar cronômetro de atualização automática
            stopQrAutoRefresh()
            
            // Fechar QR Code se estiver aberto
            if (qrCodeData) {
              setQrCodeData(null)
            }
            
            // Resetar estados
            setQrAutoRefreshPaused(false)
            setQrCodeGenerating(false)
            
            // Atualizar lista de sessões imediatamente
            if (unifiedMode) {
              loadAllSessions()
            } else if (selectedServerId) {
              loadSessions(selectedServerId)
            }
            
            // Mostrar toast de sucesso
            toast.success('✅ WhatsApp conectado com sucesso!', {
              duration: 4000,
              icon: '🎉'
            })
            
            return true // Indica que a conexão foi detectada
          }
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
    // Limpar intervalo anterior se existir
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval)
      setQrPollingInterval(null)
    }
    
    // Resetar estado de conexão detectada
    setConnectionDetected(false)
    
    // Verificar imediatamente ao iniciar (para detectar conexões já estabelecidas)
    checkSessionStatus(sessionName, serverId).catch(err => {
      console.error('Erro na verificação inicial:', err)
    })
    
    // Iniciar polling a cada 2 segundos (mais frequente para detectar mais rápido)
    const interval = setInterval(async () => {
      const connected = await checkSessionStatus(sessionName, serverId)
      
      // Se detectou conexão, parar o polling
      if (connected) {
        clearInterval(interval)
        setQrPollingInterval(null)
      }
    }, 2000) // Verificar a cada 2 segundos para detecção mais rápida
    
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
      if (qrAutoRefreshTimer) {
        clearInterval(qrAutoRefreshTimer)
        setQrAutoRefreshTimer(null)
      }
      // Limpar polling de restart
      if (restartPollingIntervalRef.current) {
        clearInterval(restartPollingIntervalRef.current)
        restartPollingIntervalRef.current = null
      }
    }
  }, [qrAutoRefreshTimer])

  // Iniciar cronômetro de atualização automática do QR code (25 segundos)
  // QR codes do WhatsApp expiram em ~20 segundos, mas alguns podem durar até 30 segundos
  // Usamos 25 segundos para dar tempo suficiente para escanear sem ser muito agressivo
  const startQrAutoRefresh = (sessionName: string, serverId: string, delay: number = 0) => {
    // Limpar timer anterior se existir
    if (qrAutoRefreshTimer) {
      clearInterval(qrAutoRefreshTimer)
      setQrAutoRefreshTimer(null)
    }
    
    // Se estiver pausado, não iniciar
    if (qrAutoRefreshPaused) {
      return
    }
    
    // Aguardar delay antes de iniciar (se fornecido)
    if (delay > 0) {
      setTimeout(() => {
        if (!qrAutoRefreshPaused) {
          startQrAutoRefresh(sessionName, serverId, 0)
        }
      }, delay)
      return
    }
    
    // Resetar contador para 25 segundos
    setQrCountdown(25)
    
    // Criar novo timer que decrementa a cada segundo
    const countdownInterval = setInterval(() => {
      // Verificar se está pausado durante a contagem
      if (qrAutoRefreshPaused) {
        clearInterval(countdownInterval)
        setQrAutoRefreshTimer(null)
        return
      }
      
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // Quando chegar a 0, gerar novo QR code e reiniciar cronômetro
          clearInterval(countdownInterval)
          setQrAutoRefreshTimer(null)
          
          // Verificar novamente se está pausado antes de gerar
          if (qrAutoRefreshPaused) {
            return 25
          }
          
          // Verificar se já não está gerando (evitar duplicação) usando função de estado
          setQrCodeGenerating((currentlyGenerating) => {
            if (!currentlyGenerating && !qrAutoRefreshPaused) {
              handleGetQrCode(sessionName, serverId, false)
            } else {
            }
            return currentlyGenerating
          })
          return 25 // Resetar contador
        }
        return prev - 1
      })
    }, 1000)
    
    setQrAutoRefreshTimer(countdownInterval)
  }

  // Parar cronômetro de atualização automática
  const stopQrAutoRefresh = () => {
    if (qrAutoRefreshTimer) {
      clearInterval(qrAutoRefreshTimer)
      setQrAutoRefreshTimer(null)
    }
    setQrCountdown(25)
    setQrAutoRefreshPaused(false)
  }

  // Pausar/Retomar atualização automática
  const toggleQrAutoRefresh = () => {
    setQrAutoRefreshPaused(!qrAutoRefreshPaused)
    if (!qrAutoRefreshPaused) {
      // Pausar
      if (qrAutoRefreshTimer) {
        clearInterval(qrAutoRefreshTimer)
        setQrAutoRefreshTimer(null)
      }
    } else {
      // Retomar - reiniciar cronômetro se houver QR code ativo
      if (qrCodeData) {
        startQrAutoRefresh(qrCodeData.session, qrCodeData.serverId || '')
      }
    }
  }

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
          // Iniciar cronômetro de atualização automática (25 segundos)
          startQrAutoRefresh(newSessionName, selectedServerId, 10000) // Delay de 10s para dar tempo de escanear
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

  const handleGetQrCode = async (sessionName: string, serverId?: string, showLoading: boolean = true) => {
    // Mutex: evitar gerações simultâneas
    if (qrCodeGenerating) {
      return
    }
    
    try {
      setQrCodeGenerating(true)
      
      const targetServerId = serverId || selectedServerId
      if (!targetServerId) {
        toast.error('Servidor não identificado')
        setQrCodeGenerating(false)
        return
      }
      
      if (showLoading) {
        toast.loading('Gerando QR Code...', { id: 'qr-loading' })
      }
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/qr?serverId=${encodeURIComponent(targetServerId)}`)
      const data = await response.json()

      if (showLoading) {
        toast.dismiss('qr-loading')
      }

      if (data.success && data.qr) {
        // Validar se o QR code não está vazio ou inválido
        const qrString = typeof data.qr === 'string' ? data.qr : ''
        if (!qrString || qrString.length < 50) {
          toast.error('QR Code inválido recebido. Tente novamente.')
          setQrCodeGenerating(false)
          return
        }
        
        
        // NÃO modificar o QR code - usar exatamente como recebido
        const qrCodeToUse = data.qr
        
        
        // Resetar estado de conexão detectada ao gerar novo QR code
        setConnectionDetected(false)
        
        // Atualizar o QR code no estado (forçar re-render da imagem)
        setQrCodeData({ session: sessionName, qr: qrCodeToUse, serverId: targetServerId })
        
        // SEMPRE reiniciar polling ao gerar novo QR code para garantir detecção
        startQrPolling(sessionName, targetServerId)
        
        // Reiniciar cronômetro de atualização automática (25 segundos)
        // Aguardar 10 segundos antes de iniciar o cronômetro para dar tempo suficiente de escanear o QR atual
        // Isso garante que o usuário tenha pelo menos 10 segundos para escanear antes do primeiro countdown iniciar
        startQrAutoRefresh(sessionName, targetServerId, showLoading ? 10000 : 5000)
        
        if (showLoading) {
          toast.success('QR Code gerado com sucesso! Escaneie rapidamente.')
        } else {
          // Log silencioso para atualizações automáticas
        }
      } else {
        const errorMsg = data.error || 'QR Code não disponível'
        toast.error(errorMsg, { duration: 5000 })
        
        // Se o erro sugerir reiniciar, oferecer essa opção
        if (errorMsg.includes('reiniciar') || errorMsg.includes('não está pronta')) {
          const shouldRestart = confirm('A sessão pode precisar ser reiniciada. Deseja tentar reiniciar agora?')
          if (shouldRestart) {
            try {
              toast.loading('Reiniciando sessão...', { id: 'restart-loading' })
              const restartResponse = await fetch(`/api/waha/sessions/${sessionName}/restart?serverId=${encodeURIComponent(targetServerId)}`, {
                method: 'POST'
              })
              const restartData = await restartResponse.json()
              toast.dismiss('restart-loading')
              
              if (restartData.success) {
                toast.success('Sessão reiniciada. Aguarde 3 segundos e tente gerar o QR Code novamente.')
                // Aguardar e tentar novamente
                setTimeout(() => {
                  handleGetQrCode(sessionName, targetServerId, false)
                }, 3000)
              } else {
                toast.error(restartData.error || 'Erro ao reiniciar sessão')
              }
            } catch (restartError) {
              toast.dismiss('restart-loading')
              console.error('Erro ao reiniciar sessão:', restartError)
              toast.error('Erro ao reiniciar sessão')
            }
          }
        }
      }
    } catch (error) {
      if (showLoading) {
        toast.dismiss('qr-loading')
      }
      console.error('Erro ao obter QR Code:', error)
      toast.error('Erro ao obter QR Code. Verifique se o servidor WAHA está online.', { duration: 5000 })
    } finally {
      setQrCodeGenerating(false)
    }
  }

  const handleRestartSession = async (sessionName: string, serverId?: string) => {
    // Prevenir múltiplas chamadas simultâneas
    if (restartingSession === sessionName) {
      return
    }

    try {
      const targetServerId = serverId || selectedServerId
      if (!targetServerId) {
        toast.error('Servidor não identificado')
        return
      }

      setRestartingSession(sessionName)
      toast.loading('Reiniciando sessão...', { id: 'restart-session' })
      
      const url = `/api/waha/sessions/${encodeURIComponent(sessionName)}/restart?serverId=${encodeURIComponent(targetServerId)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido')
        toast.dismiss('restart-session')
        setRestartingSession(null)
        toast.error(`Erro ${response.status}: ${errorText || response.statusText}`)
        return
      }

      const data = await response.json().catch(() => ({ success: false, error: 'Resposta inválida' }))
      
      toast.dismiss('restart-session')
      setRestartingSession(null)

      if (data.success) {
        toast.success('Sessão reiniciada com sucesso!')
        
        // Recarregar imediatamente para ver o status atualizado
        if (unifiedMode) {
          loadAllSessions()
        } else if (selectedServerId) {
          loadSessions(selectedServerId)
        }
        
        // Aguardar um pouco e recarregar novamente para garantir que o status foi atualizado
        setTimeout(() => {
          if (unifiedMode) {
            loadAllSessions()
          } else if (selectedServerId) {
            loadSessions(selectedServerId)
          }
        }, 3000)
        
        // Polling adicional para verificar mudanças de status (até 5 tentativas)
        let pollCount = 0
        const maxPolls = 5
        const pollInterval = setInterval(() => {
          pollCount++
          
          if (unifiedMode) {
            loadAllSessions()
          } else if (selectedServerId) {
            loadSessions(selectedServerId)
          }
          
          // Parar após maxPolls tentativas ou se a sessão mudou de status
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
          }
        }, 2000) // Verificar a cada 2 segundos
        
        // Limpar o polling após 15 segundos (segurança)
        setTimeout(() => {
          clearInterval(pollInterval)
        }, 15000)
      } else {
        toast.error(data.error || 'Erro ao reiniciar sessão')
      }
    } catch (error) {
      toast.dismiss('restart-session')
      setRestartingSession(null)
      console.error('[RESTART] Erro ao reiniciar sessão:', error)
      toast.error('Erro ao reiniciar sessão: ' + (error instanceof Error ? error.message : String(error)))
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

                    {/* Botão de reiniciar para sessões com erro */}
                    {(session.status === 'FAILED' || session.status === 'STOPPED') && session.serverId && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleRestartSession(session.name, session.serverId!)}
                          disabled={restartingSession === session.name}
                          className="w-full btn btn-primary btn-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reiniciar sessão"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${restartingSession === session.name ? 'animate-spin' : ''}`} />
                          {restartingSession === session.name ? 'Reiniciando...' : 'Reiniciar Sessão'}
                        </button>
                      </div>
                    )}

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
                          onClick={() => handleRestartSession(session.name, session.serverId)}
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
          <div className="bg-white rounded-lg max-w-lg w-full p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">
                QR Code - {qrCodeData.session}
              </h2>
              <button
                onClick={() => {
                  stopQrPolling()
                  stopQrAutoRefresh()
                  setQrCodeData(null)
                  setConnectionDetected(false)
                  setQrAutoRefreshPaused(false)
                  setQrCodeGenerating(false)
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* QR Code - Reduzido e centralizado */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative bg-white p-3 rounded-lg border-2 border-gray-200 shadow-lg">
                <img 
                  key={qrCodeData.qr.substring(0, 100)}
                  src={qrCodeData.qr} 
                  alt="QR Code" 
                  id="qr-code-image"
                  className="border-2 border-black rounded-lg bg-white"
                  style={{ 
                    imageRendering: 'auto',
                    width: '280px',
                    height: '280px',
                    minWidth: '280px',
                    minHeight: '280px',
                    objectFit: 'contain',
                    display: 'block',
                    backgroundColor: '#ffffff',
                    padding: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onError={(e) => {
                    toast.error('Erro ao exibir QR Code. Tentando atualizar...')
                    setTimeout(() => {
                      if (qrCodeData) {
                        handleGetQrCode(qrCodeData.session, qrCodeData.serverId, false)
                      }
                    }, 2000)
                  }}
                />
              </div>
            </div>

            {/* Status de conexão - Compacto */}
            <div className="mb-3 p-2 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-xs text-primary-700">Aguardando conexão automática...</span>
              </div>
            </div>

            {/* Cronômetro e Controles - Reorganizado */}
            <div className="mb-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-warning-700" />
                  <span className="text-xs font-medium text-warning-800">
                    {qrAutoRefreshPaused ? (
                      <span className="text-secondary-600">Pausado</span>
                    ) : (
                      <>Próximo QR em: <span className="font-bold">{qrCountdown}s</span></>
                    )}
                  </span>
                </div>
                <button
                  onClick={toggleQrAutoRefresh}
                  className="text-xs px-2 py-1 rounded bg-warning-100 hover:bg-warning-200 text-warning-800 font-medium transition-colors"
                >
                  {qrAutoRefreshPaused ? '▶️ Retomar' : '⏸️ Pausar'}
                </button>
              </div>
              <p className="text-xs text-warning-600 text-center">
                ⚠️ Escaneie rapidamente! QR codes expiram em ~20-30 segundos
              </p>
            </div>

            {/* Instruções - Compactas */}
            <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-medium mb-1 text-center">
                📱 Como escanear:
              </p>
              <ul className="text-xs text-blue-700 space-y-0.5 text-left">
                <li>1. Abra WhatsApp → Configurações → Aparelhos conectados</li>
                <li>2. Toque em "Conectar um aparelho"</li>
                <li>3. Aponte a câmera para o QR Code acima</li>
              </ul>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const img = document.getElementById('qr-code-image') as HTMLImageElement
                  if (img && img.src) {
                    const link = document.createElement('a')
                    link.download = `qr-code-${qrCodeData.session}-${Date.now()}.png`
                    link.href = img.src
                    link.click()
                    toast.success('QR Code baixado!')
                  }
                }}
                className="flex-1 btn btn-secondary btn-sm text-xs"
              >
                📥 Baixar
              </button>
              <button
                onClick={() => {
                  if (qrCodeData) {
                    startQrAutoRefresh(qrCodeData.session, qrCodeData.serverId || '', 10000)
                    handleGetQrCode(qrCodeData.session, qrCodeData.serverId)
                  }
                }}
                className="flex-1 btn btn-primary btn-sm text-xs"
              >
                🔄 Atualizar QR
              </button>
              <button
                onClick={() => {
                  stopQrPolling()
                  stopQrAutoRefresh()
                  setQrCodeData(null)
                  setConnectionDetected(false)
                  setQrAutoRefreshPaused(false)
                  setQrCodeGenerating(false)
                }}
                className="flex-1 btn btn-secondary btn-sm text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
