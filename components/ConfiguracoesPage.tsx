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
        console.log('🔍 [ConfiguracoesPage] Carregando configurações...')
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

  // Funções relacionadas à Evolution API foram movidas para EvolutionApiPage

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

  // Funções relacionadas ao WAHA foram movidas para /waha-sessions

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
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Informações do Usuário
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              ID do Usuário
            </label>
            <input
              type="text"
              value={currentUser?.id || 'Não autenticado'}
              disabled
              className="input w-full bg-secondary-100 dark:bg-secondary-700"
            />
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              Identificador único para suas instâncias
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Nome do Usuário
            </label>
            <input
              type="text"
              value={currentUser?.name || 'Não autenticado'}
              disabled
              className="input w-full bg-secondary-100 dark:bg-secondary-700"
            />
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              Nome do usuário logado
            </p>
          </div>
        </div>
      </div>

      {/* Configurações de API */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
            <ServerIcon className="h-5 w-5 mr-2" />
            Configurações de API
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${webhookStatus.connected ? 'bg-success-500 dark:bg-success-400' : 'bg-error-500 dark:bg-error-400'}`} />
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              {webhookStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                URL para receber notificações de status das mensagens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                Chave para validar a autenticidade dos webhooks
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
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
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
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
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Configurações de Envio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Delay entre mensagens (segundos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              defaultValue="2"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              Tempo de espera entre cada mensagem para evitar spam
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Máximo de mensagens por hora
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              defaultValue="100"
              className="input w-full"
            />
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              Limite de mensagens por hora para evitar bloqueios
            </p>
          </div>
        </div>
      </div>

      {/* Configurações de Recebimento */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Configurações de Recebimento
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Receber confirmações de entrega</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Notificar quando mensagens forem entregues</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Receber confirmações de leitura</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Notificar quando mensagens forem lidas</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Receber respostas automáticas</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Processar respostas dos destinatários</p>
            </div>
            <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" />
          </div>
        </div>
      </div>

      {/* Configurações de Tratamento de Erros */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Tratamento de Erros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Retry automático</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Tentar reenviar mensagens com erro</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.autoRetry}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, autoRetry: e.target.checked }))}
                className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
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
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
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
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Notificar sobre erros</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Enviar alertas quando houver falhas</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.notifyOnError}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, notifyOnError: e.target.checked }))}
                className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Log de erros</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Registrar todos os erros no sistema</p>
              </div>
              <input 
                type="checkbox" 
                checked={errorHandling.logErrors}
                onChange={(e) => setErrorHandling(prev => ({ ...prev, logErrors: e.target.checked }))}
                className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" 
              />
            </div>
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-error-600 dark:text-error-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-error-800 dark:text-error-400">Erros nas últimas 24h</p>
                  <p className="text-sm text-error-600 dark:text-error-400">{webhookStatus.errors} falhas detectadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Notificações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Email de notificações</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Receber notificações por email</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Alertas de erro</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Notificar sobre falhas de envio</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Relatórios semanais</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Enviar resumo semanal</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Segurança
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Autenticação 2FA</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Autenticação de dois fatores</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Log de atividades</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Registrar todas as ações</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Rate limiting</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Limitar velocidade de envio</p>
              </div>
              <input type="checkbox" className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800" defaultChecked />
            </div>
          </div>
        </div>
      </div>

      {/* Backup e Exportação */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
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
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2" />
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Versão da Aplicação</h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">v1.0.0</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Última Atualização</h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Status do Banco</h4>
            <p className="text-sm text-success-600 dark:text-success-400">Conectado</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Status das Filas</h4>
            <p className="text-sm text-success-600 dark:text-success-400">Ativo</p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Visual */}
      {confirmDialog.open && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 dark:bg-black/90 flex items-center justify-center"
        >
          <div 
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border-2 border-secondary-200 dark:border-secondary-700"
          >
            <div className="flex items-start mb-5">
              <div className={`mr-3 mt-0.5 rounded-full p-2 ${
                confirmDialog.variant === 'danger' 
                  ? 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400' 
                  : 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400'
              }`}>
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold mb-2 text-secondary-900 dark:text-secondary-100">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  console.log('[Modal] Cancelar clicado')
                  if (confirmResolveRef.current) {
                    confirmResolveRef.current(false)
                    confirmResolveRef.current = null
                  }
                  setConfirmDialog(prev => ({ ...prev, open: false }))
                }}
                className="px-4 py-2 bg-secondary-500 dark:bg-secondary-600 text-white rounded-md hover:bg-secondary-600 dark:hover:bg-secondary-700 transition-colors text-sm font-medium"
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
                className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-error-600 dark:bg-error-500 hover:bg-error-700 dark:hover:bg-error-600'
                    : 'bg-warning-600 dark:bg-warning-500 hover:bg-warning-700 dark:hover:bg-warning-600'
                }`}
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
