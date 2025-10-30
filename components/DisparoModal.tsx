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
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Cliente } from '@/lib/supabase'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils'
import { generateTypedVariations, detectMessageType } from '@/lib/messageVariations'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSendingProgress } from '@/hooks/useSendingProgress'
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress'
import { useVariationsProgress } from '@/hooks/useVariationsProgress'
import toast from 'react-hot-toast'
import ErrorOverlay from './ErrorOverlay'
import SendingStatusOverlay from './SendingStatusOverlay'
import VariationsGenerationOverlay from './VariationsGenerationOverlay'
import TimeControl from './TimeControl'
import DisparoSummaryModal from './DisparoSummaryModal'

interface DisparoModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
}

export default function DisparoModal({ isOpen, onClose, clientes }: DisparoModalProps) {
  const { user } = useAuth()
  const sendingProgress = useSendingProgress()
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const realtimeProgress = useRealtimeProgress(sessionId)
  const variationsProgress = useVariationsProgress()
  const [activeTab, setActiveTab] = useState<'clientes' | 'novos'>('clientes')
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [novosNumeros, setNovosNumeros] = useState<string>('')
  const [instanceStats, setInstanceStats] = useState<{
    total: number
    connected: number
    disconnected: number
  } | null>(null)
  const [instances, setInstances] = useState<any[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [useRandomDistribution, setUseRandomDistribution] = useState<boolean>(false)

  // Debug: Log do estado atual
  console.log('🔍 Estado atual do DisparoModal:', {
    instances: instances.length,
    instanceStats: instanceStats ? {
      total: instanceStats.total,
      connected: instanceStats.connected,
      disconnected: instanceStats.disconnected
    } : null,
    selectedInstance,
    useRandomDistribution
  })
  const [mensagem, setMensagem] = useState('')
  const [agendamento, setAgendamento] = useState('')
  const [agendamentoHora, setAgendamentoHora] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [enableVariations, setEnableVariations] = useState(true)
  const [messageType, setMessageType] = useState<'promocional' | 'informativa' | 'pessoal' | 'comercial'>('pessoal')
  const [variationsPreview, setVariationsPreview] = useState<string[]>([])
  const [useAI, setUseAI] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [errorOverlay, setErrorOverlay] = useState<{
    open: boolean
    title: string
    message: string
  }>({
    open: false,
    title: '',
    message: ''
  })
  const [sendingStatus, setSendingStatus] = useState<{
    open: boolean
    status: 'sending' | 'success' | 'error'
    details?: {
      totalMessages: number
      sentMessages: number
      failedMessages: number
      instanceName?: string
      distributionMethod?: string
    }
  }>({
    open: false,
    status: 'sending'
  })

  const [variationsStatus, setVariationsStatus] = useState<{
    open: boolean
    status: 'generating' | 'success' | 'error'
    details?: {
      totalVariations: number
      generatedVariations: number
      currentVariation?: string
      estimatedTime?: string
      messageType?: string
    }
  }>({
    open: false,
    status: 'generating'
  })

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

  const [showSummary, setShowSummary] = useState(false)
  const [disparoSummary, setDisparoSummary] = useState<any>(null)

  // Carregar estatísticas das instâncias
  useEffect(() => {
    if (isOpen) {
      loadInstanceStats()
    }
  }, [isOpen])

  const loadInstanceStats = async () => {
    try {
      console.log('🔄 Carregando instâncias...')
      console.log('🔑 Token de autenticação:', document.cookie)
      const response = await fetch('/api/evolution/instances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      console.log('📡 Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dados recebidos:', data)
        
        if (data.success) {
          console.log('✅ Instâncias carregadas com sucesso:', data.data)
          console.log('📊 Total de instâncias recebidas:', data.data.length)
          
          const connectedInstances = data.data.filter((instance: any) => instance.connectionStatus === 'connected')
          const disconnectedInstances = data.data.filter((instance: any) => instance.connectionStatus !== 'connected')
          
          console.log('🔗 Instâncias conectadas:', connectedInstances.length)
          console.log('❌ Instâncias desconectadas:', disconnectedInstances.length)
          console.log('📋 Lista completa de instâncias:', data.data.map((i: any) => ({
            name: i.instanceName,
            status: i.connectionStatus,
            phone: i.phoneNumber,
            profile: i.profile
          })))
          
          // Debug detalhado de cada instância
          data.data.forEach((instance: any, index: number) => {
            console.log(`🔍 Instância ${index + 1}:`, {
              name: instance.instanceName,
              status: instance.connectionStatus,
              phone: instance.phoneNumber,
              profile: instance.profile,
              isOpen: instance.connectionStatus === 'connected'
            })
          })
          
          setInstances(data.data)
          setInstanceStats({
            total: data.data.length,
            connected: connectedInstances.length,
            disconnected: disconnectedInstances.length
          })
          
          // Configurar modo de distribuição
          console.log('⚙️ Configurando modo de distribuição...')
          console.log('📊 Instâncias conectadas:', connectedInstances.length)
          console.log('📊 Instâncias desconectadas:', disconnectedInstances.length)
          console.log('📊 Total de instâncias:', data.data.length)
          
          if (connectedInstances.length > 0) {
            console.log('🎯 Configurando instância específica')
            console.log('🎯 Primeira instância conectada:', connectedInstances[0].instanceName)
            // Selecionar automaticamente a primeira instância conectada
            if (!selectedInstance) {
              setSelectedInstance(connectedInstances[0].instanceName)
            }
            setUseRandomDistribution(false)
          } else if (data.data.length > 0) {
            console.log('⚠️ Instâncias encontradas mas nenhuma conectada')
            // Há instâncias mas nenhuma conectada - manter modo específico mas sem seleção
            setUseRandomDistribution(false)
            setSelectedInstance('')
          } else {
            console.log('🎲 Configurando modo aleatório - nenhuma instância encontrada')
            // Se não há instâncias, ativar modo aleatório
            setUseRandomDistribution(true)
            setSelectedInstance('')
          }
        } else {
          console.error('❌ Erro na API:', data.error)
        }
      } else {
        console.error('❌ Erro na requisição:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Detalhes do erro:', errorData)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas das instâncias:', error)
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

  const handleGenerateVariations = () => {
    console.log('🚀 Iniciando geração de variações...')
    console.log('📝 Mensagem:', mensagem)
    console.log('👥 Total destinatários:', activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length)
    console.log('🤖 Usar IA:', useAI)
    
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

    // Detectar tipo de mensagem
    const messageType = detectMessageType(mensagem)
    
    // Iniciar progresso de variações
    variationsProgress.startGeneration(totalDestinatarios, messageType)
    
    // Mostrar overlay de progresso
    setVariationsStatus({
      open: true,
      status: 'generating',
      details: {
        totalVariations: totalDestinatarios,
        generatedVariations: 0,
        messageType
      }
    })

    if (useAI) {
      console.log('🤖 Usando IA para gerar variações...')
      void handleGenerateVariationsAI(totalDestinatarios)
      return
    }

    console.log('🔧 Usando método local para gerar variações...')
    
    // Simular progresso para método local
    const generateLocalVariations = async () => {
      try {
        const variations = generateTypedVariations(mensagem, totalDestinatarios)
        
        // Simular progresso
        for (let i = 0; i < variations.length; i++) {
          variationsProgress.updateCurrentVariation(variations[i])
          await new Promise(resolve => setTimeout(resolve, 100)) // Simular delay
          variationsProgress.markVariationGenerated()
        }
        
        setVariationsPreview(variations)
        variationsProgress.finishGeneration()
        
        setVariationsStatus({
          open: true,
          status: 'success',
          details: {
            totalVariations: totalDestinatarios,
            generatedVariations: totalDestinatarios,
            messageType
          }
        })
        
        toast.success(`${totalDestinatarios} variações geradas com sucesso!`)
      } catch (error) {
        console.error('❌ Erro ao gerar variações:', error)
        variationsProgress.finishGeneration()
        
        setVariationsStatus({
          open: true,
          status: 'error',
          details: {
            totalVariations: totalDestinatarios,
            generatedVariations: 0,
            messageType
          }
        })
        
        toast.error('Erro ao gerar variações')
      }
    }
    
    void generateLocalVariations()
    console.log('🧪 Teste da função:', testVariations)
    console.log('🧪 Tipo do teste:', typeof testVariations, Array.isArray(testVariations))
    
    // Teste com mensagem real
    const testReal = generateTypedVariations(mensagem, 3)
    console.log('🧪 Teste com mensagem real:', testReal)
    
    // Local: somente sinônimos - SEM LIMITAÇÃO
    const variations = generateTypedVariations(mensagem, totalDestinatarios)
    console.log('🔧 Variações geradas localmente:', variations)
    console.log('🔧 Tipo das variações:', typeof variations, Array.isArray(variations))
    console.log('🔧 Quantidade de variações:', variations.length)
    console.log('🔧 Primeira variação:', variations[0])
    console.log('🔧 Última variação:', variations[variations.length - 1])
    
    // Garantir que todas as variações sejam strings
    const safeVariations = variations.map(v => typeof v === 'string' ? v : String(v || ''))
    console.log('🔧 Variações seguras:', safeVariations)
    console.log('🔧 Estado antes de setar:', { variationsPreview: variationsPreview.length })
    
    setVariationsPreview(safeVariations)
    console.log('✅ Estado atualizado com variações')
    console.log('✅ Novo estado variationsPreview:', safeVariations.length)
    toast.success(`${safeVariations.length} variações geradas (local)!`)
    
    // Verificar se o estado foi atualizado após um pequeno delay
    setTimeout(() => {
      console.log('⏰ Estado após timeout:', variationsPreview.length)
    }, 100)
  }

  const handleGenerateVariationsAI = async (totalDestinatarios: number) => {
    try {
      setAiLoading(true)
      
      // Simular progresso da IA
      const simulateAIProgress = async () => {
        for (let i = 0; i < totalDestinatarios; i++) {
          variationsProgress.updateCurrentVariation(`Gerando variação ${i + 1} com IA...`)
          await new Promise(resolve => setTimeout(resolve, 200)) // Simular delay da IA
          variationsProgress.markVariationGenerated()
        }
      }
      
      // Iniciar simulação de progresso
      void simulateAIProgress()
      
      const response = await fetch('/api/ai/variacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem, quantidade: totalDestinatarios })
      })
      const data = await response.json()
      console.log('🤖 Resposta da API de variações:', data)
      
      if (data?.success && Array.isArray(data.variations)) {
        console.log('✅ Variações recebidas:', data.variations)
        // Garantir que todas as variações sejam strings
        const safeVariations = data.variations.map(v => typeof v === 'string' ? v : String(v || ''))
        console.log('✅ Variações seguras da IA:', safeVariations)
        setVariationsPreview(safeVariations)
        
        variationsProgress.finishGeneration()
        setVariationsStatus({
          open: true,
          status: 'success',
          details: {
            totalVariations: totalDestinatarios,
            generatedVariations: totalDestinatarios,
            messageType: detectMessageType(mensagem)
          }
        })
        
        toast.success(`${safeVariations.length} variações geradas (IA)!`)
      } else if (data?.fallback) {
        // Fallback automático para método local
        toast.warning('IA não disponível. Usando variações locais.')
        const variations = generateTypedVariations(mensagem, totalDestinatarios)
        const safeVariations = variations.map(v => typeof v === 'string' ? v : String(v || ''))
        setVariationsPreview(safeVariations)
        
        variationsProgress.finishGeneration()
        setVariationsStatus({
          open: true,
          status: 'success',
          details: {
            totalVariations: totalDestinatarios,
            generatedVariations: totalDestinatarios,
            messageType: detectMessageType(mensagem)
          }
        })
      } else {
        toast.error('Falha ao gerar variações com IA. Usando método local.')
        const variations = generateTypedVariations(mensagem, totalDestinatarios)
        const safeVariations = variations.map(v => typeof v === 'string' ? v : String(v || ''))
        setVariationsPreview(safeVariations)
        
        variationsProgress.finishGeneration()
        setVariationsStatus({
          open: true,
          status: 'success',
          details: {
            totalVariations: totalDestinatarios,
            generatedVariations: totalDestinatarios,
            messageType: detectMessageType(mensagem)
          }
        })
      }
    } catch (e) {
      toast.error('Erro de rede/IA. Usando método local.')
      const variations = generateTypedVariations(mensagem, totalDestinatarios)
      const safeVariations = variations.map(v => typeof v === 'string' ? v : String(v || ''))
      setVariationsPreview(safeVariations)
      
      variationsProgress.finishGeneration()
      setVariationsStatus({
        open: true,
        status: 'success',
        details: {
          totalVariations: totalDestinatarios,
          generatedVariations: totalDestinatarios,
          messageType: detectMessageType(mensagem)
        }
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handlePreviewVariation = (variation: string) => {
    setMensagem(variation)
    setPreviewMode(true)
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

    if (!selectedInstance && !useRandomDistribution) {
      toast.error('Selecione uma instância WhatsApp ou habilite o balanceamento automático')
      return
    }

    setLoading(true)
    
    const totalDestinatarios = activeTab === 'clientes' 
      ? selectedClientes.length 
      : numerosProcessados.length

    // Iniciar progresso em tempo real
    sendingProgress.startSending(
      totalDestinatarios,
      useRandomDistribution ? 'Balanceamento automático' : 'Instância específica',
      useRandomDistribution ? 'Balanceamento automático' : selectedInstance
    )
    
    // Iniciar progresso em tempo real via API
    realtimeProgress.startProgress(totalDestinatarios)
    
    // Mostrar status de envio
    setSendingStatus({
      open: true,
      status: 'sending',
      details: {
        totalMessages: totalDestinatarios,
        sentMessages: 0,
        failedMessages: 0,
        instanceName: useRandomDistribution ? 'Balanceamento automático' : selectedInstance,
        distributionMethod: useRandomDistribution ? 'Balanceamento automático' : 'Instância específica'
      }
    })

    try {
      const totalDestinatarios = activeTab === 'clientes' 
        ? selectedClientes.length 
        : numerosProcessados.length

      // Gerar variações se ativado
      let messagesToSend: string[] = []
      
      if (enableVariations && totalDestinatarios > 1) {
        // Gerar variações para cada destinatário
        const variations = generateTypedVariations(mensagem, totalDestinatarios)
        messagesToSend = variations
        console.log('🎨 Variações geradas no frontend:', messagesToSend.length)
        console.log('🎨 Primeira variação:', messagesToSend[0] ? messagesToSend[0].substring(0, 50) + '...' : 'Nenhuma')
      } else {
        // Usar a mesma mensagem para todos
        messagesToSend = Array(totalDestinatarios).fill(mensagem)
        console.log('📝 Usando mensagem original para todos')
      }

      // Preparar telefones para envio
      const telefones = activeTab === 'clientes' 
        ? selectedClientes.map(id => {
            const cliente = (clientes || []).find(c => c.id === id)
            return cliente?.telefone || ''
          }).filter(telefone => telefone)
        : numerosProcessados

      // Enviar via API real
      const response = await fetch('/api/disparos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefones,
          mensagem,
          messageVariations: enableVariations && totalDestinatarios > 1 ? messagesToSend : undefined,
          agendamento: agendamento ? `${agendamento}T${agendamentoHora || '00:00'}` : null,
          user_id: user?.id,
          instanceName: useRandomDistribution ? null : selectedInstance, // Usar instância ou modo aleatório
          useRandomDistribution,
          timeControl: {
            delayMinutes: timeControlConfig.delayMinutes,
            delaySeconds: timeControlConfig.delaySeconds,
            totalTimeHours: timeControlConfig.totalTimeHours,
            totalTimeMinutes: timeControlConfig.totalTimeMinutes
          },
          humanizeConversation: true
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Atualizar status para sucesso
        setSendingStatus({
          open: true,
          status: 'success',
          details: {
            totalMessages: totalDestinatarios,
            sentMessages: totalDestinatarios,
            failedMessages: 0,
            instanceName: useRandomDistribution ? 'Balanceamento automático' : selectedInstance,
            distributionMethod: useRandomDistribution ? 'Balanceamento automático' : 'Instância específica'
          }
        })

        const variationText = enableVariations && totalDestinatarios > 1 
          ? ` com ${messagesToSend.length} variações diferentes` 
          : ''
        
        const instanceText = data.stats?.connectedInstances > 0 
          ? ` distribuído(s) entre ${data.stats.connectedInstances} instância(s) conectada(s)` 
          : ''

        toast.success(`${totalDestinatarios} mensagem(ns) enviada(s) com sucesso${variationText}${instanceText}!`)
        
        // Verificar se há resumo disponível
        if (data.summary) {
          console.log('📊 Resumo disponível:', data.summary)
          setDisparoSummary(data.summary)
          setShowSummary(true)
        } else {
          // Fechar o modal após um delay para mostrar o sucesso
          setTimeout(() => {
            onClose()
            setSendingStatus({ open: false, status: 'sending' })
          }, 2000)
        }
      } else {
        // Mostrar erro amigável
        setSendingStatus({
          open: true,
          status: 'error',
          details: {
            totalMessages: totalDestinatarios,
            sentMessages: 0,
            failedMessages: totalDestinatarios,
            instanceName: useRandomDistribution ? 'Balanceamento automático' : selectedInstance,
            distributionMethod: useRandomDistribution ? 'Balanceamento automático' : 'Instância específica'
          }
        })
        
        setErrorOverlay({
          open: true,
          title: 'Erro ao Enviar Mensagens',
          message: data.error || 'Ocorreu um erro inesperado ao enviar as mensagens. Verifique sua conexão e tente novamente.'
        })
        return
      }
      
      // Reset form
      setSelectedClientes([])
      setNovosNumeros('')
      setMensagem('')
      setAgendamento('')
      setAgendamentoHora('')
      setPreviewMode(false)
      setVariationsPreview([])
    } catch (error) {
      // Mostrar erro amigável
      setSendingStatus({
        open: true,
        status: 'error',
        details: {
          totalMessages: activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length,
          sentMessages: 0,
          failedMessages: activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length,
          instanceName: useRandomDistribution ? 'Balanceamento automático' : selectedInstance,
          distributionMethod: useRandomDistribution ? 'Balanceamento automático' : 'Instância específica'
        }
      })
      
      setErrorOverlay({
        open: true,
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 flex items-center">
                    <PaperAirplaneIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Disparo de Mensagens WhatsApp
                  </h3>
                  <p className="text-sm text-secondary-500">
                    Envie mensagens para clientes cadastrados ou novos números
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

          {/* Informações das Instâncias */}
          {instanceStats && typeof instanceStats === 'object' && instanceStats.total !== undefined && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">
                      {instanceStats.connected || 0} conectada(s)
                    </span>
                  </div>
                  {instanceStats.disconnected > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">
                        {instanceStats.disconnected || 0} desconectada(s)
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-blue-600">
                  Distribuição: Aleatória
                </div>
              </div>
              {instanceStats.connected === 0 && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Nenhuma instância conectada. Configure uma instância em Configurações.
                  </p>
                </div>
              )}
            </div>
          )}

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

            {/* Seleção de Instância */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Instância WhatsApp
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-secondary-500">
                    {instanceStats?.connected || 0} de {instanceStats?.total || 0} instâncias conectadas
                  </span>
                  <span className="text-xs text-blue-500">
                    (Debug: {instances.length} instâncias carregadas)
                  </span>
                </div>

                {/* Modo de Distribuição */}
                <div className="space-y-3">
                  {/* Opção 1: Instância Específica */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="specific-instance"
                      name="distribution-mode"
                      checked={!useRandomDistribution}
                      onChange={() => {
                        setUseRandomDistribution(false)
                        if (instances.filter(i => i.connectionStatus === 'connected').length > 0) {
                          setSelectedInstance(instances.filter(i => i.connectionStatus === 'connected')[0].instanceName)
                        }
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="specific-instance" className="text-sm text-secondary-700">
                      Usar instância específica
                    </label>
                  </div>

                  {/* Opção 2: Balanceamento Automático */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="random-distribution"
                      name="distribution-mode"
                      checked={useRandomDistribution}
                      onChange={() => {
                        setUseRandomDistribution(true)
                        setSelectedInstance('')
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="random-distribution" className="text-sm text-secondary-700">
                      Balanceamento automático entre instâncias
                    </label>
                  </div>
                </div>

                {/* Seletor de Instância (só aparece se não for modo aleatório) */}
                {!useRandomDistribution && (
                  <div className="mt-3">
                    <select
                      value={selectedInstance}
                      onChange={(e) => setSelectedInstance(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione uma instância</option>
                      {instances.map(instance => {
                        const isConnected = instance.connectionStatus === 'connected'
                        console.log('🔄 Renderizando opção de instância:', {
                          name: instance.instanceName,
                          status: instance.connectionStatus,
                          isConnected,
                          profile: instance.profile
                        })
                        return (
                          <option 
                            key={instance.instanceName} 
                            value={instance.instanceName}
                            disabled={!isConnected}
                          >
                            {instance.profile?.userName || instance.instanceName} 
                            {instance.profile?.userPhone && ` (${instance.profile.userPhone})`}
                            {!isConnected && ' - Desconectada'}
                          </option>
                        )
                      })}
                    </select>
                    {/* Debug info */}
                    <div className="mt-2 text-xs text-gray-500">
                      Debug: {instances.length} instâncias totais, {instances.filter(i => i.connectionStatus === 'connected').length} conectadas
                    </div>
                    {instances.filter(i => i.connectionStatus === 'connected').length === 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        ⚠️ Nenhuma instância conectada. Conecte uma instância em Configurações ou use o balanceamento automático.
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagens de Status */}
                {useRandomDistribution && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-xs text-blue-700">
                        As mensagens serão distribuídas automaticamente entre todas as instâncias conectadas
                      </p>
                    </div>
                  </div>
                )}

                {!instanceStats?.connected && !useRandomDistribution && (
                  <p className="text-xs text-error-600 mt-1">
                    Nenhuma instância conectada. Habilite o balanceamento automático ou configure uma instância em Configurações.
                  </p>
                )}
              </div>
            </div>

            {/* Configurações de Variações */}
            {variationsPreview.length > 0 && Array.isArray(variationsPreview) && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-secondary-700 flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Variações Geradas ({variationsPreview.length})
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-secondary-500">
                      Tipo detectado: <span className="font-medium capitalize">{messageType}</span>
                    </span>
                    <button
                      onClick={() => setVariationsPreview([])}
                      className="text-xs text-secondary-500 hover:text-secondary-700"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-md">
                  {variationsPreview.map((variation, index) => {
                    // Verificar se é uma string válida
                    const safeVariation = typeof variation === 'string' ? variation : String(variation || '')
                    console.log(`🔍 Variação ${index + 1}:`, { variation, type: typeof variation, safeVariation })
                    
                    return (
                      <div key={index} className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xs text-secondary-500 mb-1">
                              Variação {index + 1}
                            </div>
                            <div className="text-sm text-secondary-900 whitespace-pre-wrap">
                              {safeVariation}
                            </div>
                          </div>
                          <button
                            onClick={() => handlePreviewVariation(safeVariation)}
                            className="ml-2 text-primary-600 hover:text-primary-800 text-xs"
                          >
                            <EyeIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
              
              {enableVariations && (
                <div className="p-4 bg-secondary-50 border border-secondary-200 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Tipo de Mensagem
                      </label>
                      <select
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value as any)}
                        className="input w-full"
                      >
                        <option value="pessoal">Pessoal</option>
                        <option value="promocional">Promocional</option>
                        <option value="informativa">Informativa</option>
                        <option value="comercial">Comercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Intensidade das Variações
                      </label>
                      <select className="input w-full" defaultValue="media">
                        <option value="baixa">Baixa (mudanças sutis)</option>
                        <option value="media">Média (variações moderadas)</option>
                        <option value="alta">Alta (variações significativas)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    As variações serão aplicadas automaticamente para evitar que a mesma mensagem seja enviada 
                    literalmente para vários destinatários, mantendo o contexto mas com pequenas diferenças.
                  </p>
                </div>
              )}
            </div>

            {/* Controle de Tempo */}
            <div className="mt-6">
            <TimeControl
              totalDestinatarios={activeTab === 'clientes' ? selectedClientes.length : numerosProcessados.length}
              totalInstancias={instanceStats?.connected || 0}
              onConfigChange={setTimeControlConfig}
              disabled={loading}
              messageType={messageType}
            />
            </div>

            {/* Agendamento */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                Agendamento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={agendamento}
                    onChange={(e) => setAgendamento(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={agendamentoHora}
                    onChange={(e) => setAgendamentoHora(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-secondary-500 flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                Deixe em branco para envio imediato
              </p>
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
      
      {/* Error Overlay */}
      <ErrorOverlay
        open={errorOverlay.open}
        title={errorOverlay.title}
        message={errorOverlay.message}
        onClose={() => setErrorOverlay({ open: false, title: '', message: '' })}
      />
      
      {/* Sending Status Overlay */}
      <SendingStatusOverlay
        open={sendingStatus.open}
        status={sendingStatus.status}
        details={{
          ...sendingStatus.details,
          ...sendingProgress.state.progress,
          ...realtimeProgress.progress,
          currentMessage: realtimeProgress.progress?.currentMessage || sendingProgress.state.progress.currentMessage,
          currentPhone: realtimeProgress.progress?.currentPhone || sendingProgress.state.progress.currentPhone,
          currentInstance: realtimeProgress.progress?.currentInstance || sendingProgress.state.progress.currentInstance,
          progress: realtimeProgress.progress?.progress || sendingProgress.state.progress.progress,
          estimatedTime: realtimeProgress.progress?.estimatedTime
        }}
        onClose={() => {
          setSendingStatus({ open: false, status: 'sending' })
          sendingProgress.reset()
          realtimeProgress.clear()
        }}
      />
      
      {/* Variations Generation Overlay */}
      <VariationsGenerationOverlay
        open={variationsStatus.open}
        status={variationsStatus.status}
        details={{
          ...variationsStatus.details,
          ...variationsProgress.state.progress,
          currentVariation: variationsProgress.state.progress.currentVariation,
          progress: variationsProgress.state.progress.generatedVariations
        }}
        onClose={() => {
          setVariationsStatus({ open: false, status: 'generating' })
          variationsProgress.reset()
        }}
      />

      {/* Disparo Summary Modal */}
      <DisparoSummaryModal
        isOpen={showSummary}
        onClose={() => {
          setShowSummary(false)
          setDisparoSummary(null)
          onClose()
          setSendingStatus({ open: false, status: 'sending' })
        }}
        summary={disparoSummary}
      />
    </div>
  )
}
