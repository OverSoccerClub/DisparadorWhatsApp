'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { WahaCampaign, WahaCampaignContact } from '@/lib/waha-dispatch-service'
import { WahaLoadBalancer } from '@/lib/waha-load-balancer'

interface WahaCampaignsManagerProps {
  userId: string
}

export default function WahaCampaignsManager({ userId }: WahaCampaignsManagerProps) {
  const [campaigns, setCampaigns] = useState<WahaCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<WahaCampaign | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<WahaCampaign | null>(null)
  const [contacts, setContacts] = useState<WahaCampaignContact[]>([])
  const [showContactsModal, setShowContactsModal] = useState(false)

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    mensagem: '',
    delay_min: 5,
    delay_max: 15,
    messages_per_minute: 10,
    enable_variations: false,
    variation_prompt: '',
    variation_count: 3,
    load_balancing_strategy: 'round_robin' as const
  })

  // Estados para variações
  const [variations, setVariations] = useState<string[]>([])
  const [generatingVariations, setGeneratingVariations] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [userId])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/waha/campaigns')
      const data = await response.json()

      if (data.success) {
        setCampaigns(data.campaigns)
      } else {
        toast.error('Erro ao carregar campanhas')
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
      toast.error('Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/waha/campaigns/contacts?campaignId=${campaignId}`)
      const data = await response.json()

      if (data.success) {
        setContacts(data.contacts)
      } else {
        toast.error('Erro ao carregar contatos')
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast.error('Erro ao carregar contatos')
    }
  }

  const handleAdd = () => {
    setEditingCampaign(null)
    setFormData({
      nome: '',
      descricao: '',
      mensagem: '',
      delay_min: 5,
      delay_max: 15,
      messages_per_minute: 10,
      enable_variations: false,
      variation_prompt: '',
      variation_count: 3,
      load_balancing_strategy: 'round_robin'
    })
    setVariations([])
    setShowModal(true)
  }

  const handleEdit = (campaign: WahaCampaign) => {
    setEditingCampaign(campaign)
    setFormData({
      nome: campaign.nome,
      descricao: campaign.descricao || '',
      mensagem: campaign.mensagem,
      delay_min: campaign.delay_min,
      delay_max: campaign.delay_max,
      messages_per_minute: campaign.messages_per_minute,
      enable_variations: campaign.enable_variations,
      variation_prompt: campaign.variation_prompt || '',
      variation_count: campaign.variation_count,
      load_balancing_strategy: campaign.load_balancing_strategy
    })
    setVariations([])
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.mensagem) {
        toast.error('Nome e mensagem são obrigatórios')
        return
      }

      const response = editingCampaign 
        ? await fetch('/api/waha/campaigns', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingCampaign.id, ...formData })
          })
        : await fetch('/api/waha/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })

      const data = await response.json()

      if (data.success) {
        toast.success(editingCampaign ? 'Campanha atualizada!' : 'Campanha criada!')
        setShowModal(false)
        loadCampaigns()
      } else {
        toast.error(data.error || 'Erro ao salvar campanha')
      }
    } catch (error) {
      console.error('Erro ao salvar campanha:', error)
      toast.error('Erro ao salvar campanha')
    }
  }

  const handleDelete = async (campaign: WahaCampaign) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${campaign.nome}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/waha/campaigns?id=${campaign.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Campanha excluída!')
        loadCampaigns()
      } else {
        toast.error(data.error || 'Erro ao excluir campanha')
      }
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
      toast.error('Erro ao excluir campanha')
    }
  }

  const generateVariations = async () => {
    if (!formData.mensagem) {
      toast.error('Digite uma mensagem primeiro')
      return
    }

    try {
      setGeneratingVariations(true)
      const response = await fetch('/api/waha/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessage: formData.mensagem,
          prompt: formData.variation_prompt,
          count: formData.variation_count,
          language: 'português brasileiro',
          tone: 'profissional e amigável'
        })
      })

      const data = await response.json()

      if (data.success) {
        setVariations(data.result.variations)
        toast.success(`${data.result.variations.length} variações geradas!`)
      } else {
        toast.error(data.error || 'Erro ao gerar variações')
      }
    } catch (error) {
      console.error('Erro ao gerar variações:', error)
      toast.error('Erro ao gerar variações')
    } finally {
      setGeneratingVariations(false)
    }
  }

  const handleViewContacts = async (campaign: WahaCampaign) => {
    setSelectedCampaign(campaign)
    await loadContacts(campaign.id)
    setShowContactsModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'active': return 'Ativa'
      case 'paused': return 'Pausada'
      case 'completed': return 'Concluída'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  const strategies = WahaLoadBalancer.getStrategies()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campanhas WAHA</h2>
          <p className="text-gray-600">Gerencie suas campanhas de disparo WhatsApp</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary"
        >
          <i className="fas fa-plus mr-2"></i>
          Nova Campanha
        </button>
      </div>

      {/* Lista de Campanhas */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="card bg-white shadow-sm border">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.nome}</h3>
                      <span className={`badge ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    
                    {campaign.descricao && (
                      <p className="text-gray-600 mb-3">{campaign.descricao}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contatos:</span>
                        <span className="ml-1">{campaign.total_contacts}</span>
                      </div>
                      <div>
                        <span className="font-medium">Enviadas:</span>
                        <span className="ml-1">{campaign.sent_messages}</span>
                      </div>
                      <div>
                        <span className="font-medium">Falhas:</span>
                        <span className="ml-1">{campaign.failed_messages}</span>
                      </div>
                      <div>
                        <span className="font-medium">Taxa:</span>
                        <span className="ml-1">{campaign.messages_per_minute}/min</span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-500">
                      <span className="font-medium">Estratégia:</span>
                      <span className="ml-1">{strategies.find(s => s.name.toLowerCase().replace(' ', '_') === campaign.load_balancing_strategy)?.name || campaign.load_balancing_strategy}</span>
                      {campaign.enable_variations && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="font-medium">Variações:</span>
                          <span className="ml-1">{campaign.variation_count}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewContacts(campaign)}
                      className="btn btn-sm btn-outline"
                    >
                      <i className="fas fa-users mr-1"></i>
                      Contatos
                    </button>
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="btn btn-sm btn-outline"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(campaign)}
                      className="btn btn-sm btn-error"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p>Nenhuma campanha criada ainda</p>
              <p className="text-sm">Clique em "Nova Campanha" para começar</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Campanha */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </h3>

            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Nome da Campanha *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Ex: Promoção Black Friday"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Estratégia de Balanceamento</span>
                  </label>
                  <select
                    value={formData.load_balancing_strategy}
                    onChange={(e) => setFormData({ ...formData, load_balancing_strategy: e.target.value as any })}
                    className="select select-bordered w-full"
                  >
                    {strategies.map((strategy) => (
                      <option key={strategy.name} value={strategy.name.toLowerCase().replace(' ', '_')}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Descrição</span>
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  placeholder="Descrição da campanha..."
                />
              </div>

              {/* Mensagem */}
              <div>
                <label className="label">
                  <span className="label-text">Mensagem *</span>
                </label>
                <textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>

              {/* Configurações de Timing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Delay Mínimo (seg)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.delay_min}
                    onChange={(e) => setFormData({ ...formData, delay_min: parseInt(e.target.value) })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Delay Máximo (seg)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.delay_max}
                    onChange={(e) => setFormData({ ...formData, delay_max: parseInt(e.target.value) })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Mensagens/Minuto</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.messages_per_minute}
                    onChange={(e) => setFormData({ ...formData, messages_per_minute: parseInt(e.target.value) })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Variações */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.enable_variations}
                    onChange={(e) => setFormData({ ...formData, enable_variations: e.target.checked })}
                    className="checkbox"
                  />
                  <label className="label-text">Habilitar Variações com IA Gemini</label>
                </div>

                {formData.enable_variations && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          <span className="label-text">Número de Variações</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.variation_count}
                          onChange={(e) => setFormData({ ...formData, variation_count: parseInt(e.target.value) })}
                          className="input input-bordered w-full"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={generateVariations}
                          disabled={generatingVariations || !formData.mensagem}
                          className="btn btn-outline w-full"
                        >
                          {generatingVariations ? (
                            <>
                              <span className="loading loading-spinner loading-sm mr-2"></span>
                              Gerando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic mr-2"></i>
                              Gerar Variações
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text">Prompt Personalizado (opcional)</span>
                      </label>
                      <textarea
                        value={formData.variation_prompt}
                        onChange={(e) => setFormData({ ...formData, variation_prompt: e.target.value })}
                        className="textarea textarea-bordered w-full"
                        rows={2}
                        placeholder="Instruções específicas para as variações..."
                      />
                    </div>

                    {/* Preview das Variações */}
                    {variations.length > 0 && (
                      <div>
                        <label className="label">
                          <span className="label-text">Preview das Variações</span>
                        </label>
                        <div className="space-y-2">
                          {variations.map((variation, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded border">
                              <div className="flex items-start gap-2">
                                <span className="badge badge-sm badge-outline">{index + 1}</span>
                                <span className="text-sm">{variation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
              >
                {editingCampaign ? 'Atualizar' : 'Criar'} Campanha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contatos */}
      {showContactsModal && selectedCampaign && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              Contatos - {selectedCampaign.nome}
            </h3>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Telefone</th>
                    <th>Nome</th>
                    <th>Status</th>
                    <th>Enviado em</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>{contact.phone_number}</td>
                      <td>{contact.nome || '-'}</td>
                      <td>
                        <span className={`badge ${
                          contact.status === 'sent' ? 'badge-success' :
                          contact.status === 'failed' ? 'badge-error' :
                          contact.status === 'skipped' ? 'badge-warning' :
                          'badge-ghost'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td>{contact.sent_at ? new Date(contact.sent_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowContactsModal(false)}
                className="btn btn-ghost"
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
