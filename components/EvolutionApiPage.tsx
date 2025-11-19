'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ServerIcon,
  QrCodeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  UserCircleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import LoadingOverlay from './LoadingOverlay'
import SuccessModal from './SuccessModal'
import ConfirmModal from './ConfirmModal'
import InstanceMonitor from './InstanceMonitorBackground'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAlertContext } from '@/lib/contexts/AlertContext'
import PageHeader from './PageHeader'

export default function EvolutionApiPage() {
  const { user: currentUser } = useAuth()
  const { showError, showSuccess } = useAlertContext()
  
  const [evolutionConfig, setEvolutionConfig] = useState({
    apiUrl: '',
    globalApiKey: '',
    webhookUrl: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState({
    open: false,
    title: 'Carregando...',
    message: 'Estamos carregando os dados. Aguarde um momento.'
  })
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: 'Sucesso!',
    message: 'Operação realizada com sucesso.',
    onAutoClose: undefined as (() => void) | undefined,
    autoCloseDelay: 5000
  })

  const showSuccessModal = (title: string, message: string, onAutoClose?: () => void, autoCloseDelay?: number) => {
    setSuccessModal({
      open: true,
      title,
      message,
      onAutoClose,
      autoCloseDelay: autoCloseDelay || 5000
    })
  }

  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    phoneNumber: null as string | null,
    lastSeen: null as string | null,
    qrCode: null as string | null,
    instanceName: '',
    instanceStatus: 'disconnected',
    profile: {
      userName: null as string | null,
      userPhone: null as string | null,
      userAvatar: null as string | null,
      userStatus: null as string | null
    }
  })
  
  const [instances, setInstances] = useState<any[]>([])
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [connectionCheckInterval, setConnectionCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [qrCodeTimer, setQrCodeTimer] = useState<NodeJS.Timeout | null>(null)
  const [qrCodeCountdown, setQrCodeCountdown] = useState<number>(0)
  const [qrCodeModal, setQrCodeModal] = useState(false)
  
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'danger' as 'danger' | 'warning',
    onConfirm: () => {},
    resolveRef: null as ((value: boolean) => void) | null
  })

  const openConfirm = (opts: { title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'warning' | 'danger' }): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmModal({
        open: true,
        title: opts.title,
        message: opts.message,
        variant: opts.variant || 'danger',
        onConfirm: () => {
          setConfirmModal({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, resolveRef: null })
          resolve(true)
        },
        resolveRef: resolve
      })
    })
  }

  // Carregar configurações quando o componente montar
  useEffect(() => {
    if (!currentUser?.id) return
    
    const loadInitialData = async () => {
      setLoadingOverlay({
        open: true,
        title: 'Carregando página...',
        message: 'Estamos carregando suas configurações e instâncias. Aguarde.'
      })
      
      try {
        await loadUserConfig()
        // Carregar instâncias independente da configuração
        // A rota busca as configurações do Supabase automaticamente
        // Usar setTimeout para evitar chamadas simultâneas
        setTimeout(() => {
          loadInstances()
        }, 200)
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
      } finally {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
      }
    }
    
    loadInitialData()
  }, [currentUser?.id])

  // Ref para controlar se já carregou as instâncias
  const hasLoadedInstancesRef = useRef(false)
  const lastConfigRef = useRef<string>('')

  // Carregar instâncias quando o usuário estiver disponível (apenas uma vez)
  useEffect(() => {
    if (currentUser?.id && !hasLoadedInstancesRef.current) {
      hasLoadedInstancesRef.current = true
      // Usar setTimeout para evitar chamadas simultâneas
      const timer = setTimeout(() => {
        loadInstances()
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]) // Carregar quando o usuário estiver disponível

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
      if (qrCodeTimer) {
        clearTimeout(qrCodeTimer)
      }
    }
  }, [connectionCheckInterval, qrCodeTimer])

  const loadUserConfig = async () => {
    if (!currentUser?.id) return
    
    try {
      const response = await fetch(`/api/evolution/save-config?userId=${encodeURIComponent(currentUser.id)}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setEvolutionConfig(prev => ({
          ...prev,
          apiUrl: data.data.api_url || '',
          globalApiKey: data.data.global_api_key || '',
          webhookUrl: data.data.webhook_url || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const saveUserConfig = async () => {
    if (!currentUser?.id) {
      showError('Usuário não autenticado')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
        showError('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoadingOverlay({
        open: true,
        title: 'Salvando configurações...',
        message: 'Estamos salvando suas configurações da Evolution API. Aguarde.'
      })
      const response = await fetch('/api/evolution/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          webhookUrl: evolutionConfig.webhookUrl
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccessModal(
          'Configurações salvas!',
          'Suas configurações da Evolution API foram salvas com sucesso.'
        )
      } else {
        showError(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      showError('Erro ao salvar configurações')
    } finally {
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleCreateInstance = async () => {
    if (!currentUser?.id) {
      showError('Usuário não autenticado')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
        showError('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    setLoadingOverlay({
      open: true,
      title: 'Criando instância...',
      message: 'Estamos criando uma nova instância. Por Favor, Aguarde.'
    })
    try {
      const response = await fetch('/api/evolution/create-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          instanceName: '',
          webhookUrl: evolutionConfig.webhookUrl,
          userId: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccessModal(
          'Instância criada!',
          'A nova instância foi criada com sucesso na Evolution API.'
        )
        
        try {
          const saveResponse = await fetch('/api/evolution/save-instance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              instanceName: data.data.instanceName,
              connectionStatus: 'disconnected'
            })
          })
          
          if (!saveResponse.ok) {
            const saveError = await saveResponse.json().catch(() => ({ error: 'Erro ao salvar instância' }))
            console.error('Erro ao salvar instância no Supabase:', saveError)
            showError('Instância criada, mas houve erro ao salvar no banco de dados')
          } else {
            const saveData = await saveResponse.json()
            if (saveData.success) {
              console.log('✅ Instância salva no Supabase:', saveData.data)
            }
          }
          
          // Recarregar instâncias após salvar
          await loadInstances()
        } catch (error) {
          console.error('Erro ao salvar instância no Supabase:', error)
          showError('Instância criada, mas houve erro ao salvar no banco de dados')
          // Mesmo com erro, recarregar para tentar mostrar a instância
          await loadInstances()
        }
      } else {
        showError(data.error || 'Erro ao criar instância')
      }
    } catch (error) {
      showError('Erro ao criar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleConnectInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      showError('Usuário não autenticado')
      return
    }
    
    if (!instanceName || !evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      showError('Selecione uma instância e configure a API')
      return
    }

    setLoading(true)
    setLoadingOverlay({
      open: true,
      title: 'Conectando instância...',
      message: `Gerando QR Code e iniciando a conexão da instância "${instanceName}". Aguarde.`
    })
    try {
      const response = await fetch('/api/evolution/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName: instanceName,
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          userId: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.qrCode) {
          setWhatsappStatus(prev => ({ ...prev, qrCode: data.qrCode, instanceName: instanceName }))
          setSelectedInstance(instanceName)
          
          showSuccessModal(
            'QR Code gerado!',
            'O QR Code foi gerado com sucesso. Escaneie com seu WhatsApp para conectar.'
          )
          
          setTimeout(() => {
            setSuccessModal(prev => ({ ...prev, open: false }))
            setQrCodeModal(true)
            startConnectionCheck(instanceName)
          }, 3000)
        } else {
          showSuccessModal(
            'Conectado!',
            'A instância foi conectada com sucesso ao WhatsApp.'
          )
        }
      } else {
        showError(data.error || 'Erro ao conectar instância')
      }
    } catch (error) {
      showError('Erro ao conectar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleDisconnectInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      showError('Usuário não autenticado')
      return
    }
    
    if (!instanceName) {
      showError('Selecione uma instância')
      return
    }

    const confirmDisconnect = await openConfirm({
      title: 'Desconectar instância',
      message: `Deseja realmente desconectar a instância "${instanceName}"?`,
      confirmText: 'Desconectar',
      cancelText: 'Cancelar',
      variant: 'warning'
    })
    if (!confirmDisconnect) {
      toast('Ação cancelada')
      return
    }

    setLoading(true)
    setLoadingOverlay({
      open: true,
      title: 'Desconectando instância...',
      message: `Estamos desconectando a instância "${instanceName}". Aguarde.`
    })
    try {
      const response = await fetch('/api/evolution/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName: instanceName,
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          userId: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccessModal(
          'Instância desconectada!',
          'A instância foi desconectada com sucesso.'
        )
        setWhatsappStatus(prev => ({ 
          ...prev, 
          connected: false, 
          phoneNumber: null, 
          qrCode: null,
          instanceStatus: 'disconnected'
        }))
        loadInstances()
      } else {
        showError(data.error || 'Erro ao desconectar instância')
      }
    } catch (error) {
      showError('Erro ao desconectar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const loadInstances = useCallback(async () => {
    if (!currentUser?.id) return
    
    // Não precisa verificar se apiUrl e globalApiKey estão configurados
    // A rota busca as configurações do Supabase automaticamente

    try {
      const response = await fetch(`/api/evolution/instances?userId=${encodeURIComponent(currentUser.id)}`)
      
      if (!response.ok) {
        // Se a resposta não for OK, tentar parsear como JSON ou usar dados padrão
        try {
          const errorData = await response.json()
          console.error('Erro ao carregar instâncias:', errorData)
          if (response.status === 401) {
            showError('Usuário não autenticado')
          } else {
            showError(errorData.message || 'Erro ao carregar instâncias')
          }
        } catch {
          console.error('Erro ao carregar instâncias: Resposta não é JSON')
          showError('Erro ao carregar instâncias')
        }
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        // A rota retorna tanto data.data quanto data.instances
        const instancesData = data.data || data.instances || []
        setInstances(instancesData)
        console.log(`✅ Instâncias carregadas: ${instancesData.length}`)
      } else {
        showError(data.error || data.message || 'Erro ao carregar instâncias')
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
      showError('Erro ao carregar instâncias')
    }
  }, [currentUser?.id])

  const handleDeleteInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      showError('Usuário não autenticado')
      return
    }
    
    if (isDeleting) return
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      showError('Configure a API primeiro')
      return
    }
    
    setIsDeleting(true)

    try {
      const confirmDelete = await openConfirm({
        title: 'Excluir instância',
        message: `Tem certeza que deseja excluir a instância "${instanceName}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'danger'
      })
      
      if (!confirmDelete) {
        toast('Ação cancelada')
        setIsDeleting(false)
        return
      }
    } catch (error) {
      console.error('Erro no modal de confirmação:', error)
      setIsDeleting(false)
      return
    }

    setLoading(true)
    setLoadingOverlay({
      open: true,
      title: 'Excluindo instância...',
      message: `Estamos excluindo a instância "${instanceName}". Aguarde.`
    })
    
    try {
      const response = await fetch('/api/evolution/delete-instance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          instanceName,
          userId: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccessModal(
          'Instância excluída!',
          'A instância foi excluída com sucesso.',
          () => {
            loadInstances()
          }
        )
        
        if (whatsappStatus.instanceName === instanceName) {
          setWhatsappStatus(prev => ({
            ...prev,
            connected: false,
            phoneNumber: null,
            qrCode: null,
            instanceName: '',
            instanceStatus: 'disconnected'
          }))
        }
      } else {
        showError(data.error || 'Erro ao excluir instância')
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      showError('Erro ao excluir instância')
    } finally {
      setLoading(false)
      setIsDeleting(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const checkInstanceStatus = async (instanceName: string) => {
    if (!currentUser?.id) return
    if (!checkingConnection) return
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) return

    try {
      const response = await fetch('/api/evolution/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: evolutionConfig.apiUrl,
          globalApiKey: evolutionConfig.globalApiKey,
          instanceName,
          userId: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setWhatsappStatus(prev => ({
          ...prev,
          connected: data.data.connected,
          phoneNumber: data.data.phoneNumber,
          lastSeen: data.data.lastSeen,
          instanceName: data.data.instanceName,
          instanceStatus: data.data.status,
          profile: data.data.profile || prev.profile
        }))
        
        setInstances(prev => prev.map(instance => 
          instance.instanceName === data.data.instanceName 
            ? {
                ...instance,
                connectionStatus: data.data.status,
                phoneNumber: data.data.phoneNumber,
                lastSeen: data.data.lastSeen
              }
            : instance
        ))
        
        if (data.data.connected) {
          setCheckingConnection(false)
          setQrCodeCountdown(0)
          setQrCodeModal(false)
          
          if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval)
            setConnectionCheckInterval(null)
          }
          if (qrCodeTimer) {
            clearTimeout(qrCodeTimer)
            setQrCodeTimer(null)
          }
          
          stopConnectionCheck()
          
          showSuccessModal(
            'WhatsApp conectado!',
            'O WhatsApp foi conectado com sucesso à instância.'
          )
          setTimeout(() => {
            loadInstances()
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const startConnectionCheck = (instanceName: string) => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
    }
    if (qrCodeTimer) {
      clearTimeout(qrCodeTimer)
    }
    
    setCheckingConnection(true)
    
    const interval = setInterval(() => {
      checkInstanceStatus(instanceName)
    }, 30000)
    
    setConnectionCheckInterval(interval as NodeJS.Timeout)
    
    setQrCodeCountdown(25)
    const qrTimer = setTimeout(() => {
      if (checkingConnection) {
        handleConnectInstance(instanceName)
      }
    }, 25000)
    
    setQrCodeTimer(qrTimer as NodeJS.Timeout)
    
    const countdownInterval = setInterval(() => {
      setQrCodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    setTimeout(() => {
      stopConnectionCheck()
      toast('Tempo limite de verificação atingido. Tente gerar um novo QR Code.')
    }, 300000)
  }

  const stopConnectionCheck = () => {
    setCheckingConnection(false)
    setQrCodeCountdown(0)
    
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
      setConnectionCheckInterval(null)
    }
    
    if (qrCodeTimer) {
      clearTimeout(qrCodeTimer)
      setQrCodeTimer(null)
    }
    
    setQrCodeModal(false)
    setCheckingConnection(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evolution API"
        subtitle="Configure e gerencie suas instâncias da Evolution API"
        icon={<ServerIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
      />

      <LoadingOverlay {...loadingOverlay} />
      <SuccessModal 
        {...successModal}
        onClose={() => setSuccessModal(prev => ({ ...prev, open: false }))}
      />

      {/* Configuração da Evolution API */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
            <ServerIcon className="h-5 w-5 mr-2" />
            Configuração da Evolution API
          </h3>
          <button
            onClick={saveUserConfig}
            disabled={!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey}
            className="btn btn-primary btn-sm"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Salvar Configurações
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              URL da Evolution API
            </label>
            <input
              type="url"
              value={evolutionConfig.apiUrl}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              placeholder="https://sua-evolution-api.com"
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              API KEY GLOBAL
            </label>
            <input
              type="password"
              value={evolutionConfig.globalApiKey}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, globalApiKey: e.target.value }))}
              placeholder="Sua API KEY GLOBAL da Evolution"
              className="input w-full"
            />
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              Chave global para autenticação na Evolution API
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Webhook URL (opcional)
            </label>
            <input
              type="url"
              value={evolutionConfig.webhookUrl}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://sua-api.com/webhook"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Gerenciamento de Instâncias */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2" />
            Gerenciamento de Instâncias
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={loadInstances}
              disabled={!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey}
              className="btn btn-secondary btn-sm"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Atualizar Lista
            </button>
          </div>
        </div>

        {/* Botões de Criação */}
        <div className="mb-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h4 className="text-md font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
            <ServerIcon className="h-4 w-4 mr-2" />
            Criar Instâncias
          </h4>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCreateInstance}
              disabled={loading || !evolutionConfig.apiUrl || !evolutionConfig.globalApiKey}
              className="btn btn-secondary btn-sm"
            >
              <ServerIcon className="h-4 w-4 mr-2" />
              Criar Instância
            </button>
            <button
              onClick={() => {
                handleCreateInstance()
                setTimeout(() => handleCreateInstance(), 1000)
                setTimeout(() => handleCreateInstance(), 2000)
              }}
              disabled={loading || !evolutionConfig.apiUrl || !evolutionConfig.globalApiKey}
              className="btn btn-primary btn-sm"
            >
              <ServerIcon className="h-4 w-4 mr-2" />
              Criar 3 Instâncias
            </button>
          </div>
        </div>

        {/* Lista de Instâncias */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
            <ServerIcon className="h-4 w-4 mr-2" />
            Instâncias Criadas
          </h4>
          
          {/* Resumo de Instâncias */}
          {instances.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-secondary-100">{instances.length}</div>
                    <div className="text-sm text-gray-600 dark:text-secondary-400">Total</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-secondary-400">Conectadas</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {instances.filter(instance => instance.connectionStatus === 'disconnected').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-secondary-400">Desconectadas</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length === instances.length 
                      ? 'text-green-600 dark:text-green-400' 
                      : instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length > 0 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length === instances.length 
                      ? '✅ Todas Conectadas' 
                      : instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length > 0 
                        ? '⚠️ Parcialmente Conectadas' 
                        : '❌ Todas Desconectadas'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-secondary-400">
                    {instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length > 0 
                      ? `${Math.round((instances.filter(instance => instance.connectionStatus === 'connected' || instance.connectionStatus === 'open').length / instances.length) * 100)}% operacionais`
                      : 'Nenhuma instância operacional'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance, index) => (
                <div key={index} className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
                  <div className="bg-green-600 px-4 py-3 flex items-center">
                    <h3 className="text-white font-semibold text-lg">Perfil da Instância</h3>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center overflow-hidden">
                          {instance.profile?.userAvatar ? (
                            <img 
                              src={instance.profile.userAvatar} 
                              alt="Avatar do usuário" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-secondary-500" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-secondary-100">{instance.profile?.userName || instance.instanceName}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          instance.connectionStatus === 'connected' || instance.connectionStatus === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          instance.connectionStatus === 'connecting' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 
                          'bg-gray-100 dark:bg-secondary-700 text-gray-800 dark:text-secondary-300'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            instance.connectionStatus === 'connected' || instance.connectionStatus === 'open' ? 'bg-green-500' :
                            instance.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                          }`}></div>
                          {instance.connectionStatus === 'connected' || instance.connectionStatus === 'open' ? 'Conectado' : 
                           instance.connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {instance.profile?.userName && (
                        <div className="flex items-center py-3 border-b border-gray-100 dark:border-secondary-700">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center mr-3">
                            <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-secondary-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-secondary-100">Nome</p>
                            <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{instance.profile.userName}</p>
                          </div>
                        </div>
                      )}

                      {(instance.phoneNumber || instance.profile?.userPhone) && (
                        <div className="flex items-center py-3 border-b border-gray-100 dark:border-secondary-700">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center mr-3">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600 dark:text-secondary-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-secondary-100">Telefone</p>
                            <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1 font-mono">{instance.phoneNumber || instance.profile?.userPhone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center py-3 border-b border-gray-100 dark:border-secondary-700">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center mr-3">
                          <ComputerDesktopIcon className="h-5 w-5 text-gray-600 dark:text-secondary-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-secondary-100">Instância</p>
                          <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{instance.instanceName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {(instance.connectionStatus === 'open' || instance.connectionStatus === 'connected') ? (
                        <button
                          onClick={() => handleDisconnectInstance(instance.instanceName)}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Desconectar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectInstance(instance.instanceName)}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                          Conectar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteInstance(instance.instanceName)}
                        disabled={loading || isDeleting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
              <ServerIcon className="h-12 w-12 mx-auto mb-4 text-secondary-300 dark:text-secondary-600" />
              <p>Nenhuma instância criada</p>
              <p className="text-sm">Configure a API e crie sua primeira instância</p>
            </div>
          )}
        </div>

        {/* Status da Conexão Atual */}
        {selectedInstance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${whatsappStatus.connected ? 'bg-success-500' : 'bg-error-500'}`} />
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                <strong>Instância:</strong> {selectedInstance}
              </div>
              
              {whatsappStatus.profile && whatsappStatus.connected && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3 mb-3">
                    {whatsappStatus.profile.userAvatar ? (
                      <img 
                        src={whatsappStatus.profile.userAvatar} 
                        alt="Avatar do usuário" 
                        className="w-12 h-12 rounded-full border-2 border-blue-300 dark:border-blue-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-200">
                        {whatsappStatus.profile.userName || 'Nome não disponível'}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {whatsappStatus.profile.userPhone || whatsappStatus.phoneNumber || 'Telefone não disponível'}
                      </div>
                    </div>
                  </div>
                  
                  {whatsappStatus.profile.userStatus && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>Status:</strong> {whatsappStatus.profile.userStatus}
                    </div>
                  )}
                </div>
              )}
              
              {whatsappStatus.phoneNumber && (
                <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                  <strong>Número:</strong> {whatsappStatus.phoneNumber}
                </div>
              )}
              
              {whatsappStatus.lastSeen && (
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  <strong>Última conexão:</strong> {new Date(whatsappStatus.lastSeen).toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            {whatsappStatus.qrCode && !whatsappStatus.connected && (
              <div className="text-center">
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                <img 
                  src={whatsappStatus.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="mx-auto w-48 h-48 border border-secondary-200 dark:border-secondary-700 rounded-lg"
                />
                {checkingConnection && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">Verificando conexão...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monitor de Instâncias */}
      {currentUser?.id && (
        <div className="card p-6">
          <InstanceMonitor 
            userId={currentUser.id}
            onStatusChange={(status) => {
              const updatedInstances = instances.map(instance => {
                const statusInstance = status.find(s => s.instanceName === instance.instanceName)
                if (statusInstance) {
                  return {
                    ...instance,
                    connectionStatus: statusInstance.connectionStatus,
                    phoneNumber: statusInstance.phoneNumber,
                    lastSeen: statusInstance.lastSeen,
                    profileName: statusInstance.profileName
                  }
                }
                return instance
              })
              setInstances(updatedInstances)
            }}
          />
        </div>
      )}

      {/* Modal do QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Conectar WhatsApp
              </h3>
              <button
                onClick={() => {
                  setQrCodeModal(false)
                  stopConnectionCheck()
                }}
                className="text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                1. Abra o WhatsApp no seu celular<br/>
                2. Toque em Menu ou Configurações<br/>
                3. Toque em "Dispositivos conectados"<br/>
                4. Toque em "Conectar um dispositivo"<br/>
                5. Escaneie o QR Code abaixo
              </p>
              
              {whatsappStatus.qrCode && (
                <div className="bg-white dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 inline-block">
                  <img 
                    src={whatsappStatus.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
              )}
              
              <div className="mt-4 flex space-x-2 justify-center">
                <button
                  onClick={() => {
                    stopConnectionCheck()
                    setQrCodeModal(false)
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    if (selectedInstance && checkingConnection) {
                      checkInstanceStatus(selectedInstance)
                    }
                  }}
                  className="btn btn-warning btn-sm"
                  disabled={!checkingConnection}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Verificar Agora
                </button>
                <button
                  onClick={() => {
                    setQrCodeModal(false)
                    stopConnectionCheck()
                    loadInstances()
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Atualizar Lista
                </button>
              </div>
              
              {checkingConnection && (
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">Verificando conexão automaticamente...</span>
                  </div>
                  {qrCodeCountdown > 0 && (
                    <div className="mt-3 p-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
                      <p className="text-xs text-warning-700 dark:text-warning-300">
                        Novo QR code será gerado automaticamente em {qrCodeCountdown} segundos
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => {
          if (confirmModal.resolveRef) {
            confirmModal.resolveRef(false)
          }
          setConfirmModal({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, resolveRef: null })
        }}
      />
    </div>
  )
}

