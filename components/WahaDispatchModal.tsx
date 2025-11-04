'use client'

import { useState, useEffect, useMemo } from 'react'
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
  SignalIcon
} from '@heroicons/react/24/outline'
import { Cliente } from '@/lib/supabase'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import TimeControl from './TimeControl'
import { detectMessageType, generateTypedVariations } from '@/lib/messageVariations'
import VariationsGenerationOverlay from './VariationsGenerationOverlay'
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress'

interface WahaDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
}

interface WahaSession {
  serverId: string
  serverName: string
  sessionName: string
  status: string
  avatar?: string
  phoneNumber?: string
  connectedAt?: string
}

export default function WahaDispatchModal({ isOpen, onClose, clientes }: WahaDispatchModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'clientes' | 'novos'>('clientes')
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [novosNumeros, setNovosNumeros] = useState<string>('')
  const [wahaSessions, setWahaSessions] = useState<WahaSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
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
  const [sessionId] = useState(() => `waha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const realtime = useRealtimeProgress(sessionId)
  const [sendLogs, setSendLogs] = useState<Array<{ ts: number; phone?: string; instance?: string; message?: string; status?: 'sending'|'sent'|'failed' }>>([])
  const [showDetails, setShowDetails] = useState(false)
  // Remover duplicatas visuais (mesmo phone+message) para não parecer que enviou várias vezes
  const visibleLogs = useMemo(() => {
    const seen = new Set<string>()
    // Considerar do mais recente para o mais antigo
    const reversed = sendLogs.slice().reverse()
    const filtered = reversed.filter(e => {
      const key = `${e.phone || ''}|${(e.message || '').trim()}`
      if (!e.phone || !e.message) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    // Voltar para ordem cronológica crescente onde necessário
    return filtered.reverse()
  }, [sendLogs])

  // Atualizar logs com dados precisos do servidor
  useEffect(() => {
    const p = realtime.progress
    if (!p) return
    
    // Usar logs precisos do servidor se disponíveis (mais fiel)
    if (p.messageLogs && Array.isArray(p.messageLogs) && p.messageLogs.length > 0) {
      const preciseLogs = p.messageLogs.map(log => ({
        ts: log.timestamp,
        phone: log.phone,
        instance: log.instance,
        message: log.message,
        status: log.status === 'sent' ? 'sent' : 'failed'
      }))
      
      // Remover duplicatas baseadas em timestamp + phone + message
      const uniqueLogs = preciseLogs.filter((log, idx, self) => 
        idx === self.findIndex(l => 
          l.ts === log.ts && 
          l.phone === log.phone && 
          l.message === log.message
        )
      )
      
      setSendLogs(uniqueLogs.slice(-100)) // Manter últimos 100
    } else if (p.currentPhone || p.currentMessage) {
      // Fallback: usar progresso atual (menos preciso)
      setSendLogs(prev => {
        // Evitar duplicatas
        const lastLog = prev[prev.length - 1]
        if (lastLog && 
            lastLog.phone === p.currentPhone && 
            lastLog.message === p.currentMessage &&
            Date.now() - lastLog.ts < 5000) {
          return prev // Não adicionar duplicata
        }
        return [...prev, {
          ts: Date.now(),
          phone: p.currentPhone,
          instance: p.currentInstance,
          message: p.currentMessage,
          status: 'sending'
        }].slice(-100)
      })
    }
  }, [realtime.progress?.messageLogs, realtime.progress?.currentPhone, realtime.progress?.currentMessage, realtime.progress?.currentInstance])
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

  // Carregar sessões WAHA quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadWahaSessions()
    }
  }, [isOpen])

  const loadWahaSessions = async () => {
    try {
      console.log('🔄 Carregando sessões WAHA...')
      const response = await fetch('/api/waha/sessions/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Sessões WAHA carregadas:', data)
        
        if (data.success) {
          const workingSessions = data.sessions.filter((session: any) => {
            const s = String(session.status || '').toUpperCase()
            return s === 'WORKING' || s === 'CONNECTED' || s === 'OPEN' || s === 'READY' || s === 'AUTHENTICATED'
          })
          
          setWahaSessions(data.sessions)
          
          // Configurar modo de distribuição
          if (workingSessions.length > 0) {
            if (!selectedSession) {
              setSelectedSession(`${workingSessions[0].serverId}:${workingSessions[0].sessionName}`)
            }
            setUseLoadBalancing(false)
          } else {
            setUseLoadBalancing(true)
            setSelectedSession('')
          }
        }
      } else {
        console.error('❌ Erro ao carregar sessões WAHA:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sessões WAHA:', error)
    }
  }

  const caracteresRestantes = 1600 - mensagem.length
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
        toast.error('Por favor, selecione um arquivo CSV válido')
        return
      }
      setUploadedFile(file)
      toast.success('Arquivo CSV carregado com sucesso!')
    }
  }

  const processarNumeros = (texto: string): string[] => {
    return texto
      .split(/[,\n]/)
      .map(num => num.trim())
      .filter(num => num.length > 0)
      .map(num => formatPhoneNumber(num))
      .filter(num => validatePhoneNumber(num))
  }

  const numerosProcessados = processarNumeros(novosNumeros)

  const handlePreview = () => {
    if (!isMensagemValida) {
      toast.error('Digite uma mensagem válida')
      return
    }
    setPreviewMode(true)
  }

  const handleGenerateVariations = async () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem primeiro')
      return
    }

    const totalDestinatarios = activeTab === 'clientes' 
      ? selectedClientes.length 
      : numerosProcessados.length

    if (totalDestinatarios === 0) {
      toast.error('Selecione destinatários primeiro')
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
        toast.success(`${data.result.variations.length} variações geradas!`)
      } else {
        // Fallback local (sinônimos) para não bloquear o fluxo
        const fallback = generateTypedVariations(mensagem, totalDestinatarios)
        setVariationsPreview(fallback)
        setGenStatus('success')
        toast.success(`${fallback.length} variações geradas localmente`)
      }
    } catch (error) {
      console.error('Erro ao gerar variações:', error)
      // Fallback local em caso de erro de rede/API
      const fallback = generateTypedVariations(mensagem, totalDestinatarios)
      setVariationsPreview(fallback)
      setGenStatus('success')
      toast.success(`${fallback.length} variações geradas localmente`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleEnviar = async () => {
    if (!isMensagemValida) {
      toast.error('Digite uma mensagem válida')
      return
    }

    if (activeTab === 'clientes' && selectedClientes.length === 0) {
      toast.error('Selecione pelo menos um cliente')
      return
    }

    if (activeTab === 'novos' && numerosProcessados.length === 0) {
      toast.error('Digite pelo menos um número válido')
      return
    }

    if (!selectedSession && !useLoadBalancing) {
      toast.error('Selecione uma sessão WAHA ou habilite o balanceamento automático')
      return
    }

    setLoading(true)

    try {
      const totalDestinatarios = activeTab === 'clientes' 
        ? selectedClientes.length 
        : numerosProcessados.length

      // Preparar telefones e informações de clientes para envio
      const telefones = activeTab === 'clientes' 
        ? selectedClientes.map(id => {
            const cliente = (clientes || []).find(c => c.id === id)
            return cliente?.telefone || ''
          }).filter(telefone => telefone)
        : numerosProcessados

      // Preparar mapeamento de telefone -> nome do cliente (para personalização)
      const clientesMap = activeTab === 'clientes' 
        ? selectedClientes.reduce((acc, id) => {
            const cliente = (clientes || []).find(c => c.id === id)
            if (cliente?.telefone && cliente?.nome) {
              acc[cliente.telefone] = cliente.nome
            }
            return acc
          }, {} as Record<string, string>)
        : {}

      // Preparar dados do disparo
      const dispatchData = {
        telefones,
        clientesMap, // Mapa telefone -> nome para personalização
        mensagem,
        messageVariations: enableVariations && variationsPreview.length > 0 ? variationsPreview : undefined,
        user_id: user?.id,
        useLoadBalancing,
        selectedSession: useLoadBalancing ? null : selectedSession,
        enableVariations,
        timeControl: {
          delayMinutes: timeControlConfig.delayMinutes,
          delaySeconds: timeControlConfig.delaySeconds,
          totalTimeHours: timeControlConfig.totalTimeHours,
          totalTimeMinutes: timeControlConfig.totalTimeMinutes
        },
        humanizeConversation: true // Adicionado para habilitar a conversão humana
        ,
        sessionId
      }

      // Enviar via API WAHA
      const response = await fetch('/api/waha/dispatch', {
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
        
        const sessionText = useLoadBalancing 
          ? ` distribuído(s) entre ${wahaSessions.filter(s => s.status === 'WORKING').length} sessão(ões) WAHA` 
          : ` via sessão específica`

        toast.success(`${totalDestinatarios} mensagem(ns) enviada(s) com sucesso${variationText}${sessionText}!`)
        
        // Reset form
        setSelectedClientes([])
        setNovosNumeros('')
        setMensagem('')
        setPreviewMode(false)
        setVariationsPreview([])
        
        // Fechar modal após delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        realtime.setError()
        toast.error(data.error || 'Erro ao enviar mensagens')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      realtime.setError()
      toast.error('Erro de conexão. Tente novamente.')
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

  const workingSessions = wahaSessions.filter(s => {
    const st = String(s.status || '').toUpperCase()
    return st === 'WORKING' || st === 'CONNECTED' || st === 'OPEN' || st === 'READY' || st === 'AUTHENTICATED'
  })

  if (!isOpen) return null

  // Componente de cronômetro para próxima mensagem (igual ao da maturação)
  function NextMessageTimer({ nextMessageAt }: { nextMessageAt: number }) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0)

    useEffect(() => {
      if (!nextMessageAt || nextMessageAt <= 0) return
      
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, nextMessageAt - now)
        setTimeRemaining(remaining)
      }

      updateTimer() // Atualizar imediatamente
      const interval = setInterval(updateTimer, 1000) // Atualizar a cada segundo

      return () => clearInterval(interval)
    }, [nextMessageAt])

    const totalSeconds = Math.floor(timeRemaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const displaySeconds = totalSeconds % 60

    if (timeRemaining <= 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-500">
          <ClockIcon className="h-4 w-4" />
          <span>Enviando...</span>
        </div>
      )
    }

    // Se for menos de 1 minuto, mostrar apenas segundos (ex: "43s")
    // Se for 1 minuto ou mais, mostrar minutos e segundos (ex: "1m 30s")
    const displayText = minutes > 0 
      ? `${minutes}m ${displaySeconds}s`
      : `${displaySeconds}s`

    return (
      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
        <ClockIcon className="h-4 w-4" />
        <span>{displayText}</span>
      </div>
    )
  }

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
                  {/* Conversa Atual - Layout igual ao da maturação */}
                  {(realtime.progress.currentPhone || realtime.progress.currentInstance) && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-primary-200">
                      <div className="text-xs font-semibold text-secondary-700 mb-2 flex items-center justify-between">
                        <span>Conversa Atual</span>
                        {/* SEMPRE mostrar o ícone de tempo e cronômetro */}
                        <div className="flex items-center gap-1">
                          {typeof realtime.progress.nextMessageAt === 'number' && realtime.progress.nextMessageAt > Date.now() ? (
                            <NextMessageTimer nextMessageAt={realtime.progress.nextMessageAt} />
                          ) : (
                            <>
                              <ClockIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                              <span className="text-xs text-secondary-500 whitespace-nowrap">Calculando tempo...</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        {/* Sessão/Instância que está enviando */}
                        {realtime.progress.currentInstance && (
                          <>
                            <div className="px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                              {realtime.progress.currentInstance}
                            </div>
                            <span className="text-secondary-400">→</span>
                          </>
                        )}
                        {/* Destinatário */}
                        {realtime.progress.currentPhone && (
                          <div className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded font-medium">
                            {realtime.progress.currentPhone}
                          </div>
                        )}
                      </div>
                      {/* Mensagem atual enviada */}
                      {realtime.progress.currentMessage && (
                        <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-300 rounded text-xs">
                          <div className="text-secondary-600 mb-1 font-medium">Mensagem enviada:</div>
                          <div className="text-secondary-700 italic">
                            "{realtime.progress.currentMessage.length > 150 ? realtime.progress.currentMessage.substring(0, 150) + '...' : realtime.progress.currentMessage}"
                          </div>
                        </div>
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

              {/* Coluna 3: Fluxo de etapas (saudação -> cumprimento -> principal -> opt-out) */}
              {realtime.progress.currentMessage && (
                <div className="mt-3">
                  <div className="text-xs text-secondary-500 mb-1">Etapas</div>
                  <div className="flex items-center gap-2 text-xs">
                    {['Saudação','Como vai?','Mensagem','Opt-out'].map((label, idx) => {
                      const m = (realtime.progress.currentMessage || '').toLowerCase()
                      const active = (idx === 0 && /olá|oi|bom dia|boa tarde|boa noite|e aí/.test(m))
                        || (idx === 1 && /como vai\??/.test(m))
                        || (idx === 2 && !( /como vai\??|não deseja|nao deseja/.test(m)))
                        || (idx === 3 && /(não deseja|nao deseja).+n[ãa]o/.test(m))
                      return (
                        <span key={label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-secondary-50 text-secondary-600 border-secondary-200'}`}>
                          {active ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lista sucinta das últimas mensagens */}
              {visibleLogs.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto text-xs text-secondary-700 divide-y divide-secondary-100">
                  {visibleLogs.slice(-6).reverse().map((e, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-secondary-500 mr-1">{new Date(e.ts).toLocaleTimeString()}</span>
                        <span className="font-medium">{e.phone}</span>
                        {e.instance && <span className="ml-1 text-secondary-500">({e.instance})</span>}
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

      {/* Modal de Detalhes dos Envios - Layout igual ao da maturação */}
      {showDetails && (
        <div className="fixed inset-0 z-[10000]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetails(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-secondary-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100">
                <div className="flex items-center gap-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
                  <h4 className="text-sm font-semibold text-secondary-900">Detalhes dos Envios</h4>
                </div>
                <button onClick={() => setShowDetails(false)} className="text-secondary-500 hover:text-secondary-700">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                {/* Estatísticas */}
                {realtime.progress && (
                  <div className="mb-4 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                    <div className="text-xs text-secondary-600 flex flex-wrap items-center gap-2">
                      <span>Total: <span className="font-medium">{realtime.progress.totalMessages}</span></span>
                      <span>•</span>
                      <span>Enviados: <span className="font-medium text-green-700">{realtime.progress.sentMessages}</span></span>
                      <span>•</span>
                      <span>Falhas: <span className="font-medium text-red-700">{realtime.progress.failedMessages}</span></span>
                      <span>•</span>
                      <span>Restantes: <span className="font-medium">{Math.max(0, (realtime.progress.totalMessages - (realtime.progress.sentMessages || 0) - (realtime.progress.failedMessages || 0)))}</span></span>
                    </div>
                  </div>
                )}
                
                {/* Conversa Atual - Layout igual ao da maturação */}
                {realtime.progress && (realtime.progress.currentPhone || realtime.progress.currentInstance) && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-primary-200">
                    <div className="text-xs font-semibold text-secondary-700 mb-2 flex items-center justify-between">
                      <span>Conversa Atual</span>
                      {/* SEMPRE mostrar o ícone de tempo e cronômetro */}
                      <div className="flex items-center gap-1">
                        {typeof realtime.progress.nextMessageAt === 'number' && realtime.progress.nextMessageAt > Date.now() ? (
                          <NextMessageTimer nextMessageAt={realtime.progress.nextMessageAt} />
                        ) : (
                          <>
                            <ClockIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                            <span className="text-xs text-secondary-500 whitespace-nowrap">Calculando tempo...</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      {/* Sessão/Instância que está enviando */}
                      {realtime.progress.currentInstance && (
                        <>
                          <div className="px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                            {realtime.progress.currentInstance}
                          </div>
                          <span className="text-secondary-400">→</span>
                        </>
                      )}
                      {/* Destinatário */}
                      {realtime.progress.currentPhone && (
                        <div className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded font-medium">
                          {realtime.progress.currentPhone}
                        </div>
                      )}
                    </div>
                    {/* Mensagem atual enviada */}
                    {realtime.progress.currentMessage && (
                      <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-300 rounded text-xs">
                        <div className="text-secondary-600 mb-1 font-medium">Mensagem enviada:</div>
                        <div className="text-secondary-700 italic">
                          "{realtime.progress.currentMessage.length > 150 ? realtime.progress.currentMessage.substring(0, 150) + '...' : realtime.progress.currentMessage}"
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Histórico de Envios - Layout igual ao da maturação */}
                <div className="bg-white rounded-lg border border-secondary-200 p-3 max-h-[60vh] overflow-y-auto">
                  <div className="text-xs font-semibold text-secondary-700 mb-2 flex items-center justify-between">
                    <span>Histórico de Envios</span>
                    <span className="text-secondary-500 font-normal">
                      {sendLogs.length} evento{sendLogs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                  {visibleLogs.length === 0 && (
                      <div className="py-6 text-center text-sm text-secondary-600">Sem eventos ainda.</div>
                    )}
                  {visibleLogs.slice().reverse().slice(0, 100).map((e, idx) => {
                      // Determinar tipo baseado no status
                      const logType = e.status === 'failed' ? 'error' : 
                                     e.status === 'sent' ? 'message' : 
                                     e.status === 'sending' ? 'info' : 'info'
                      
                      return (
                        <div 
                          key={idx} 
                          className={`text-xs p-2 rounded border-l-2 ${
                            logType === 'message' ? 'bg-green-50 border-green-300' :
                            logType === 'error' ? 'bg-red-50 border-red-300' :
                            logType === 'info' ? 'bg-blue-50 border-blue-300' :
                            'bg-secondary-50 border-secondary-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-secondary-400 font-mono text-[10px]">
                              {new Date(e.ts).toLocaleTimeString()}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              logType === 'error' ? 'bg-red-100 text-red-700' :
                              logType === 'message' ? 'bg-green-100 text-green-700' :
                              logType === 'info' ? 'bg-blue-100 text-blue-700' :
                              'bg-secondary-100 text-secondary-700'
                            }`}>
                              {e.status === 'sent' ? 'enviado' : e.status === 'failed' ? 'erro' : e.status || 'enviando'}
                            </span>
                            {e.phone && (
                              <span className="text-secondary-600 font-medium">
                                {e.phone}
                              </span>
                            )}
                            {e.instance && (
                              <span className="text-secondary-500 text-[10px]">
                                ({e.instance})
                              </span>
                            )}
                            {/* Cronômetro para próxima mensagem (apenas no primeiro item se estiver aguardando) */}
                            {realtime.progress?.nextMessageAt && typeof realtime.progress.nextMessageAt === 'number' && realtime.progress.nextMessageAt > Date.now() && idx === 0 && (
                              <span className="ml-auto">
                                <NextMessageTimer nextMessageAt={realtime.progress.nextMessageAt} />
                              </span>
                            )}
                          </div>
                          {e.message && (
                            <div className={`mt-1 ${logType === 'error' ? 'text-red-700 font-medium' : 'text-secondary-700 italic'}`}>
                              "{e.message.length > 150 ? e.message.substring(0, 150) + '...' : e.message}"
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-secondary-200 flex items-center justify-end bg-secondary-50">
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
          totalVariations: (activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length) || 0,
          generatedVariations: variationsPreview.length,
          messageType: inferredType
        }}
      />
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Disparo de Mensagens WhatsApp (WAHA)
                  </h3>
                  <p className="text-sm text-secondary-500">
                    Envie mensagens para clientes cadastrados ou novos números via WAHA
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-secondary-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('clientes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === 'clientes'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Clientes Cadastrados
              </button>
              <button
                onClick={() => setActiveTab('novos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === 'novos'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Novos Números
              </button>
            </nav>
          </div>

          {/* Informações das Sessões WAHA */}
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    {workingSessions.length} sessão(ões) conectada(s)
                  </span>
                </div>
                {wahaSessions.length - workingSessions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">
                      {wahaSessions.length - workingSessions.length} desconectada(s)
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-blue-600">
                Sistema: WAHA
              </div>
            </div>
            {workingSessions.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Nenhuma sessão WAHA conectada. Configure uma sessão em Sessões WAHA.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            {/* Tab Content */}
            {activeTab === 'clientes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-secondary-900">
                    Selecionar Clientes ({selectedClientes.length} selecionados)
                  </h4>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {selectedClientes.length === (clientes?.length || 0) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-md">
                  {(clientes || []).map((cliente) => (
                    <div key={cliente.id} className="flex items-center px-4 py-3 border-b border-secondary-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={() => handleSelectCliente(cliente.id)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-secondary-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-secondary-500">
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
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Números de Telefone
                  </label>
                  <div className="space-y-3">
                    <textarea
                      value={novosNumeros}
                      onChange={(e) => setNovosNumeros(e.target.value)}
                      placeholder="Digite os números separados por vírgula ou quebra de linha:&#10;5511999999999&#10;5511888888888&#10;5511777777777"
                      className="input h-32 resize-none"
                    />
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="btn btn-secondary btn-sm cursor-pointer"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                          Upload CSV
                        </label>
                      </div>
                      <div className="text-sm text-secondary-600">
                        {numerosProcessados.length} número(s) válido(s)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-secondary-700 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
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
                  <span className={`text-sm flex items-center ${caracteresRestantes < 0 ? 'text-error-600' : 'text-secondary-500'}`}>
                    <DocumentTextIcon className="h-3 w-3 mr-1" />
                    {caracteresRestantes} caracteres restantes
                  </span>
                </div>
              </div>
              
              {previewMode ? (
                <div className="border border-secondary-200 rounded-md p-4 bg-secondary-50">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">W</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-secondary-900">WhatsApp</div>
                      <div className="text-xs text-secondary-500">agora</div>
                    </div>
                  </div>
                  <div className="text-sm text-secondary-900 whitespace-pre-wrap">
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

            {/* Seleção de Sessão WAHA */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Sessão WAHA
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-secondary-500">
                    {workingSessions.length} de {wahaSessions.length} sessões conectadas
                  </span>
                </div>

                {/* Modo de Distribuição */}
                <div className="space-y-3">
                  {/* Opção 1: Sessão Específica */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="specific-session"
                      name="distribution-mode"
                      checked={!useLoadBalancing}
                      onChange={() => {
                        setUseLoadBalancing(false)
                        if (workingSessions.length > 0) {
                          setSelectedSession(`${workingSessions[0].serverId}:${workingSessions[0].sessionName}`)
                        }
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="specific-session" className="text-sm text-secondary-700">
                      Usar sessão específica
                    </label>
                  </div>

                  {/* Opção 2: Balanceamento Automático */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="load-balancing"
                      name="distribution-mode"
                      checked={useLoadBalancing}
                      onChange={() => {
                        setUseLoadBalancing(true)
                        setSelectedSession('')
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="load-balancing" className="text-sm text-secondary-700">
                      Balanceamento automático entre sessões
                    </label>
                  </div>
                </div>

                {/* Seletor de Sessão (só aparece se não for modo aleatório) */}
                {!useLoadBalancing && (
                  <div className="mt-3">
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione uma sessão</option>
                      {workingSessions.map(session => (
                        <option 
                          key={`${session.serverId}:${session.sessionName}`}
                          value={`${session.serverId}:${session.sessionName}`}
                        >
                          {session.serverName} - {session.sessionName}
                          {session.phoneNumber && ` (${session.phoneNumber})`}
                        </option>
                      ))}
                    </select>
                    {workingSessions.length === 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        ⚠️ Nenhuma sessão conectada. Conecte uma sessão em Sessões WAHA ou use o balanceamento automático.
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagens de Status */}
                {useLoadBalancing && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-xs text-blue-700">
                        As mensagens serão distribuídas automaticamente entre todas as sessões conectadas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controle de Tempo */}
            <div className="mt-6">
              <TimeControl
                totalDestinatarios={activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length}
                totalInstancias={workingSessions.length}
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
                  <h4 className="text-sm font-medium text-secondary-700 flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Variações Geradas ({variationsPreview.length})
                  </h4>
                  <button
                    onClick={() => setVariationsPreview([])}
                    className="text-xs text-secondary-500 hover:text-secondary-700"
                  >
                    Limpar
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-md">
                  {variationsPreview.map((variation, index) => (
                    <div key={index} className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-secondary-500 mb-1">
                            Variação {index + 1}
                          </div>
                          <div className="text-sm text-secondary-900 whitespace-pre-wrap">
                            {variation}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setMensagem(variation)
                            setPreviewMode(true)
                          }}
                          className="ml-2 text-primary-600 hover:text-primary-800 text-xs"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                    <div className="text-sm text-primary-800">
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
                <label className="block text-sm font-medium text-secondary-700 flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Configurações de Variações
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useAI"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="useAI" className="text-sm text-secondary-700">
                      Variações por IA (Gemini)
                    </label>
                  </div>
                  <input
                    type="checkbox"
                    id="enableVariations"
                    checked={enableVariations}
                    onChange={(e) => setEnableVariations(e.target.checked)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enableVariations" className="text-sm text-secondary-700">
                    Ativar variações automáticas
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-secondary-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              onClick={handleEnviar}
              disabled={loading || !isMensagemValida}
              className="btn btn-primary btn-md w-full sm:w-auto sm:ml-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Enviando...' : 'Enviar Mensagens'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-md w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
