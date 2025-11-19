'use client'

import { useState, useEffect } from 'react'
import {
  PaperClipIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  ClockIcon,
  XMarkIcon,
  CogIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { useAlertContext } from '@/lib/contexts/AlertContext'
import SuccessModal from './SuccessModal'
import ConfirmModal from './ConfirmModal'

interface TelegramBot {
  id?: string
  nome: string
  bot_token: string
  bot_username?: string
  numero_remetente?: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
  status_info?: {
    valid: boolean
    username?: string
    lastTest?: string
    error?: string
  }
}

interface Props {
  userId: string
}

export default function TelegramBotsManager({ userId }: Props) {
  const { showSuccess, showError } = useAlertContext()
  const [bots, setBots] = useState<TelegramBot[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null)
  const [testingBot, setTestingBot] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Carregar lista de bots
  const loadBots = async () => {
    try {
      const response = await fetch('/api/telegram/bots')
      if (response.ok) {
        const data = await response.json()
        setBots(data.bots || [])
      }
    } catch (error) {
      console.error('Erro ao carregar bots do Telegram:', error)
      showError('Erro ao carregar bots do Telegram')
    }
  }

  useEffect(() => {
    if (userId) {
      loadBots()
    }
  }, [userId])

  // Abrir modal para adicionar novo bot
  const handleAdd = () => {
    setEditingBot({
      nome: '',
      bot_token: '',
      bot_username: '',
      numero_remetente: '',
      status: 'active'
    })
    setShowModal(true)
  }

  // Abrir modal para editar bot
  const handleEdit = (bot: TelegramBot) => {
    setEditingBot({ ...bot })
    setShowModal(true)
  }

  // Deletar bot
  const handleDelete = async (botId: string) => {
    if (!confirm('Tem certeza que deseja excluir este bot?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/telegram/bots/${botId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Bot excluído com sucesso!')
        loadBots()
      } else {
        const data = await response.json()
        showError(data.error || 'Erro ao excluir bot')
      }
    } catch (error) {
      console.error('Erro ao excluir bot:', error)
      showError('Erro ao excluir bot')
    } finally {
      setLoading(false)
    }
  }

  // Salvar bot (criar ou atualizar)
  const handleSave = async () => {
    if (!editingBot) return

    if (!editingBot.nome || !editingBot.bot_token) {
      showError('Nome e Token do Bot são obrigatórios')
      return
    }

    try {
      setLoading(true)
      const url = editingBot.id 
        ? `/api/telegram/bots/${editingBot.id}`
        : '/api/telegram/bots'

      const response = await fetch(url, {
        method: editingBot.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editingBot.nome,
          bot_token: editingBot.bot_token,
          bot_username: editingBot.bot_username || '',
          numero_remetente: editingBot.numero_remetente || '',
          status: editingBot.status
        })
      })

      if (response.ok) {
        setSuccessMessage(editingBot.id ? 'Bot atualizado com sucesso!' : 'Bot criado com sucesso!')
        setShowSuccessModal(true)
        setShowModal(false)
        setEditingBot(null)
        loadBots()
      } else {
        const data = await response.json()
        showError(data.error || 'Erro ao salvar bot')
      }
    } catch (error) {
      console.error('Erro ao salvar bot:', error)
      showError('Erro ao salvar bot')
    } finally {
      setLoading(false)
    }
  }

  // Testar bot
  const handleTest = async (bot: TelegramBot) => {
    try {
      setTestingBot(bot.id || '')
      const response = await fetch('/api/telegram/bots/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: bot.bot_token })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Atualizar bot com informações obtidas
        setBots(prev => prev.map(b => 
          b.id === bot.id 
            ? {
                ...b,
                bot_username: data.bot_info?.username || b.bot_username,
                status_info: {
                  valid: true,
                  username: data.bot_info?.username,
                  lastTest: new Date().toISOString()
                }
              }
            : b
        ))
        showSuccess('Bot testado com sucesso!')
      } else {
        setBots(prev => prev.map(b => 
          b.id === bot.id 
            ? {
                ...b,
                status_info: {
                  valid: false,
                  error: data.error || 'Erro ao testar bot',
                  lastTest: new Date().toISOString()
                }
              }
            : b
        ))
        showError(data.error || 'Erro ao testar bot')
      }
    } catch (error) {
      console.error('Erro ao testar bot:', error)
      showError('Erro ao testar bot')
      setBots(prev => prev.map(b => 
        b.id === bot.id 
          ? {
              ...b,
              status_info: {
                valid: false,
                error: 'Erro de conexão',
                lastTest: new Date().toISOString()
              }
            }
          : b
      ))
    } finally {
      setTestingBot(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
          <PaperClipIcon className="h-5 w-5 mr-2" />
          Gerenciamento de Bots do Telegram
        </h3>
        <button
          onClick={handleAdd}
          className="btn btn-primary btn-sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Bot
        </button>
      </div>

      {/* Lista de Bots */}
      {bots.length === 0 ? (
        <div className="text-center py-8">
          <PaperClipIcon className="h-12 w-12 text-secondary-400 dark:text-secondary-600 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">Nenhum bot do Telegram configurado</p>
          <button onClick={handleAdd} className="btn btn-primary btn-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Primeiro Bot
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                      {bot.nome}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bot.status === 'active'
                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                        : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}>
                      {bot.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                    {bot.status_info?.valid !== undefined && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bot.status_info.valid
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300'
                      }`}>
                        {bot.status_info.valid ? '✓ Válido' : '✗ Inválido'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                    {bot.bot_username && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Username:</span>
                        <span>@{bot.bot_username}</span>
                      </div>
                    )}
                    {bot.numero_remetente && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Número Remetente:</span>
                        <span>{bot.numero_remetente}</span>
                      </div>
                    )}
                    {bot.status_info?.lastTest && (
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Último teste:</span>
                        <span>{new Date(bot.status_info.lastTest).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  {bot.status_info?.error && (
                    <div className="mt-2 text-xs text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-2 rounded">
                      {bot.status_info.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleTest(bot)}
                    disabled={testingBot === bot.id || loading}
                    className="btn btn-secondary btn-sm"
                    title="Testar Bot"
                  >
                    {testingBot === bot.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-600"></div>
                    ) : (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(bot)}
                    className="btn btn-secondary btn-sm"
                    title="Editar Bot"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => bot.id && handleDelete(bot.id)}
                    className="btn btn-error btn-sm"
                    title="Excluir Bot"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Bot */}
      {showModal && editingBot && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70" onClick={() => setShowModal(false)} />
            <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              {/* Header da Modal com Título e Subtítulo */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      {editingBot.id ? (
                        <PencilIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <PlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                        {editingBot.id ? 'Editar Bot' : 'Adicionar Bot'}
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        {editingBot.id 
                          ? 'Atualize as informações do bot do Telegram'
                          : 'Configure um novo bot do Telegram para envio de mensagens'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Nome do Bot *
                  </label>
                  <input
                    type="text"
                    value={editingBot.nome}
                    onChange={(e) => setEditingBot({ ...editingBot, nome: e.target.value })}
                    placeholder="Ex: Bot Principal, Bot Marketing, etc."
                    className="input w-full"
                  />
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    Nome identificador para o bot (apenas para organização interna)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Token do Bot *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={editingBot.bot_token}
                      onChange={(e) => setEditingBot({ ...editingBot, bot_token: e.target.value })}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="input flex-1"
                    />
                    <KeyIcon className="h-5 w-5 text-secondary-400 dark:text-secondary-500" />
                  </div>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    Token do bot obtido do @BotFather no Telegram
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Username do Bot (opcional)
                    </label>
                    <input
                      type="text"
                      value={editingBot.bot_username || ''}
                      onChange={(e) => setEditingBot({ ...editingBot, bot_username: e.target.value })}
                      placeholder="Ex: meu_bot"
                      className="input w-full"
                    />
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      Será detectado automaticamente ao testar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Número Remetente (opcional)
                    </label>
                    <input
                      type="text"
                      value={editingBot.numero_remetente || ''}
                      onChange={(e) => setEditingBot({ ...editingBot, numero_remetente: e.target.value })}
                      placeholder="Ex: +5511999999999"
                      className="input w-full"
                    />
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      Número/identificador para facilitar seleção nos disparos
                    </p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingBot.status === 'active'}
                      onChange={(e) => setEditingBot({ 
                        ...editingBot, 
                        status: e.target.checked ? 'active' : 'inactive' 
                      })}
                      className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-700"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Bot ativo (disponível para uso em disparos)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary btn-sm flex items-center gap-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !editingBot.nome || !editingBot.bot_token}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : editingBot.id ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      Criar Bot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: () => {} })}
      />

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

