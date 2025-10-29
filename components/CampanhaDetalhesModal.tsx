'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ChartBarIcon, ClockIcon, UserGroupIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Campanha } from '@/lib/campaignTypes'
import { formatDate } from '@/lib/utils'

interface CampanhaDetalhesModalProps {
  isOpen: boolean
  onClose: () => void
  campanha: Campanha | null
}

export default function CampanhaDetalhesModal({ isOpen, onClose, campanha }: CampanhaDetalhesModalProps) {
  if (!campanha) return null

  const progresso = campanha.progresso || {}
  const totalClientes = progresso.totalClientes || 0
  const clientesEnviados = progresso.clientesEnviados || 0
  const clientesFalharam = progresso.clientesFalharam || 0
  const totalLotes = progresso.totalLotes || 0
  const lotesProcessados = progresso.lotesProcessados || 0
  const status = progresso.status || 'rascunho'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-secondary-100 text-secondary-800'
      case 'agendada':
        return 'bg-warning-100 text-warning-800'
      case 'processando':
        return 'bg-primary-100 text-primary-800'
      case 'pausada':
        return 'bg-warning-100 text-warning-800'
      case 'concluida':
        return 'bg-success-100 text-success-800'
      case 'cancelada':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'agendada':
        return 'Agendada'
      case 'processando':
        return 'Processando'
      case 'pausada':
        return 'Pausada'
      case 'concluida':
        return 'Concluída'
      case 'cancelada':
        return 'Cancelada'
      default:
        return status
    }
  }

  const progressPercentage = totalLotes > 0 ? Math.round((lotesProcessados / totalLotes) * 100) : 0

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-secondary-900">
                        {campanha.nome}
                      </Dialog.Title>
                      <p className="text-sm text-secondary-500">
                        Criada em {formatDate(campanha.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-secondary-500" />
                  </button>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                    {status === 'processando' && (
                      <span className="text-sm text-primary-600 font-medium">
                        {progressPercentage}% concluído
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid de informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-6">
                  {/* Total de Clientes */}
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary-100 rounded-lg">
                        <UserGroupIcon className="h-5 w-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Total de Clientes</p>
                        <p className="text-2xl font-semibold text-secondary-900">
                          {totalClientes.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens Enviadas */}
                  <div className="bg-success-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-success-100 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-success-600" />
                      </div>
                      <div>
                        <p className="text-sm text-success-500">Enviadas</p>
                        <p className="text-2xl font-semibold text-success-900">
                          {clientesEnviados.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens com Falha */}
                  <div className="bg-error-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-error-100 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-error-600" />
                      </div>
                      <div>
                        <p className="text-sm text-error-500">Falharam</p>
                        <p className="text-2xl font-semibold text-error-900">
                          {clientesFalharam.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total de Lotes */}
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-500">Total de Lotes</p>
                        <p className="text-2xl font-semibold text-primary-900">
                          {totalLotes.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                {status === 'processando' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary-700">Progresso da Campanha</span>
                      <span className="text-sm text-secondary-500">
                        {lotesProcessados} de {totalLotes} lotes processados
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Mensagem da Campanha */}
                <div className="mb-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-secondary-700">Mensagem da Campanha</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                          {/* Decorative elements */}
                          <div className="absolute top-2 right-2 opacity-20">
                            <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          
                          {/* Message content with enhanced styling */}
                          <div className="relative">
                            <div className="flex items-center mb-3">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-700">Mensagem da Campanha</h4>
                            </div>
                            
                            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-inner">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                                {campanha.mensagem}
                              </p>
                            </div>
                            
                            {/* Character count indicator */}
                            <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                {campanha.mensagem.length} caracteres
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Pronto para envio
                              </span>
                            </div>
                          </div>
                        </div>
                    
                    {/* Preview Estático do WhatsApp */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-72 transform scale-100 ml-auto h-[500px] flex flex-col">
                      {/* Header do WhatsApp */}
                      <div className="bg-green-700 text-white p-2.5 flex items-center space-x-2">
                        <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">C</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Cliente</h3>
                          <p className="text-green-200 text-xs">Online</p>
                        </div>
                        <div className="flex space-x-2">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>

                      {/* Área de mensagens */}
                      <div className="bg-amber-50 p-3 flex-1 overflow-y-auto" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                        {/* Status de entrega */}
                        <div className="flex justify-end mb-2">
                          <div className="flex items-center space-x-1 text-gray-500 text-xs">
                            <span>12:34</span>
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>

                        {/* Balão da mensagem */}
                        <div className="flex justify-end mb-2">
                          <div className="max-w-52">
                            <div className="bg-green-200 text-gray-800 rounded-2xl rounded-br-sm px-3 py-2 shadow-sm relative">
                              <p className="text-xs whitespace-pre-wrap leading-tight" style={{ fontSize: '10px' }}>
                                {campanha.mensagem}
                              </p>
                              {/* Cauda do balão */}
                              <div className="absolute -bottom-1 right-0 w-3 h-3 bg-green-200 transform rotate-45"></div>
                            </div>
                            <div className="flex justify-end mt-1 items-center space-x-1">
                              <span className="text-xs text-gray-500">12:34</span>
                              <div className="flex -space-x-1">
                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Indicador de digitação */}
                        <div className="flex justify-start mb-2">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm max-w-48 relative">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                            {/* Cauda do balão */}
                            <div className="absolute -bottom-1 left-0 w-3 h-3 bg-white transform rotate-45"></div>
                          </div>
                        </div>
                      </div>

                      {/* Input do WhatsApp */}
                      <div className="bg-white p-2.5 border-t border-gray-200">
                        <div className="flex items-center space-x-1.5">
                          <button className="w-7 h-7 text-gray-500 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
                            </svg>
                          </button>
                          <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 flex items-center space-x-1.5">
                            <span className="text-gray-500 text-xs">Digite uma mensagem</span>
                            <div className="flex space-x-1.5 ml-auto">
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                              </svg>
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          </div>
                          <button className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">Configurações</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Tamanho do Lote:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {campanha.configuracao?.clientesPorLote || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Intervalo entre Mensagens:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {campanha.configuracao?.intervaloMensagens || 'N/A'}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Agendamento:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {campanha.configuracao?.agendamento === 'imediato' ? 'Imediato' : 'Agendado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">Filtros de Clientes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Status:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {campanha.criterios?.status || 'Todos'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Criado após:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          N/A
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">Informações Adicionais</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">ID da Campanha:</span>
                        <span className="text-sm font-medium text-secondary-900 font-mono text-xs">
                          {campanha.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-secondary-500">Última Atualização:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {formatDate(campanha.updated_at || campanha.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="btn btn-secondary"
                  >
                    Fechar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
