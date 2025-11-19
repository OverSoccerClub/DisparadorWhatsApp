'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  UserGroupIcon,
  PhoneIcon,
  DocumentTextIcon,
  ClockIcon,
  EyeIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'
import { Cliente } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAlertContext } from '@/lib/contexts/AlertContext'
import TimeControl from './TimeControl'
import { detectMessageType, generateTypedVariations } from '@/lib/messageVariations'
import VariationsGenerationOverlay from './VariationsGenerationOverlay'
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress'
import SuccessModal from './SuccessModal'

interface TelegramDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
}

interface TelegramBot {
  id: string
  nome: string
  botToken: string
  botUsername?: string
  numeroRemetente?: string
  status: 'active' | 'inactive'
}

export default function TelegramDispatchModal({ isOpen, onClose, clientes }: TelegramDispatchModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useAlertContext()
  const [activeTab, setActiveTab] = useState<'clientes' | 'novos'>('clientes')
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [novosChatIds, setNovosChatIds] = useState<string>('')
  const [telegramBots, setTelegramBots] = useState<TelegramBot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [useLoadBalancing, setUseLoadBalancing] = useState<boolean>(false)
  const [mensagem, setMensagem] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [enableVariations, setEnableVariations] = useState(true)
  const [useAI, setUseAI] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [variationsPreview, setVariationsPreview] = useState<string[]>([])
  const [genStatus, setGenStatus] = useState<'generating' | 'success' | 'error'>('generating')
  const [sessionId] = useState(() => `telegram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const realtime = useRealtimeProgress(sessionId)
  const [sendLogs, setSendLogs] = useState<Array<{ ts: number; chatId?: string; bot?: string; message?: string; status?: 'sending'|'sent'|'failed' }>>([])
  const [showDetails, setShowDetails] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Atualizar logs quando o progresso mudar
  useEffect(() => {
    const p = realtime.progress
    if (!p) return
    if (p.currentPhone || p.currentMessage) {
      setSendLogs(prev => [...prev, {
        ts: Date.now(),
        chatId: p.currentPhone,
        bot: p.currentInstance,
        message: p.currentMessage,
        status: 'sending'
      }].slice(-100))
    }
  }, [realtime.progress?.currentPhone, realtime.progress?.currentMessage, realtime.progress?.currentInstance])
  
  const inferredType = detectMessageType(mensagem || '')
  const [timeControlConfig, setTimeControlConfig] = useState<{
    delayMinutes: number
    delaySeconds: number
    totalTimeHours: number
    totalTimeMinutes: number
    autoCalculate: boolean
  }>({
    delayMinutes: 1,
    delaySeconds: 30,
    totalTimeHours: 3,
    totalTimeMinutes: 0,
    autoCalculate: true
  })

  // Carregar bots do Telegram quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadTelegramBots()
    }
  }, [isOpen])

  const loadTelegramBots = async () => {
    try {
      console.log('🔄 Carregando bots do Telegram...')
      const response = await fetch('/api/telegram/bots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Bots do Telegram carregados:', data)
        
        if (data.success) {
          // Mapear os dados da API para o formato esperado
          const mappedBots: TelegramBot[] = (data.bots || []).map((bot: any) => ({
            id: bot.id,
            nome: bot.nome,
            botToken: bot.botToken,
            botUsername: bot.botUsername,
            numeroRemetente: bot.numeroRemetente,
            status: bot.status
          }))
          
          const activeBots = mappedBots.filter((bot: TelegramBot) => bot.status === 'active')
          setTelegramBots(mappedBots)
          
          // Configurar modo de distribuição
          if (activeBots.length > 0) {
            if (!selectedBot) {
              setSelectedBot(activeBots[0].id)
            }
            setUseLoadBalancing(false)
          } else {
            setUseLoadBalancing(true)
            setSelectedBot('')
          }
        }
      } else {
        console.error('❌ Erro ao carregar bots do Telegram:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar bots do Telegram:', error)
    }
  }

  const caracteresRestantes = 4096 - mensagem.length
  const isMensagemValida = mensagem.length > 0 && caracteresRestantes >= 0

  const handleSelectCliente = (clienteId: string) => {
    setSelectedClientes(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    )
  }

  const handleSelectAll = () => {
    if (selectedClientes.length === (clientes?.length || 0)) {
      setSelectedClientes([])
    } else {
      setSelectedClientes((clientes || []).map(c => c.id))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv') {
        showError('Por favor, selecione um arquivo CSV válido')
        return
      }
      setUploadedFile(file)
      showSuccess('Arquivo CSV carregado com sucesso!')
    }
  }

  const processarChatIds = (texto: string): string[] => {
    return texto
      .split(/[,\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0 && /^-?\d+$/.test(id))
  }

  const chatIdsProcessados = processarChatIds(novosChatIds)

  const handlePreview = () => {
    if (!isMensagemValida) {
      showError('Digite uma mensagem válida')
      return
    }
    setPreviewMode(true)
  }

  const handleGenerateVariations = async () => {
    if (!mensagem.trim()) {
      showError('Digite uma mensagem primeiro')
      return
    }

    const totalDestinatarios = activeTab === 'clientes' 
      ? selectedClientes.length 
      : chatIdsProcessados.length

    if (totalDestinatarios === 0) {
      showError('Selecione destinatários primeiro')
      return
    }

    try {
      setAiLoading(true)
      setGenStatus('generating')
      
      const response = await fetch('/api/waha/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessage: mensagem,
          count: totalDestinatarios,
          language: 'português brasileiro',
          tone: 'profissional e amigável'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setVariationsPreview(data.result.variations)
        setGenStatus('success')
        showSuccess(`${data.result.variations.length} variações geradas!`)
      } else {
        // Fallback local (sinônimos) para não bloquear o fluxo
        const fallback = generateTypedVariations(mensagem, totalDestinatarios)
        setVariationsPreview(fallback)
        setGenStatus('success')
        showSuccess(`${fallback.length} variações geradas localmente`)
      }
    } catch (error) {
      console.error('Erro ao gerar variações:', error)
      // Fallback local em caso de erro de rede/API
      const fallback = generateTypedVariations(mensagem, totalDestinatarios)
      setVariationsPreview(fallback)
      setGenStatus('success')
      showSuccess(`${fallback.length} variações geradas localmente`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleEnviar = async () => {
    if (!isMensagemValida) {
      showError('Digite uma mensagem válida')
      return
    }

    if (activeTab === 'clientes' && selectedClientes.length === 0) {
      showError('Selecione pelo menos um cliente')
      return
    }

    if (activeTab === 'novos' && chatIdsProcessados.length === 0) {
      showError('Digite pelo menos um Chat ID válido')
      return
    }

    if (!selectedBot && !useLoadBalancing) {
      showError('Selecione um bot do Telegram ou habilite o balanceamento automático')
      return
    }

    setLoading(true)

    try {
      const totalDestinatarios = activeTab === 'clientes' 
        ? selectedClientes.length 
        : chatIdsProcessados.length

      // Preparar chat IDs para envio
      // Para Telegram, vamos precisar do chat_id de cada cliente
      // Por enquanto, vamos usar o telefone como identificador
      const chatIds = activeTab === 'clientes' 
        ? selectedClientes.map(id => {
            const cliente = (clientes || []).find(c => c.id === id)
            // Assumindo que o chat_id pode estar armazenado no cliente ou usar telefone
            return cliente?.telefone || ''
          }).filter(chatId => chatId)
        : chatIdsProcessados

      // Preparar dados do disparo
      const dispatchData = {
        chatIds,
        mensagem,
        messageVariations: enableVariations && variationsPreview.length > 0 ? variationsPreview : undefined,
        user_id: user?.id,
        useLoadBalancing,
        selectedBot: useLoadBalancing ? null : selectedBot,
        enableVariations,
        timeControl: {
          delayMinutes: timeControlConfig.delayMinutes,
          delaySeconds: timeControlConfig.delaySeconds,
          totalTimeHours: timeControlConfig.totalTimeHours,
          totalTimeMinutes: timeControlConfig.totalTimeMinutes
        },
        humanizeConversation: true,
        sessionId
      }

      // Enviar via API Telegram
      const response = await fetch('/api/telegram/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dispatchData)
      })

      const data = await response.json()
      
      if (response.ok) {
        realtime.finish()
        const variationText = enableVariations && variationsPreview.length > 0 
          ? ` com ${variationsPreview.length} variações diferentes` 
          : ''
        
        const botText = useLoadBalancing 
          ? ` distribuído(s) entre ${telegramBots.filter(b => b.status === 'active').length} bot(s) do Telegram` 
          : ` via bot específico`

        const mensagemSucesso = `${totalDestinatarios} mensagem(ns) enviada(s) com sucesso${variationText}${botText}!`
        setSuccessMessage(mensagemSucesso)
        
        // Reset form
        setSelectedClientes([])
        setNovosChatIds('')
        setMensagem('')
        
        // Fechar modal e mostrar sucesso
        onClose()
        setShowSuccessModal(true)
        setPreviewMode(false)
        setVariationsPreview([])
        
        // Fechar modal após delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        realtime.setError()
        showError(data.error || 'Erro ao enviar mensagens')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      realtime.setError()
      showError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getPreviewMensagem = () => {
    if (activeTab === 'clientes' && selectedClientes.length > 0) {
      const primeiroCliente = (clientes || []).find(c => c.id === selectedClientes[0])
      if (primeiroCliente) {
        return mensagem
          .replace(/\{\{nome\}\}/g, primeiroCliente.nome)
          .replace(/\{\{email\}\}/g, primeiroCliente.email || '')
          .replace(/\{\{telefone\}\}/g, primeiroCliente.telefone)
      }
    }
    return mensagem
  }

  const activeBots = telegramBots.filter(b => b.status === 'active')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Barra de progresso de envio */}
      {realtime.progress && (
        <div className="fixed top-0 left-0 right-0 z-[9998]">
          <div className="max-w-4xl mx-auto mt-2 px-4">
            <div className="bg-white border border-blue-200 rounded-md p-4 shadow animate-[fadeIn_.3s_ease]">
              <div className="flex items-start justify-between gap-4">
                {/* Coluna 1: Resumo */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <BoltIcon className="h-4 w-4" />
                    <span className="font-medium">Envio em andamento</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <PaperAirplaneIcon className="h-4 w-4" /> {realtime.progress.sentMessages}/{realtime.progress.totalMessages}
                    </span>
                    {typeof realtime.progress.totalMessages === 'number' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <ClockIcon className="h-4 w-4" /> Restantes: {Math.max(0, (realtime.progress.totalMessages - (realtime.progress.sentMessages || 0) - (realtime.progress.failedMessages || 0)))}
                      </span>
                    )}
                    {typeof realtime.progress.failedMessages === 'number' && realtime.progress.failedMessages > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                        <ExclamationTriangleIcon className="h-4 w-4" /> Falhas: {realtime.progress.failedMessages}
                      </span>
                    )}
                  </div>
                  {realtime.progress.currentPhone && (
                    <div className="mt-2 text-xs text-secondary-700 flex items-center gap-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-secondary-500" />
                      <span className="font-medium">Chat ID: {realtime.progress.currentPhone}</span>
                      {realtime.progress.currentInstance && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-50 text-secondary-700 border border-secondary-200">
                          <SignalIcon className="h-3 w-3" /> {realtime.progress.currentInstance}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Coluna 2: Barra */}
                <div className="w-48 self-center">
                  <div className="w-full bg-blue-100 h-2 rounded overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded transition-all duration-500" style={{ width: `${realtime.progress.progress || 0}%` }}></div>
                  </div>
                  <div className="mt-1 text-right text-[11px] text-secondary-500">
                    {realtime.progress.progress || 0}%
                  </div>
                </div>
                {/* Coluna 3: Ações */}
                <div className="w-28 text-right">
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-secondary-200 text-secondary-700 hover:bg-secondary-50"
                  >
                    <EyeIcon className="h-4 w-4" /> Ver detalhes
                  </button>
                </div>
              </div>

              {/* Lista sucinta das últimas mensagens */}
              {sendLogs.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto text-xs text-secondary-700 divide-y divide-secondary-100">
                  {sendLogs.slice(-6).reverse().map((e, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-secondary-500 mr-1">{new Date(e.ts).toLocaleTimeString()}</span>
                        <span className="font-medium">{e.chatId}</span>
                        {e.bot && <span className="ml-1 text-secondary-500">({e.bot})</span>}
                        {e.message && <span className="ml-2 truncate">- {e.message.substring(0, 90)}...</span>}
                      </div>
                      <span className={`ml-2 ${e.status === 'failed' ? 'text-red-600' : e.status === 'sent' ? 'text-green-600' : 'text-blue-600'}`}>
                        {e.status === 'sending' ? 'enviando...' : e.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Envios */}
      {showDetails && (
        <div className="fixed inset-0 z-[10000]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetails(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-secondary-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
                  <h4 className="text-sm font-semibold text-secondary-900">Detalhes dos Envios</h4>
                </div>
                <button onClick={() => setShowDetails(false)} className="text-secondary-500 hover:text-secondary-700">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="text-xs text-secondary-600 mb-2">
                  {realtime.progress ? (
                    <>
                      Total: <span className="font-medium">{realtime.progress.totalMessages}</span> •
                      <span className="ml-1"> Enviados: <span className="font-medium text-green-700">{realtime.progress.sentMessages}</span></span> •
                      <span className="ml-1"> Falhas: <span className="font-medium text-red-700">{realtime.progress.failedMessages}</span></span> •
                      <span className="ml-1"> Restantes: <span className="font-medium">{Math.max(0, (realtime.progress.totalMessages - (realtime.progress.sentMessages || 0) - (realtime.progress.failedMessages || 0)))}</span></span>
                    </>
                  ) : 'Coletando dados...'}
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-secondary-100">
                  {sendLogs.length === 0 && (
                    <div className="py-6 text-center text-sm text-secondary-600">Sem eventos ainda.</div>
                  )}
                  {sendLogs.slice().reverse().map((e, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-secondary-500">{new Date(e.ts).toLocaleString()}</div>
                        <div className="mt-0.5 text-sm text-secondary-900 truncate">
                          <span className="font-medium">Chat ID: {e.chatId}</span>
                          {e.bot && <span className="ml-2 text-secondary-600">({e.bot})</span>}
                        </div>
                        {e.message && (
                          <div className="mt-1 text-sm text-secondary-700 whitespace-pre-wrap break-words">
                            {e.message}
                          </div>
                        )}
                      </div>
                      <div className="w-20 text-right text-xs">
                        <span className={e.status === 'failed' ? 'text-red-600' : e.status === 'sent' ? 'text-green-600' : 'text-blue-600'}>
                          {e.status || 'sending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-secondary-200 flex items-center justify-end">
                <button onClick={() => setShowDetails(false)} className="btn btn-secondary btn-sm">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de geração de variações */}
      <VariationsGenerationOverlay
        open={aiLoading}
        status={genStatus}
        details={{
          totalVariations: (activeTab === 'clientes' ? selectedClientes.length : chatIdsProcessados.length) || 0,
          generatedVariations: variationsPreview.length,
          messageType: inferredType
        }}
      />

      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-secondary-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          {/* Header */}
          <div className="bg-white dark:bg-secondary-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <PaperClipIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Disparo de Mensagens Telegram
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                    Envie mensagens para clientes cadastrados ou novos Chat IDs via Telegram
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                title="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-secondary-200 dark:border-secondary-700">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('clientes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === 'clientes'
                    ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Clientes Cadastrados
              </button>
              <button
                onClick={() => setActiveTab('novos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === 'novos'
                    ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Novos Chat IDs
              </button>
            </nav>
          </div>

          {/* Informações dos Bots do Telegram */}
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {activeBots.length} bot(s) ativo(s)
                  </span>
                </div>
                {telegramBots.length - activeBots.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      {telegramBots.length - activeBots.length} inativo(s)
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Sistema: Telegram Bot API
              </div>
            </div>
            {activeBots.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  ⚠️ Nenhum bot do Telegram configurado. Configure um bot em Configurações.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-white dark:bg-secondary-800">
            {/* Tab Content */}
            {activeTab === 'clientes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Selecionar Clientes ({selectedClientes.length} selecionados)
                  </h4>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
                  >
                    {selectedClientes.length === (clientes?.length || 0) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-900">
                  {(clientes || []).map((cliente) => (
                    <div key={cliente.id} className="flex items-center px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 last:border-b-0 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={() => handleSelectCliente(cliente.id)}
                        className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          {cliente.telefone} • {cliente.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'novos' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Chat IDs do Telegram
                  </label>
                  <div className="space-y-3">
                    <textarea
                      value={novosChatIds}
                      onChange={(e) => setNovosChatIds(e.target.value)}
                      placeholder="Digite os Chat IDs separados por vírgula ou quebra de linha:&#10;123456789&#10;987654321&#10;-1001234567890"
                      className="input h-32 resize-none"
                    />
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload-telegram"
                        />
                        <label
                          htmlFor="csv-upload-telegram"
                          className="btn btn-secondary btn-sm cursor-pointer"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                          Upload CSV
                        </label>
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {chatIdsProcessados.length} Chat ID(s) válido(s)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" />
                  Mensagem
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreview}
                    className="btn btn-ghost btn-sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Pré-visualizar
                  </button>
                  <button
                    onClick={handleGenerateVariations}
                    className="btn btn-secondary btn-sm"
                    disabled={aiLoading}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    {aiLoading ? 'Gerando...' : 'Gerar Variações'}
                  </button>
                  <span className={`text-sm flex items-center ${caracteresRestantes < 0 ? 'text-error-600 dark:text-error-400' : 'text-secondary-500 dark:text-secondary-400'}`}>
                    <DocumentTextIcon className="h-3 w-3 mr-1" />
                    {caracteresRestantes} caracteres restantes
                  </span>
                </div>
              </div>
              
              {previewMode ? (
                <div className="border border-secondary-200 dark:border-secondary-700 rounded-md p-4 bg-secondary-50 dark:bg-secondary-900">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Telegram</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">agora</div>
                    </div>
                  </div>
                  <div className="text-sm text-secondary-900 dark:text-secondary-100 whitespace-pre-wrap">
                    {getPreviewMensagem()}
                  </div>
                </div>
              ) : (
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua mensagem aqui...&#10;&#10;Use variáveis personalizadas:&#10;{{nome}} - Nome do cliente&#10;{{email}} - Email do cliente&#10;{{telefone}} - Telefone do cliente"
                  className="input h-32 resize-none"
                />
              )}
            </div>

            {/* Seleção de Bot do Telegram */}
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Bot do Telegram (Remetente)
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    {activeBots.length} de {telegramBots.length} bot(s) ativo(s)
                  </span>
                </div>
                
                {/* Filtro por número remetente (se houver bots com número) */}
                {activeBots.some(b => b.numeroRemetente) && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                      Filtrar por Número Remetente (opcional)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const bot = activeBots.find(b => b.numeroRemetente === e.target.value)
                          if (bot) {
                            setSelectedBot(bot.id)
                            setUseLoadBalancing(false)
                          }
                        }
                      }}
                      className="input text-xs"
                    >
                      <option value="">Todos os bots</option>
                      {activeBots
                        .filter(b => b.numeroRemetente)
                        .map(bot => (
                          <option key={bot.numeroRemetente} value={bot.numeroRemetente}>
                            {bot.numeroRemetente} - {bot.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Modo de Distribuição */}
                <div className="space-y-3">
                  {/* Opção 1: Bot Específico */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="specific-bot"
                      name="distribution-mode-telegram"
                      checked={!useLoadBalancing}
                      onChange={() => {
                        setUseLoadBalancing(false)
                        if (activeBots.length > 0) {
                          setSelectedBot(activeBots[0].id)
                        }
                      }}
                      className="text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                    <label htmlFor="specific-bot" className="text-sm text-secondary-700 dark:text-secondary-300">
                      Usar bot específico
                    </label>
                  </div>

                  {/* Opção 2: Balanceamento Automático */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="load-balancing-telegram"
                      name="distribution-mode-telegram"
                      checked={useLoadBalancing}
                      onChange={() => {
                        setUseLoadBalancing(true)
                        setSelectedBot('')
                      }}
                      className="text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                    <label htmlFor="load-balancing-telegram" className="text-sm text-secondary-700 dark:text-secondary-300">
                      Balanceamento automático entre bots
                    </label>
                  </div>
                </div>

                {/* Seletor de Bot (só aparece se não for modo aleatório) */}
                {!useLoadBalancing && (
                  <div className="mt-3">
                    <select
                      value={selectedBot}
                      onChange={(e) => setSelectedBot(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione um bot</option>
                      {activeBots.map(bot => (
                        <option 
                          key={bot.id}
                          value={bot.id}
                        >
                          {bot.nome}
                          {bot.botUsername && ` (@${bot.botUsername})`}
                          {bot.numeroRemetente && ` - ${bot.numeroRemetente}`}
                        </option>
                      ))}
                    </select>
                    {activeBots.length === 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                        ⚠️ Nenhum bot ativo. Configure um bot em Configurações ou use o balanceamento automático.
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagens de Status */}
                {useLoadBalancing && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></div>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        As mensagens serão distribuídas automaticamente entre todos os bots ativos
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controle de Tempo */}
            <div className="mt-6">
              <TimeControl
                totalDestinatarios={activeTab === 'clientes' ? selectedClientes.length : chatIdsProcessados.length}
                totalInstancias={activeBots.length}
                onConfigChange={setTimeControlConfig}
                disabled={loading}
                messageType={inferredType}
                humanizeConversation={true}
              />
            </div>

            {/* Preview das Variações */}
            {variationsPreview.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Variações Geradas ({variationsPreview.length})
                  </h4>
                  <button
                    onClick={() => setVariationsPreview([])}
                    className="text-xs text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-900">
                  {variationsPreview.map((variation, index) => (
                    <div key={index} className="p-3 border-b border-secondary-100 dark:border-secondary-700 last:border-b-0 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">
                            Variação {index + 1}
                          </div>
                          <div className="text-sm text-secondary-900 dark:text-secondary-100 whitespace-pre-wrap">
                            {variation}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setMensagem(variation)
                            setPreviewMode(true)
                          }}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs transition-colors"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                    <div className="text-sm text-primary-800 dark:text-primary-300">
                      <strong>Variações ativadas!</strong> Cada destinatário receberá uma versão diferente da mensagem, 
                      mantendo o contexto mas com pequenas variações para evitar spam.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações de Variações */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Configurações de Variações
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useAI-telegram"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800"
                    />
                    <label htmlFor="useAI-telegram" className="text-sm text-secondary-700 dark:text-secondary-300">
                      Variações por IA (Gemini)
                    </label>
                  </div>
                  <input
                    type="checkbox"
                    id="enableVariations-telegram"
                    checked={enableVariations}
                    onChange={(e) => setEnableVariations(e.target.checked)}
                    className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800"
                  />
                  <label htmlFor="enableVariations-telegram" className="text-sm text-secondary-700 dark:text-secondary-300">
                    Ativar variações automáticas
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-secondary-50 dark:bg-secondary-900 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-secondary-200 dark:border-secondary-700">
            <button
              onClick={handleEnviar}
              disabled={loading || !isMensagemValida}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:ml-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Enviar Mensagens
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 dark:focus:ring-secondary-400 transition-all duration-200 w-full sm:w-auto mt-3 sm:mt-0"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

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

