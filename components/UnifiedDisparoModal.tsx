'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  UserGroupIcon,
  PhoneIcon,
  DocumentTextIcon,
  EyeIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CloudIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import { Cliente } from '@/lib/supabase'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils'
import { generateTypedVariations, detectMessageType } from '@/lib/messageVariations'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import DispatchMethodSelector, { DispatchMethod } from './DispatchMethodSelector'
import { UnifiedDispatchService, InstanceInfo } from '@/lib/unified-dispatch-service'
import LoadingOverlay from './LoadingOverlay'

interface UnifiedDisparoModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
  defaultMethod?: DispatchMethod
}

export default function UnifiedDisparoModal({ 
  isOpen, 
  onClose, 
  clientes,
  defaultMethod = 'evolution'
}: UnifiedDisparoModalProps) {
  const { user } = useAuth()
  
  // Estado do método de envio
  const [dispatchMethod, setDispatchMethod] = useState<DispatchMethod>(defaultMethod)
  
  // Estados de seleção de destinatários
  const [activeTab, setActiveTab] = useState<'clientes' | 'novos'>('clientes')
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [novosNumeros, setNovosNumeros] = useState<string>('')
  
  // Estados de instâncias/sessões
  const [instances, setInstances] = useState<InstanceInfo[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [useLoadBalancing, setUseLoadBalancing] = useState<boolean>(false)
  const [instanceStats, setInstanceStats] = useState<{
    total: number
    connected: number
    disconnected: number
  } | null>(null)
  
  // Estados da mensagem
  const [mensagem, setMensagem] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  
  // Estados de variações
  const [enableVariations, setEnableVariations] = useState(true)
  const [useAI, setUseAI] = useState(false)
  const [variationsPreview, setVariationsPreview] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  // Carregar instâncias/sessões quando o modal abrir ou método mudar
  useEffect(() => {
    if (isOpen && user?.id) {
      loadInstancesOrSessions()
    }
  }, [isOpen, dispatchMethod, user?.id])

  const loadInstancesOrSessions = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      console.log(`🔄 Carregando ${dispatchMethod === 'evolution' ? 'instâncias' : 'sessões'}...`)
      
      const stats = await UnifiedDispatchService.getStats(dispatchMethod, user.id)
      setInstanceStats({
        total: stats.total,
        connected: stats.connected,
        disconnected: stats.disconnected
      })
      setInstances(stats.instances)
      
      // Selecionar primeira instância/sessão conectada automaticamente
      const connectedInstances = stats.instances.filter(inst => 
        inst.status === 'open' || 
        inst.status === 'WORKING' || 
        inst.status === 'CONNECTED'
      )
      
      if (connectedInstances.length > 0) {
        setSelectedInstance(connectedInstances[0].id)
        setUseLoadBalancing(false)
      } else if (stats.total > 1) {
        // Se há múltiplas instâncias mas nenhuma conectada, sugerir load balancing
        setUseLoadBalancing(true)
        setSelectedInstance('')
      } else {
        setUseLoadBalancing(false)
        setSelectedInstance('')
      }
      
      console.log(`✅ ${stats.total} ${dispatchMethod === 'evolution' ? 'instância(s)' : 'sessão(ões)'} carregada(s), ${stats.connected} conectada(s)`)
    } catch (error) {
      console.error('❌ Erro ao carregar instâncias/sessões:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
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

    if (useAI) {
      setAiLoading(true)
      try {
        const response = await fetch('/api/ai/variacoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mensagem,
            quantidade: Math.min(totalDestinatarios, 50) // Limitar para evitar custos excessivos
          }),
        })

        const data = await response.json()

        if (data.success && data.variacoes) {
          setVariationsPreview(data.variacoes)
          toast.success(`${data.variacoes.length} variações geradas com IA!`)
        } else {
          toast.error('Erro ao gerar variações com IA')
        }
      } catch (error) {
        console.error('Erro ao gerar variações com IA:', error)
        toast.error('Erro ao gerar variações com IA')
      } finally {
        setAiLoading(false)
      }
    } else {
      // Gerar variações localmente
      const variations = generateTypedVariations(mensagem, totalDestinatarios)
      setVariationsPreview(variations)
      toast.success(`${variations.length} variações geradas!`)
    }
  }

  const handleEnviar = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    // Validações
    if (!isMensagemValida) {
      toast.error('Digite uma mensagem válida')
      return
    }

    // Preparar lista de telefones
    let telefones: string[] = []
    if (activeTab === 'clientes') {
      if (selectedClientes.length === 0) {
        toast.error('Selecione pelo menos um cliente')
        return
      }
      telefones = selectedClientes
        .map(id => clientes.find(c => c.id === id)?.telefone)
        .filter(tel => tel && validatePhoneNumber(tel)) as string[]
    } else {
      if (numerosProcessados.length === 0) {
        toast.error('Digite pelo menos um número válido')
        return
      }
      telefones = numerosProcessados
    }

    if (telefones.length === 0) {
      toast.error('Nenhum telefone válido encontrado')
      return
    }

    // Validar método selecionado
    const validation = await UnifiedDispatchService.validateMethod(dispatchMethod, user.id)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    // Validar instância/sessão selecionada (se não for load balancing)
    if (!useLoadBalancing && !selectedInstance) {
      toast.error(`Selecione uma ${dispatchMethod === 'evolution' ? 'instância' : 'sessão'}`)
      return
    }

    setLoading(true)
    try {
      const result = await UnifiedDispatchService.dispatch({
        method: dispatchMethod,
        telefones,
        mensagem,
        messageVariations: variationsPreview,
        enableVariations: enableVariations && variationsPreview.length > 0,
        useAI,
        userId: user.id,
        useLoadBalancing,
        selectedInstanceOrSession: selectedInstance
      })

      if (result.success) {
        toast.success(result.message)
        
        // Limpar formulário
        setSelectedClientes([])
        setNovosNumeros('')
        setMensagem('')
        setVariationsPreview([])
        setUploadedFile(null)
        
        // Fechar modal
        onClose()
      } else {
        toast.error(result.message || 'Erro ao enviar mensagens')
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar:', error)
      toast.error(error.message || 'Erro ao enviar mensagens')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Resetar estados
    setDispatchMethod(defaultMethod)
    setActiveTab('clientes')
    setSelectedClientes([])
    setNovosNumeros('')
    setMensagem('')
    setVariationsPreview([])
    setPreviewMode(false)
    setUploadedFile(null)
    setEnableVariations(true)
    setUseAI(false)
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary-900">
                {previewMode ? 'Preview da Mensagem' : 'Novo Disparo'}
              </h2>
              <button
                onClick={handleClose}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!previewMode ? (
                <div className="space-y-6">
                  {/* Seletor de Método */}
                  <DispatchMethodSelector
                    value={dispatchMethod}
                    onChange={setDispatchMethod}
                  />

                  {/* Estatísticas */}
                  {instanceStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                        <div className="text-2xl font-bold text-secondary-900">{instanceStats.total}</div>
                        <div className="text-sm text-secondary-600">Total</div>
                      </div>
                      <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                        <div className="text-2xl font-bold text-success-900">{instanceStats.connected}</div>
                        <div className="text-sm text-success-600">Conectadas</div>
                      </div>
                      <div className="p-4 bg-error-50 rounded-lg border border-error-200">
                        <div className="text-2xl font-bold text-error-900">{instanceStats.disconnected}</div>
                        <div className="text-sm text-error-600">Desconectadas</div>
                      </div>
                    </div>
                  )}

                  {/* Seleção de Instância/Sessão */}
                  {instanceStats && instanceStats.total > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-secondary-700">
                        {dispatchMethod === 'evolution' ? 'Instância' : 'Sessão'}
                      </label>
                      
                      {/* Toggle Load Balancing */}
                      {instanceStats.connected > 1 && (
                        <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                          <input
                            type="checkbox"
                            id="loadBalancing"
                            checked={useLoadBalancing}
                            onChange={(e) => {
                              setUseLoadBalancing(e.target.checked)
                              if (e.target.checked) {
                                setSelectedInstance('')
                              }
                            }}
                            className="rounded border-secondary-300"
                          />
                          <label htmlFor="loadBalancing" className="text-sm text-secondary-700">
                            Usar distribuição automática entre {instanceStats.connected} {dispatchMethod === 'evolution' ? 'instâncias' : 'sessões'}
                          </label>
                        </div>
                      )}

                      {/* Select de Instância/Sessão */}
                      {!useLoadBalancing && (
                        <select
                          value={selectedInstance}
                          onChange={(e) => setSelectedInstance(e.target.value)}
                          className="w-full rounded-lg border-secondary-300"
                        >
                          <option value="">Selecione...</option>
                          {instances
                            .filter(inst => inst.status === 'open' || inst.status === 'WORKING' || inst.status === 'CONNECTED')
                            .map(inst => (
                              <option key={inst.id} value={inst.id}>
                                {inst.displayName} {inst.phoneNumber && `- ${inst.phoneNumber}`}
                              </option>
                            ))
                          }
                        </select>
                      )}
                    </div>
                  )}

                  {/* Tabs de Destinatários */}
                  <div>
                    <div className="flex space-x-4 border-b border-secondary-200">
                      <button
                        onClick={() => setActiveTab('clientes')}
                        className={`pb-3 px-1 ${activeTab === 'clientes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-600'}`}
                      >
                        <UserGroupIcon className="h-5 w-5 inline mr-2" />
                        Clientes ({selectedClientes.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('novos')}
                        className={`pb-3 px-1 ${activeTab === 'novos' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-600'}`}
                      >
                        <PhoneIcon className="h-5 w-5 inline mr-2" />
                        Novos Números ({numerosProcessados.length})
                      </button>
                    </div>

                    <div className="mt-4">
                      {activeTab === 'clientes' ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-secondary-600">
                              {selectedClientes.length} de {clientes.length} selecionados
                            </span>
                            <button
                              onClick={handleSelectAll}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              {selectedClientes.length === clientes.length ? 'Desmarcar todos' : 'Selecionar todos'}
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-lg">
                            {clientes.map(cliente => (
                              <label
                                key={cliente.id}
                                className="flex items-center p-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-b-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedClientes.includes(cliente.id)}
                                  onChange={() => handleSelectCliente(cliente.id)}
                                  className="rounded border-secondary-300"
                                />
                                <span className="ml-3 text-sm text-secondary-900">
                                  {cliente.nome} - {formatPhoneNumber(cliente.telefone)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={novosNumeros}
                            onChange={(e) => setNovosNumeros(e.target.value)}
                            placeholder="Digite os números (um por linha ou separados por vírgula)&#10;Exemplo:&#10;5511999999999&#10;5521988888888"
                            rows={6}
                            className="w-full rounded-lg border-secondary-300"
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary-600">
                              {numerosProcessados.length} número(s) válido(s)
                            </span>
                            <label className="btn btn-secondary btn-sm cursor-pointer">
                              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                              Importar CSV
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {uploadedFile && (
                            <div className="text-sm text-success-600">
                              ✓ Arquivo carregado: {uploadedFile.name}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mensagem */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-secondary-700">
                      Mensagem
                    </label>
                    <textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Digite sua mensagem aqui..."
                      rows={6}
                      maxLength={1600}
                      className="w-full rounded-lg border-secondary-300"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className={caracteresRestantes < 100 ? 'text-warning-600' : 'text-secondary-600'}>
                        {caracteresRestantes} caracteres restantes
                      </span>
                      <button
                        onClick={handlePreview}
                        disabled={!isMensagemValida}
                        className="btn btn-secondary btn-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Variações */}
                  <div className="space-y-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enableVariations}
                          onChange={(e) => setEnableVariations(e.target.checked)}
                          className="rounded border-secondary-300"
                        />
                        <span className="text-sm font-medium text-secondary-700">
                          Gerar variações de mensagem
                        </span>
                      </label>
                      {enableVariations && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={useAI}
                            onChange={(e) => setUseAI(e.target.checked)}
                            className="rounded border-secondary-300"
                          />
                          <span className="text-sm text-secondary-700">
                            Usar IA (Gemini)
                          </span>
                        </label>
                      )}
                    </div>

                    {enableVariations && (
                      <>
                        <button
                          onClick={handleGenerateVariations}
                          disabled={!isMensagemValida || aiLoading}
                          className="btn btn-secondary btn-sm w-full"
                        >
                          {aiLoading ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Gerar Variações
                            </>
                          )}
                        </button>

                        {variationsPreview.length > 0 && (
                          <div className="mt-3 text-sm text-success-600">
                            ✓ {variationsPreview.length} variações geradas
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Preview Mode
                <div className="space-y-4">
                  <div className="p-6 bg-secondary-50 rounded-lg border border-secondary-200">
                    <div className="whitespace-pre-wrap text-secondary-900">
                      {mensagem}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="btn btn-secondary"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!previewMode && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 bg-secondary-50">
                <button
                  onClick={handleClose}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={loading || !isMensagemValida}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Enviar Mensagens
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        open={loading}
        title="Enviando mensagens..."
        message={`Enviando via ${dispatchMethod === 'evolution' ? 'Evolution API' : 'WAHA API'}`}
      />
    </>
  )
}

