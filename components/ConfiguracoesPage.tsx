'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  CogIcon,
  WifiIcon,
  QrCodeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  DocumentTextIcon,
  LinkIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CloudIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  TrashIcon,
  UserCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import LoadingOverlay from './LoadingOverlay'
import SuccessModal from './SuccessModal'
import InstanceMonitor from './InstanceMonitorBackground'
import WahaServersManager from './WahaServersManager'
import { useAuth } from '@/lib/hooks/useAuth'
import PageHeader from './PageHeader'

export default function ConfiguracoesPage() {
  const { user: currentUser } = useAuth()
  
  console.log('🔄 [ConfiguracoesPage] Componente renderizado - currentUser:', currentUser)
  
  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    phoneNumber: null,
    lastSeen: null,
    qrCode: null,
    instanceName: '',
    instanceStatus: 'disconnected',
    profile: {
      userName: null,
      userPhone: null,
      userAvatar: null,
      userStatus: null
    }
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
    message: 'Operacao realizada com sucesso.',
    onAutoClose: undefined as (() => void) | undefined,
    autoCloseDelay: 5000
  })

  // Função auxiliar para mostrar modal de sucesso
  const showSuccessModal = (title: string, message: string, onAutoClose?: () => void, autoCloseDelay?: number) => {
    setSuccessModal({
      open: true,
      title,
      message,
      onAutoClose,
      autoCloseDelay: autoCloseDelay || 5000
    })
  }
  const [evolutionConfig, setEvolutionConfig] = useState({
    apiUrl: '',
    globalApiKey: '',
    webhookUrl: ''
  })
  
  // Estados para configurações do WAHA (múltiplos servidores)
  const [wahaServers, setWahaServers] = useState<Array<{
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
  }>>([])
  
  const [editingWahaServer, setEditingWahaServer] = useState<{
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
  } | null>(null)
  
  const [showWahaModal, setShowWahaModal] = useState(false)
  
  const [wahaStatus, setWahaStatus] = useState({
    connected: false,
    lastTest: null as string | null,
    responseTime: null as number | null,
    errors: 0,
    instances: 0,
    activeConnections: 0
  })
  const [qrCodeModal, setQrCodeModal] = useState(false)
  const [instances, setInstances] = useState<any[]>([])
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [connectionCheckInterval, setConnectionCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [qrCodeTimer, setQrCodeTimer] = useState<NodeJS.Timeout | null>(null)
  const [qrCodeCountdown, setQrCodeCountdown] = useState<number>(0)
  const [instanceMonitorEnabled, setInstanceMonitorEnabled] = useState(false)
  // Confirmacao bonita (modal)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'warning' as 'warning' | 'danger'
  })
  const confirmResolveRef = useRef<null | ((v: boolean) => void)>(null)

  // Debug: monitorar mudanças no confirmDialog
  useEffect(() => {
    console.log('[useEffect] confirmDialog state changed:', confirmDialog)
    if (confirmDialog.open) {
      console.log('[useEffect] Modal should be visible now!')
    }
  }, [confirmDialog])

  const openConfirm = (opts: { title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'warning' | 'danger' }) => {
    console.log('[openConfirm] opening', opts.title)
    console.log('[openConfirm] current confirmDialog state:', confirmDialog)
    try { toast.dismiss() } catch {}
    
    const newDialogState = {
      open: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      variant: opts.variant || 'warning'
    }
    
    console.log('[openConfirm] setting new dialog state:', newDialogState)
    setConfirmDialog(newDialogState)
    
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve
      console.log('[openConfirm] promise created, waiting for user response')
    })
  }
  
  // Estados para configuracoes de API
  const [apiConfig, setApiConfig] = useState({
    webhookUrl: '',
    webhookSecret: '',
    apiKey: '',
    baseUrl: '',
    timeout: 30,
    retryAttempts: 3,
    rateLimit: 100
  })
  
  const [webhookStatus, setWebhookStatus] = useState({
    connected: false,
    lastTest: null as string | null,
    responseTime: null as number | null,
    errors: 0
  })
  
  const [errorHandling, setErrorHandling] = useState({
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 5000,
    notifyOnError: true,
    logErrors: true
  })

  useEffect(() => {
    fetchWhatsAppStatus()
  }, [])

  // Carregar configuracoes e instancias quando o componente montar
  useEffect(() => {
    console.log('🔄 [ConfiguracoesPage] useEffect executado - currentUser:', currentUser)
    
    if (!currentUser?.id) {
      console.log('⚠️ [ConfiguracoesPage] Usuário não autenticado, pulando carregamento inicial')
      return
    }
    
    const loadInitialData = async () => {
      console.log('🔄 [ConfiguracoesPage] Iniciando carregamento de dados iniciais...')
      
      setLoadingOverlay({
        open: true,
        title: 'Carregando página...',
        message: 'Estamos carregando suas configurações e instâncias. Aguarde.'
      })
      
      try {
        console.log('🔍 [ConfiguracoesPage] Carregando configurações do usuário...')
        await loadUserConfig()
        
        console.log('🔍 [ConfiguracoesPage] Configurações carregadas, verificando se pode carregar instâncias...')
        console.log('📊 [ConfiguracoesPage] evolutionConfig:', evolutionConfig)
        
        if (evolutionConfig.apiUrl && evolutionConfig.globalApiKey) {
          console.log('🔍 [ConfiguracoesPage] Carregando instâncias...')
          await loadInstances()
          console.log('✅ [ConfiguracoesPage] Instâncias carregadas')
        } else {
          console.log('⚠️ [ConfiguracoesPage] API URL ou chave não configuradas, pulando carregamento de instâncias')
        }
        
        console.log('✅ [ConfiguracoesPage] Carregamento de dados iniciais concluído')
      } catch (error) {
        console.error('❌ [ConfiguracoesPage] Erro ao carregar dados iniciais:', error)
      } finally {
        console.log('🔄 [ConfiguracoesPage] Fechando overlay de carregamento')
        setLoadingOverlay(prev => ({ ...prev, open: false }))
      }
    }
    
    loadInitialData()
  }, [currentUser?.id])

  // Carregar instancias quando a API for configurada
  useEffect(() => {
    if (evolutionConfig.apiUrl && evolutionConfig.globalApiKey) {
      loadInstances()
    }
  }, [evolutionConfig.apiUrl, evolutionConfig.globalApiKey])

  // Limpar intervalos ao desmontar o componente
  useEffect(() => {
    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
    }
  }, [connectionCheckInterval])

  const fetchWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()
      if (data.success) {
        setWhatsappStatus(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar status do WhatsApp:', error)
    }
  }

  // Carregar configuracoes salvas do usuario
  const loadUserConfig = async () => {
    if (!currentUser?.id) {
      console.log('⚠️ [ConfiguracoesPage] Usuário não autenticado, pulando carregamento de configurações')
      return
    }
    
    console.log(`🔍 [ConfiguracoesPage] Carregando configurações para usuário: ${currentUser.id}`)
    
    try {
      const response = await fetch(`/api/evolution/save-config?userId=${encodeURIComponent(currentUser.id)}`)
      console.log(`📡 [ConfiguracoesPage] Response status: ${response.status}`)
      
      const data = await response.json()
      console.log(`📊 [ConfiguracoesPage] Response data:`, data)
      
      if (data.success && data.data) {
        console.log('✅ [ConfiguracoesPage] Configurações carregadas:', data.data)
        setEvolutionConfig(prev => ({
          ...prev,
          apiUrl: data.data.api_url || '',
          globalApiKey: data.data.global_api_key || '',
          webhookUrl: data.data.webhook_url || ''
        }))
        showSuccessModal(
          'Configurações carregadas!',
          'Suas configurações foram carregadas com sucesso.',
          undefined,
          3000
        )
      }
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error)
    }
  }

  // Salvar configuracoes do usuario
  const saveUserConfig = async () => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      toast.error('Preencha todos os campos obrigatórios')
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
        toast.error(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleReconnect = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/connect', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Tentativa de reconexão iniciada')
        setTimeout(fetchWhatsAppStatus, 2000)
      } else {
        toast.error('Erro ao reconectar')
      }
    } catch (error) {
      toast.error('Erro ao reconectar WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  // Funções para Evolution API
  const handleCreateInstance = async () => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      toast.error('Preencha todos os campos obrigatórios')
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
            instanceName: '', // Nome será gerado automaticamente
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
        
        // Salvar instância no Supabase
        try {
          await fetch('/api/evolution/save-instance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              instanceName: data.data.instanceName,
              connectionStatus: 'disconnected'
            })
          })
          
          // Atualizar lista após salvar no Supabase
          console.log('Instância salva no Supabase, atualizando lista...')
          await loadInstances()
        } catch (error) {
          console.error('Erro ao salvar instância no Supabase:', error)
        }
      } else {
        toast.error(data.error || 'Erro ao criar instância')
      }
    } catch (error) {
      toast.error('Erro ao criar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleConnectInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    if (!instanceName || !evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      toast.error('Selecione uma instância e configure a API')
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
          
          // Mostrar modal de sucesso primeiro
          showSuccessModal(
            'QR Code gerado!',
            'O QR Code foi gerado com sucesso. Escaneie com seu WhatsApp para conectar.'
          )
          
          // Fechar modal de sucesso e abrir QR code após 3 segundos
          setTimeout(() => {
            setSuccessModal(prev => ({ ...prev, open: false }))
            setQrCodeModal(true)
            // Iniciar verificação automática de conexão
            startConnectionCheck(instanceName)
          }, 3000)
        } else {
          showSuccessModal(
            'Conectado!',
            'A instância foi conectada com sucesso ao WhatsApp.'
          )
          fetchWhatsAppStatus()
        }
      } else {
        toast.error(data.error || 'Erro ao conectar instância')
      }
    } catch (error) {
      toast.error('Erro ao conectar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const handleDisconnectInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    if (!instanceName) {
      toast.error('Selecione uma instância')
      return
    }

    // Confirmação com modal visual
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
        loadInstances() // Atualizar lista
      } else {
        toast.error(data.error || 'Erro ao desconectar instância')
      }
    } catch (error) {
      toast.error('Erro ao desconectar instância')
    } finally {
      setLoading(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  // Funções para gerenciar instâncias
  const loadInstances = useCallback(async () => {
    if (!currentUser?.id) {
      console.log('⚠️ [ConfiguracoesPage] Usuário não autenticado, pulando carregamento de instâncias')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      console.log('⚠️ [ConfiguracoesPage] Configuração da API não encontrada')
      return
    }

    console.log('🔍 [ConfiguracoesPage] Carregando instâncias para usuário:', currentUser.id)
    console.log('🔍 [ConfiguracoesPage] API URL:', evolutionConfig.apiUrl)

    try {
      const response = await fetch(`/api/evolution/instances?apiUrl=${encodeURIComponent(evolutionConfig.apiUrl)}&globalApiKey=${encodeURIComponent(evolutionConfig.globalApiKey)}&userId=${encodeURIComponent(currentUser.id)}`)
      console.log(`📡 [ConfiguracoesPage] Instances response status: ${response.status}`)
      
      const data = await response.json()
      console.log('📊 [ConfiguracoesPage] Resposta da API de instâncias:', data)
      
      if (data.success) {
        console.log('Instâncias carregadas:', data.data)
        console.log('Número de instâncias:', data.data?.length || 0)
        
        // Debug: verificar se os dados do perfil estão presentes
        data.data?.forEach((instance: any, index: number) => {
          console.log(`=== INSTÂNCIA ${index + 1} ===`)
          console.log('Nome da instância:', instance.instanceName)
          console.log('Status da conexão:', instance.connectionStatus)
          console.log('Número do telefone:', instance.phoneNumber)
          console.log('Dados do perfil:', instance.profile)
          console.log('Nome do usuário:', instance.profile?.userName)
          console.log('Telefone do usuário:', instance.profile?.userPhone)
          console.log('Avatar do usuário:', instance.profile?.userAvatar)
          console.log('Status do usuário:', instance.profile?.userStatus)
          console.log('========================')
        })
        
        setInstances(data.data || [])
        console.log('Estado de instâncias atualizado:', data.data || [])
      } else {
        console.error('Erro ao carregar instâncias:', data.error || 'Erro desconhecido')
        toast.error(data.error || 'Erro ao carregar instâncias')
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
      toast.error('Erro ao carregar instâncias')
    }
  }, [currentUser?.id, evolutionConfig.apiUrl, evolutionConfig.globalApiKey])

  const handleDeleteInstance = async (instanceName: string) => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    console.log('Iniciando exclusão da instância:', instanceName)
    
    if (isDeleting) {
      console.log('Exclusão já em andamento, ignorando...')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      toast.error('Configure a API primeiro')
      return
    }
    
    setIsDeleting(true)

    // Confirmação com modal visual
    console.log('Abrindo modal de confirmação...')
    try {
      const confirmDelete = await openConfirm({
        title: 'Excluir instancia',
        message: `Tem certeza que deseja excluir a instancia "${instanceName}"? Esta acao nao pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'danger'
      })
      
      console.log('Resultado da confirmação:', confirmDelete)
      if (!confirmDelete) {
        toast('Acao cancelada')
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
      title: 'Excluindo instancia...',
      message: `Estamos excluindo a instancia "${instanceName}". Aguarde.`
    })
    
    console.log('Enviando requisição de exclusão...')
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
      
      console.log('Resposta da API:', response.status)
      const data = await response.json()
      console.log('Dados da resposta:', data)
      
      if (data.success) {
        console.log('Exclusão bem-sucedida')
        showSuccessModal(
          'Instancia excluida!',
          'A instancia foi excluida com sucesso.',
          () => {
            console.log('Modal de sucesso fechado, atualizando lista de instâncias...')
            loadInstances()
          }
        )
        
        // Atualizar status do WhatsApp se necessário
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
        console.error('Erro na exclusão:', data.error)
        toast.error(data.error || 'Erro ao excluir instancia')
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      toast.error('Erro ao excluir instancia')
    } finally {
      setLoading(false)
      setIsDeleting(false)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
    }
  }

  const checkInstanceStatus = async (instanceName: string) => {
    if (!currentUser?.id) {
      console.log('Usuário não autenticado, pulando verificação de status')
      return
    }
    
    // Se não está verificando conexão, não fazer verificação automática
    if (!checkingConnection) {
      console.log('Verificação de conexão não ativa, pulando verificação de status')
      return
    }
    
    if (!evolutionConfig.apiUrl || !evolutionConfig.globalApiKey) {
      console.log('Configuração da API não encontrada para verificação')
      return
    }

    console.log('Verificando status da instância:', instanceName)
    
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
      console.log('Resposta da verificação de status:', data)
      
      if (data.success) {
        console.log('Status da instância:', {
          connected: data.data.connected,
          status: data.data.status,
          phoneNumber: data.data.phoneNumber
        })
        
        setWhatsappStatus(prev => ({
          ...prev,
          connected: data.data.connected,
          phoneNumber: data.data.phoneNumber,
          lastSeen: data.data.lastSeen,
          instanceName: data.data.instanceName,
          instanceStatus: data.data.status,
          profile: data.data.profile || prev.profile
        }))
        
        // Atualizar a lista de instâncias com o novo status
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
        
        // Se conectou, parar verificação e fechar modal
        if (data.data.connected) {
          console.log('Instância conectada! Parando TODA verificação...')
          
          // Parar verificação IMEDIATAMENTE
          setCheckingConnection(false)
          setQrCodeCountdown(0)
          setQrCodeModal(false)
          
          // Limpar todos os intervalos e timers IMEDIATAMENTE
          if (connectionCheckInterval) {
            console.log('Limpando connectionCheckInterval:', connectionCheckInterval)
            clearInterval(connectionCheckInterval)
            setConnectionCheckInterval(null)
          }
          if (qrCodeTimer) {
            console.log('Limpando qrCodeTimer:', qrCodeTimer)
            clearTimeout(qrCodeTimer)
            setQrCodeTimer(null)
          }
          
          // Parar verificação completamente
          stopConnectionCheck()
          
          showSuccessModal(
            'WhatsApp conectado!',
            'O WhatsApp foi conectado com sucesso à instância.'
          )
          // Atualizar lista de instâncias após o modal fechar
          setTimeout(() => {
            loadInstances()
          }, 5000) // Aguardar o modal fechar
        } else {
          console.log('Instância ainda não conectada. Status:', data.data.status)
        }
      } else {
        console.error('Erro na verificação de status:', data.error)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const startConnectionCheck = (instanceName: string) => {
    // Limpar intervalos anteriores antes de criar novos
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
    }
    if (qrCodeTimer) {
      clearTimeout(qrCodeTimer)
    }
    
    setCheckingConnection(true)
    console.log('Iniciando verificação automática para:', instanceName)
    
    const interval = setInterval(() => {
      checkInstanceStatus(instanceName)
    }, 30000) // Verificar a cada 30 segundos
    
    setConnectionCheckInterval(interval as NodeJS.Timeout)
    
    // Timer de 25 segundos para gerar novo QR code
    setQrCodeCountdown(25)
    const qrTimer = setTimeout(() => {
      // Só gerar novo QR code se ainda estiver verificando conexão
      if (checkingConnection) {
        console.log('Timer de 25 segundos atingido. Gerando novo QR code...')
        handleConnectInstance(instanceName) // Gerar novo QR code
      } else {
        console.log('Verificação de conexão parada, não gerando novo QR code')
      }
    }, 25000) // 25 segundos
    
    setQrCodeTimer(qrTimer as NodeJS.Timeout)
    
    // Contador visual
    const countdownInterval = setInterval(() => {
      setQrCodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Timeout de 5 minutos para parar a verificação
    setTimeout(() => {
      console.log('Timeout de verificação atingido. Parando verificação...')
      stopConnectionCheck()
      toast('Tempo limite de verificação atingido. Tente gerar um novo QR Code.')
    }, 300000) // 5 minutos
  }

  const stopConnectionCheck = () => {
    console.log('Parando verificação de conexão...')
    
    // Parar verificação
    setCheckingConnection(false)
    setQrCodeCountdown(0)
    
    // Limpar intervalos
    if (connectionCheckInterval) {
      console.log('Limpando connectionCheckInterval em stopConnectionCheck:', connectionCheckInterval)
      clearInterval(connectionCheckInterval)
      setConnectionCheckInterval(null)
    }
    
    // Limpar timers
    if (qrCodeTimer) {
      console.log('Limpando qrCodeTimer em stopConnectionCheck:', qrCodeTimer)
      clearTimeout(qrCodeTimer)
      setQrCodeTimer(null)
    }
    
    // Fechar modal de QR Code se estiver aberto
    setQrCodeModal(false)
    
    // Limpar estado de verificação completamente
    setCheckingConnection(false)
    
    console.log('Verificação de conexão parada completamente')
  }

  const handleTestWebhook = async () => {
    if (!apiConfig.webhookUrl) {
      toast.error('URL do webhook é obrigatória')
      return
    }

    setLoading(true)
    try {
      const startTime = Date.now()
      const response = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: apiConfig.webhookUrl })
      })
      
      const responseTime = Date.now() - startTime
      const data = await response.json()
      
      if (data.success) {
        setWebhookStatus({
          connected: true,
          lastTest: new Date().toISOString(),
          responseTime: responseTime,
          errors: 0
        })
        showSuccessModal(
          'Webhook testado!',
          `O webhook foi testado com sucesso! Tempo de resposta: ${responseTime}ms`
        )
      } else {
        setWebhookStatus(prev => ({ ...prev, errors: prev.errors + 1 }))
        toast.error('Falha no teste do webhook')
      }
    } catch (error) {
      setWebhookStatus(prev => ({ ...prev, errors: prev.errors + 1 }))
      toast.error('Erro ao testar webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig)
      })
      
      if (response.ok) {
        showSuccessModal(
          'Configurações salvas!',
          'As configurações de API foram salvas com sucesso.'
        )
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações de API')
    } finally {
      setLoading(false)
    }
  }

  // Funções para gerenciar configurações do WAHA (múltiplos servidores)
  
  // Carregar lista de servidores WAHA
  const loadWahaServers = async () => {
    if (!currentUser) return
    
    try {
      const response = await fetch('/api/config/waha/list')
      if (response.ok) {
        const data = await response.json()
        setWahaServers(data.servers || [])
      }
    } catch (error) {
      console.error('Erro ao carregar servidores WAHA:', error)
    }
  }

  // Abrir modal para adicionar novo servidor
  const handleAddWahaServer = () => {
    setEditingWahaServer({
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
    setShowWahaModal(true)
  }

  // Abrir modal para editar servidor existente
  const handleEditWahaServer = (server: typeof wahaServers[0]) => {
    setEditingWahaServer({
      id: server.id,
      name: server.name,
      apiUrl: server.apiUrl,
      apiKey: server.apiKey,
      webhookUrl: server.webhookUrl,
      webhookSecret: server.webhookSecret,
      timeout: server.timeout,
      retryAttempts: server.retryAttempts,
      rateLimit: server.rateLimit,
      enableAutoReconnect: server.enableAutoReconnect,
      enableQrCode: server.enableQrCode,
      enablePresence: server.enablePresence
    })
    setShowWahaModal(true)
  }

  // Salvar servidor WAHA (criar ou atualizar)
  const handleSaveWahaServer = async () => {
    if (!editingWahaServer || !currentUser?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    
    if (!editingWahaServer.name || !editingWahaServer.apiUrl) {
      toast.error('Nome e URL são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/config/waha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingWahaServer,
          user_id: currentUser.id
        })
      })
      
      if (response.ok) {
        showSuccessModal(
          'Servidor WAHA salvo!',
          `O servidor "${editingWahaServer.name}" foi salvo com sucesso.`
        )
        setShowWahaModal(false)
        setEditingWahaServer(null)
        await loadWahaServers()
      } else {
        toast.error('Erro ao salvar servidor WAHA')
      }
    } catch (error) {
      toast.error('Erro ao salvar servidor WAHA')
    } finally {
      setLoading(false)
    }
  }

  // Excluir servidor WAHA
  const handleDeleteWahaServer = async (serverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor WAHA?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/config/waha?id=${serverId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Servidor WAHA excluído com sucesso')
        await loadWahaServers()
      } else {
        toast.error('Erro ao excluir servidor WAHA')
      }
    } catch (error) {
      toast.error('Erro ao excluir servidor WAHA')
    } finally {
      setLoading(false)
    }
  }

  // Testar conexão com servidor WAHA específico
  const handleTestWahaServer = async (serverId: string) => {
    const server = wahaServers.find(s => s.id === serverId)
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
        // Atualizar status do servidor na lista
        setWahaServers(prev => prev.map(s => 
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
        setWahaServers(prev => prev.map(s => 
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
      setWahaServers(prev => prev.map(s => 
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

  // Carregar servidores WAHA ao montar o componente
  useEffect(() => {
    if (currentUser) {
      loadWahaServers()
    }
  }, [currentUser])

  // Verificar se usuário está autenticado
  // if (!currentUser) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Carregando usuário...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6 relative">
      <LoadingOverlay 
        open={loadingOverlay.open}
        title={loadingOverlay.title}
        message={loadingOverlay.message}
      />
      <SuccessModal 
        open={successModal.open}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal(prev => ({ ...prev, open: false }))}
        onAutoClose={successModal.onAutoClose}
        autoCloseDelay={successModal.autoCloseDelay}
      />
      {/* Header padronizado */}
      <PageHeader
        title="Configurações"
        subtitle="Gerencie as configurações da sua plataforma"
        icon={<CogIcon className="h-6 w-6" />}
      />

      {/* Informações do Usuário */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Informações do Usuário
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ID do Usuário
            </label>
            <input
              type="text"
              value={currentUser?.id || 'Não autenticado'}
              disabled
              className="input w-full bg-secondary-100"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Identificador único para suas instâncias
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Nome do Usuário
            </label>
            <input
              type="text"
              value={currentUser?.name || 'Não autenticado'}
              disabled
              className="input w-full bg-secondary-100"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Nome do usuário logado
            </p>
          </div>
        </div>
      </div>

      {/* Configuração da Evolution API */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 flex items-center">
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
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              API KEY GLOBAL
            </label>
            <input
              type="password"
              value={evolutionConfig.globalApiKey}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, globalApiKey: e.target.value }))}
              placeholder="Sua API KEY GLOBAL da Evolution"
              className="input w-full"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Chave global para autenticação na Evolution API
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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

      {/* Configuração do WAHA - Múltiplos Servidores */}
      <WahaServersManager userId={currentUser?.id || ''} />

      {/* Gerenciamento de Instâncias */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 flex items-center">
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
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <h4 className="text-md font-medium text-secondary-900 mb-4 flex items-center">
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
          <h4 className="text-md font-medium text-secondary-900 mb-4 flex items-center">
            <ServerIcon className="h-4 w-4 mr-2" />
            Instâncias Criadas
          </h4>
          
          {/* Resumo de Instâncias */}
          {instances.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Total */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{instances.length}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  
                  {/* Conectadas */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {instances.filter(instance => instance.connectionStatus === 'connected').length}
                    </div>
                    <div className="text-sm text-gray-600">Conectadas</div>
                  </div>
                  
                  {/* Desconectadas */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {instances.filter(instance => instance.connectionStatus === 'disconnected').length}
                    </div>
                    <div className="text-sm text-gray-600">Desconectadas</div>
                  </div>
                </div>
                
                {/* Status Geral */}
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    instances.filter(instance => instance.connectionStatus === 'connected').length === instances.length 
                      ? 'text-green-600' 
                      : instances.filter(instance => instance.connectionStatus === 'connected').length > 0 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {instances.filter(instance => instance.connectionStatus === 'connected').length === instances.length 
                      ? '✅ Todas Conectadas' 
                      : instances.filter(instance => instance.connectionStatus === 'connected').length > 0 
                        ? '⚠️ Parcialmente Conectadas' 
                        : '❌ Todas Desconectadas'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {instances.filter(instance => instance.connectionStatus === 'connected').length > 0 
                      ? `${Math.round((instances.filter(instance => instance.connectionStatus === 'connected').length / instances.length) * 100)}% operacionais`
                      : 'Nenhuma instância operacional'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header verde do WhatsApp */}
                  <div className="bg-green-600 px-4 py-3 flex items-center">
                    <button className="text-white mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-white font-semibold text-lg">Perfil da Instância</h3>
                  </div>

                  {/* Conteúdo principal */}
                  <div className="p-4">
                    {/* Avatar e status */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {instance.profile?.userAvatar ? (
                            <img 
                              src={instance.profile.userAvatar} 
                              alt="Avatar do usuário" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-16 w-16 text-gray-400" />
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
                        <h4 className="text-lg font-semibold text-gray-900">{instance.profile?.userName || instance.instanceName}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          instance.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                          instance.connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            instance.connectionStatus === 'connected' ? 'bg-green-500' :
                            instance.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                          }`}></div>
                          {instance.connectionStatus === 'connected' ? 'Conectado' : 
                           instance.connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                        </div>
                      </div>
                    </div>

                    {/* Seções de informações - estilo WhatsApp */}
                    <div className="space-y-1">
                      {/* Nome do usuário */}
                      {instance.profile?.userName && (
                        <div className="flex items-center py-3 border-b border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <UserCircleIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Nome</p>
                            <p className="text-sm text-gray-600 mt-1">{instance.profile.userName}</p>
                            <p className="text-xs text-gray-500 mt-1">Nome exibido para contatos do WhatsApp</p>
                          </div>
                          <button className="text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Status do usuário */}
                      {instance.profile?.userStatus && (
                        <div className="flex items-center py-3 border-b border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Recado</p>
                            <p className="text-sm text-gray-600 mt-1">{instance.profile.userStatus}</p>
                          </div>
                          <button className="text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Telefone */}
                      {(instance.phoneNumber || instance.profile?.userPhone) && (
                        <div className="flex items-center py-3 border-b border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Telefone</p>
                            <p className="text-sm text-gray-600 mt-1 font-mono">{instance.phoneNumber || instance.profile?.userPhone}</p>
                          </div>
                          <button className="text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Informações da instância */}
                      <div className="flex items-center py-3 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Instância</p>
                          <p className="text-sm text-gray-600 mt-1">{instance.instanceName}</p>
                          <p className="text-xs text-gray-500 mt-1">ID da instância no sistema</p>
                        </div>
                      </div>

                      {/* Timestamps */}
                      {(instance.createdAt || instance.lastSeen) && (
                        <div className="flex items-center py-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <CalendarIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Informações do Sistema</p>
                            <div className="mt-1 space-y-1">
                              {instance.createdAt && (
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Criado:</span> {new Date(instance.createdAt).toLocaleString('pt-BR')}
                                </p>
                              )}
                              {instance.lastSeen && (
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Atualizado:</span> {new Date(instance.lastSeen).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {instance.connectionStatus === 'open' ? (
                        <button
                          onClick={() => handleDisconnectInstance(instance.instanceName)}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Desconectar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectInstance(instance.instanceName)}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                          Conectar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteInstance(instance.instanceName)}
                        disabled={loading || isDeleting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
            <div className="text-center py-8 text-secondary-500">
              <ServerIcon className="h-12 w-12 mx-auto mb-4 text-secondary-300" />
              <p>Nenhuma instância criada</p>
              <p className="text-sm">Configure a API e crie sua primeira instância</p>
            </div>
          )}
        </div>

        {/* Status da Conexão Atual */}
        {selectedInstance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${whatsappStatus.connected ? 'bg-success-500' : 'bg-error-500'}`} />
                <span className="text-sm font-medium text-secondary-900">
                  {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="text-sm text-secondary-600 mb-2">
                <strong>Instância:</strong> {selectedInstance}
              </div>
              
              {/* Informações do Perfil do Usuário */}
              {whatsappStatus.profile && whatsappStatus.connected && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    {whatsappStatus.profile.userAvatar ? (
                      <img 
                        src={whatsappStatus.profile.userAvatar} 
                        alt="Avatar do usuário" 
                        className="w-12 h-12 rounded-full border-2 border-blue-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-blue-900">
                        {whatsappStatus.profile.userName || 'Nome não disponível'}
                      </div>
                      <div className="text-sm text-blue-700">
                        {whatsappStatus.profile.userPhone || whatsappStatus.phoneNumber || 'Telefone não disponível'}
                      </div>
                    </div>
                  </div>
                  
                  {whatsappStatus.profile.userStatus && (
                    <div className="text-sm text-blue-600">
                      <strong>Status:</strong> {whatsappStatus.profile.userStatus}
                    </div>
                  )}
                </div>
              )}
              
              {whatsappStatus.phoneNumber && (
                <div className="text-sm text-secondary-600 mb-2">
                  <strong>Número:</strong> {whatsappStatus.phoneNumber}
                </div>
              )}
              

              {whatsappStatus.lastSeen && (
                <div className="text-sm text-secondary-600">
                  <strong>Última conexão:</strong> {new Date(whatsappStatus.lastSeen).toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            {whatsappStatus.qrCode && !whatsappStatus.connected && (
              <div className="text-center">
                <p className="text-sm text-secondary-600 mb-4">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                <img 
                  src={whatsappStatus.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="mx-auto w-48 h-48 border border-secondary-200 rounded-lg"
                />
                {checkingConnection && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-secondary-600">Verificando conexão...</span>
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
              console.log('Status das instâncias atualizado:', status)
              // Atualizar lista de instâncias se necessário
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

      {/* Configurações de API */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 flex items-center">
            <ServerIcon className="h-5 w-5 mr-2" />
            Configurações de API
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${webhookStatus.connected ? 'bg-success-500' : 'bg-error-500'}`} />
            <span className="text-sm text-secondary-600">
              {webhookStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                URL do Webhook
              </label>
              <input
                type="url"
                value={apiConfig.webhookUrl}
                onChange={(e) => setApiConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://sua-api.com/webhook"
                className="input w-full"
              />
              <p className="text-xs text-secondary-500 mt-1">
                URL para receber notificações de status das mensagens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <KeyIcon className="h-4 w-4 mr-2" />
                Chave Secreta do Webhook
              </label>
              <input
                type="password"
                value={apiConfig.webhookSecret}
                onChange={(e) => setApiConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="Sua chave secreta"
                className="input w-full"
              />
              <p className="text-xs text-secondary-500 mt-1">
                Chave para validar a autenticidade dos webhooks
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <CloudIcon className="h-4 w-4 mr-2" />
                URL Base da API
              </label>
              <input
                type="url"
                value={apiConfig.baseUrl}
                onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.whatsapp.com/v1"
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2" />
                Timeout (segundos)
              </label>
              <input
                type="number"
                value={apiConfig.timeout}
                onChange={(e) => setApiConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                min="5"
                max="300"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Tentativas de Retry
              </label>
              <input
                type="number"
                value={apiConfig.retryAttempts}
                onChange={(e) => setApiConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                min="1"
                max="10"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <ServerIcon className="h-4 w-4 mr-2" />
                Rate Limit (mensagens/hora)
              </label>
              <input
                type="number"
                value={apiConfig.rateLimit}
                onChange={(e) => setApiConfig(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                min="10"
                max="1000"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestWebhook}
              disabled={loading || !apiConfig.webhookUrl}
              className="btn btn-secondary btn-md"
            >
              <WifiIcon className="h-4 w-4 mr-2" />
              {loading ? 'Testando...' : 'Testar Webhook'}
            </button>
            <button
              onClick={handleSaveApiConfig}
              disabled={loading}
              className="btn btn-primary btn-md"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Salvar Configurações
            </button>
          </div>

          {webhookStatus.lastTest && (
            <div className="text-sm text-secondary-600">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Último teste: {new Date(webhookStatus.lastTest).toLocaleString('pt-BR')}
              </div>
              {webhookStatus.responseTime && (
                <div className="flex items-center">
                  <ServerIcon className="h-4 w-4 mr-1" />
                  Tempo de resposta: {webhookStatus.responseTime}ms
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Envio */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Configurações de Envio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Delay entre mensagens (segundos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              defaultValue="2"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 mt-1">
              Tempo de espera entre cada mensagem para evitar spam
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Máximo de mensagens por hora
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              defaultValue="100"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 mt-1">
              Limite de mensagens por hora para evitar bloqueios
            </p>
          </div>
        </div>
      </div>

      {/* Configurações de Recebimento */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Configurações de Recebimento
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900">Receber confirmações de entrega</p>
              <p className="text-sm text-secondary-500">Notificar quando mensagens forem entregues</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900">Receber confirmações de leitura</p>
              <p className="text-sm text-secondary-500">Notificar quando mensagens forem lidas</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900">Receber respostas automáticas</p>
              <p className="text-sm text-secondary-500">Processar respostas dos destinatários</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
          </div>
        </div>
      </div>

      {/* Configurações de Tratamento de Erros */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Tratamento de Erros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Retry automático</p>
                <p className="text-sm text-secondary-500">Tentar reenviar mensagens com erro</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.autoRetry}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, autoRetry: e.target.checked }))}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Máximo de tentativas
              </label>
              <input
                type="number"
                value={errorHandling.maxRetries}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                min="1"
                max="10"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Delay entre tentativas (ms)
              </label>
              <input
                type="number"
                value={errorHandling.retryDelay}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                min="1000"
                max="60000"
                className="input w-full"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Notificar sobre erros</p>
                <p className="text-sm text-secondary-500">Enviar alertas quando houver falhas</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.notifyOnError}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, notifyOnError: e.target.checked }))}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Log de erros</p>
                <p className="text-sm text-secondary-500">Registrar todos os erros no sistema</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.logErrors}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, logErrors: e.target.checked }))}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" 
              />
            </div>
            <div className="bg-error-50 border border-error-200 rounded-md p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-error-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-error-800">Erros nas últimas 24h</p>
                  <p className="text-sm text-error-600">{webhookStatus.errors} falhas detectadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Notificações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Email de notificações</p>
                <p className="text-sm text-secondary-500">Receber notificações por email</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Alertas de erro</p>
                <p className="text-sm text-secondary-500">Notificar sobre falhas de envio</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Relatórios semanais</p>
                <p className="text-sm text-secondary-500">Enviar resumo semanal</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Segurança
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Autenticação 2FA</p>
                <p className="text-sm text-secondary-500">Autenticação de dois fatores</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Log de atividades</p>
                <p className="text-sm text-secondary-500">Registrar todas as ações</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Rate limiting</p>
                <p className="text-sm text-secondary-500">Limitar velocidade de envio</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Envio */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Configurações de Envio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Delay entre mensagens (segundos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              defaultValue="2"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 mt-1">
              Tempo de espera entre cada mensagem para evitar spam
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Máximo de mensagens por hora
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              defaultValue="100"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 mt-1">
              Limite de mensagens por hora para evitar bloqueios
            </p>
          </div>
        </div>
      </div>

      {/* Backup e Exportação */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Backup e Exportação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-secondary btn-md">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Exportar Clientes
          </button>
          <button className="btn btn-secondary btn-md">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Exportar Campanhas
          </button>
          <button className="btn btn-secondary btn-md">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Backup Completo
          </button>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2" />
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Versão da Aplicação</h4>
            <p className="text-sm text-secondary-600">v1.0.0</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Última Atualização</h4>
            <p className="text-sm text-secondary-600">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Status do Banco</h4>
            <p className="text-sm text-success-600">Conectado</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Status das Filas</h4>
            <p className="text-sm text-success-600">Ativo</p>
          </div>
        </div>
      </div>

      {/* Modal do QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900 flex items-center">
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Conectar WhatsApp
              </h3>
              <button
                onClick={() => setQrCodeModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-secondary-600 mb-4">
                1. Abra o WhatsApp no seu celular<br/>
                2. Toque em Menu ou Configurações<br/>
                3. Toque em "Dispositivos conectados"<br/>
                4. Toque em "Conectar um dispositivo"<br/>
                5. Escaneie o QR Code abaixo
              </p>
              
              {whatsappStatus.qrCode && (
                <div className="bg-white p-4 rounded-lg border border-secondary-200 inline-block">
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
                    } else if (!checkingConnection) {
                      console.log('Verificação de conexão não está ativa, não é necessário verificar')
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-secondary-600">Verificando conexão automaticamente...</span>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    O sistema está verificando se o WhatsApp foi conectado
                  </p>
                  {qrCodeCountdown > 0 && (
                    <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded-md">
                      <p className="text-xs text-warning-700">
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

      {/* Modal de Confirmação Visual */}
      {confirmDialog.open && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '500px',
              maxWidth: '90vw',
              margin: '0 16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                marginRight: '12px', 
                marginTop: '2px', 
                borderRadius: '50%', 
                padding: '8px',
                backgroundColor: confirmDialog.variant === 'danger' ? '#fef2f2' : '#fef3c7',
                color: confirmDialog.variant === 'danger' ? '#dc2626' : '#d97706'
              }}>
                <ExclamationTriangleIcon style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#111827' }}>
                  {confirmDialog.title}
                </h3>
                <p style={{ fontSize: '14px', margin: 0, color: '#6b7280' }}>
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => {
                  console.log('[Modal] Cancelar clicado')
                  if (confirmResolveRef.current) {
                    confirmResolveRef.current(false)
                    confirmResolveRef.current = null
                  }
                  setConfirmDialog(prev => ({ ...prev, open: false }))
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={() => {
                  console.log('[Modal] Confirmar clicado')
                  if (confirmResolveRef.current) {
                    confirmResolveRef.current(true)
                    confirmResolveRef.current = null
                  }
                  setConfirmDialog(prev => ({ ...prev, open: false }))
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: confirmDialog.variant === 'danger' ? '#dc2626' : '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
