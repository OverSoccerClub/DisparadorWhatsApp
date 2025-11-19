'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  MegaphoneIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import WhatsAppPreview from './WhatsAppPreview'
import { 
  CampanhaCriterios, 
  CampanhaConfiguracao, 
  CriarCampanhaRequest 
} from '@/lib/campaignTypes'
import toast from 'react-hot-toast'

interface CampanhaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CampanhaModal({ isOpen, onClose, onSuccess }: CampanhaModalProps) {
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    totalClientes: number
    totalLotes: number
    tempoEstimado: number
  } | null>(null)

  const [formData, setFormData] = useState<CriarCampanhaRequest>({
    nome: '',
    mensagem: '',
    criterios: {
      status: 'ativo'
    },
    configuracao: {
      clientesPorLote: 100,
      intervaloMensagens: 10,
      agendamento: 'imediato'
    }
  })

  const [agendamentoData, setAgendamentoData] = useState('')
  const [agendamentoHora, setAgendamentoHora] = useState('')

  // Calcular preview quando critérios mudarem
  useEffect(() => {
    if (formData.criterios.status) {
      calcularPreview()
    }
  }, [formData.criterios.status, formData.configuracao.clientesPorLote])

  const calcularPreview = async () => {
    try {
      // Simular busca de clientes (em produção viria da API)
      const totalClientes = formData.criterios.status === 'todos' ? 1000000 : 500000
      const totalLotes = Math.ceil(totalClientes / formData.configuracao.clientesPorLote)
      const tempoEstimado = Math.ceil((totalLotes * formData.configuracao.intervaloMensagens) / 60)

      setPreviewData({
        totalClientes,
        totalLotes,
        tempoEstimado
      })
    } catch (error) {
      console.error('Erro ao calcular preview:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.mensagem) {
      toast.error('Nome e mensagem são obrigatórios')
      return
    }

    if (formData.mensagem.length > 1000) {
      toast.error('Mensagem deve ter no máximo 1000 caracteres')
      return
    }

    try {
      setLoading(true)

      // Preparar dados para envio
      const dadosEnvio = {
        ...formData,
        configuracao: {
          ...formData.configuracao,
          agendamento: formData.configuracao.agendamento === 'imediato' 
            ? 'imediato' 
            : new Date(`${agendamentoData}T${agendamentoHora}`)
        }
      }

      const response = await fetch('/api/campanhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEnvio),
      })

      const responseData = await response.json()

      if (response.ok && responseData.data) {
        toast.success('Campanha criada com sucesso!', {
          duration: 3000,
        })
        // Pequeno delay para garantir que o toast seja exibido antes de fechar o modal
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 100)
      } else {
        toast.error(responseData.error || 'Erro ao criar campanha', {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao criar campanha')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <MegaphoneIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Nova Campanha de Disparo
              </h2>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                Configure sua campanha de disparo em massa
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome da Campanha */}
          <div>
            <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              <MegaphoneIcon className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" />
              Nome da Campanha *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="input w-full"
              placeholder="Ex: Promoção Black Friday"
            />
          </div>

          {/* Seleção de Clientes */}
          <div>
            <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              <UsersIcon className="h-5 w-5 mr-2 text-secondary-500 dark:text-secondary-400" />
              Seleção de Clientes
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="ativo"
                  checked={formData.criterios.status === 'ativo'}
                  onChange={(e) => setFormData({
                    ...formData,
                    criterios: { ...formData.criterios, status: e.target.value as any }
                  })}
                  className="mr-3"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Todos os clientes ativos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inativo"
                  checked={formData.criterios.status === 'inativo'}
                  onChange={(e) => setFormData({
                    ...formData,
                    criterios: { ...formData.criterios, status: e.target.value as any }
                  })}
                  className="mr-3"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Todos os clientes inativos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="todos"
                  checked={formData.criterios.status === 'todos'}
                  onChange={(e) => setFormData({
                    ...formData,
                    criterios: { ...formData.criterios, status: e.target.value as any }
                  })}
                  className="mr-3"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Todos os clientes</span>
              </label>
            </div>
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <UsersIcon className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" />
                Clientes por Lote
              </label>
              <select
                value={formData.configuracao.clientesPorLote}
                onChange={(e) => setFormData({
                  ...formData,
                  configuracao: { ...formData.configuracao, clientesPorLote: parseInt(e.target.value) }
                })}
                className="input w-full"
              >
                <option value={50}>50 clientes</option>
                <option value={100}>100 clientes</option>
                <option value={200}>200 clientes</option>
                <option value={500}>500 clientes</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <ClockIcon className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" />
                Intervalo entre Mensagens (segundos)
              </label>
              <select
                value={formData.configuracao.intervaloMensagens}
                onChange={(e) => setFormData({
                  ...formData,
                  configuracao: { ...formData.configuracao, intervaloMensagens: parseInt(e.target.value) }
                })}
                className="input w-full"
              >
                <option value={5}>5 segundos</option>
                <option value={10}>10 segundos</option>
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>1 minuto</option>
              </select>
            </div>
          </div>

          {/* Agendamento */}
          <div>
            <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              <CalendarIcon className="h-5 w-5 mr-2 text-secondary-500 dark:text-secondary-400" />
              Agendamento
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="agendamento"
                  value="imediato"
                  checked={formData.configuracao.agendamento === 'imediato'}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: { ...formData.configuracao, agendamento: 'imediato' }
                  })}
                  className="mr-3"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Enviar agora</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="agendamento"
                  value="agendar"
                  checked={formData.configuracao.agendamento !== 'imediato'}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: { ...formData.configuracao, agendamento: 'agendar' as any }
                  })}
                  className="mr-3"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Agendar para:</span>
              </label>
              
              {formData.configuracao.agendamento !== 'imediato' && (
                <div className="ml-6 grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={agendamentoData}
                    onChange={(e) => setAgendamentoData(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    value={agendamentoHora}
                    onChange={(e) => setAgendamentoHora(e.target.value)}
                    className="input"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-secondary-500 dark:text-secondary-400" />
              Mensagem *
            </label>
            <textarea
              required
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              className="input w-full h-32 resize-none"
              placeholder="Digite sua mensagem aqui..."
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                Use variáveis como {`{{nome}}`}, {`{{telefone}}`}
              </span>
              <span className={`text-xs ${formData.mensagem.length > 900 ? 'text-error-600 dark:text-error-400' : 'text-secondary-500 dark:text-secondary-400'}`}>
                {formData.mensagem.length}/1000
              </span>
            </div>
            
            {/* Preview do WhatsApp */}
            {formData.mensagem && (
              <div className="mt-3">
                <WhatsAppPreview 
                  message={formData.mensagem}
                  recipientName="Cliente"
                  recipientPhone="+55 11 99999-9999"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {previewData && (
            <div className="bg-secondary-50 dark:bg-secondary-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3 flex items-center">
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview da Campanha
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-secondary-600 dark:text-secondary-400">Clientes:</span>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">{previewData.totalClientes.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-secondary-600 dark:text-secondary-400">Lotes:</span>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">{previewData.totalLotes}</div>
                </div>
                <div>
                  <span className="text-secondary-600 dark:text-secondary-400">Tempo estimado:</span>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">{previewData.tempoEstimado} min</div>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 dark:focus:ring-secondary-400 transition-all duration-200"
              disabled={loading}
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
