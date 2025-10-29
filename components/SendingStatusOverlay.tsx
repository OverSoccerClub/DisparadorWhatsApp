'use client'

import { ReactNode } from 'react'
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'

interface SendingStatusOverlayProps {
  open: boolean
  status: 'sending' | 'success' | 'error'
  title?: string
  message?: string
  details?: {
    totalMessages: number
    sentMessages: number
    failedMessages: number
    instanceName?: string
    distributionMethod?: string
    currentMessage?: string
    currentPhone?: string
    currentInstance?: string
    progress?: number
    estimatedTime?: string
  }
  onClose?: () => void
  children?: ReactNode
}

export default function SendingStatusOverlay({ 
  open, 
  status,
  title = 'Enviando Mensagens', 
  message = 'Processando suas mensagens...', 
  details,
  onClose,
  children 
}: SendingStatusOverlayProps) {
  if (!open) return null
  
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-8 w-8 text-red-500" />
      default:
        return <PaperAirplaneIcon className="h-8 w-8 text-blue-500" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'sending':
        return 'Enviando Mensagens'
      case 'success':
        return 'Mensagens Enviadas!'
      case 'error':
        return 'Erro no Envio'
      default:
        return title
    }
  }

  const getMessage = () => {
    switch (status) {
      case 'sending':
        return 'Processando suas mensagens...'
      case 'success':
        return `Sucesso! ${details?.sentMessages || 0} mensagem(ns) enviada(s) com sucesso.`
      case 'error':
        return 'Ocorreu um erro ao enviar as mensagens. Tente novamente.'
      default:
        return message
    }
  }

  const getBgColor = () => {
    switch (status) {
      case 'sending':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (status) {
      case 'sending':
        return 'text-blue-700'
      case 'success':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      default:
        return 'text-blue-700'
    }
  }
  
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full max-w-md bg-white rounded-lg shadow-xl p-6 text-center border-2 ${getBgColor()}`}>
          <div className="flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            {getTitle()}
          </h3>
          
          <p className={`text-sm ${getTextColor()} mb-4`}>
            {getMessage()}
          </p>

          {/* Detalhes do envio */}
          {details && (
            <div className="bg-white bg-opacity-50 rounded-md p-3 mb-4 text-left">
              <div className="text-xs text-secondary-600 space-y-1">
                
                {/* Progresso geral */}
                <div className="flex justify-between">
                  <span>Progresso:</span>
                  <span className="font-medium">{details.sentMessages + details.failedMessages}/{details.totalMessages}</span>
                </div>
                
                {/* Barra de progresso */}
                {details.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${details.progress}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total de mensagens:</span>
                  <span className="font-medium">{details.totalMessages}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Enviadas:</span>
                  <span className="font-medium text-green-600">{details.sentMessages}</span>
                </div>
                
                {details.failedMessages > 0 && (
                  <div className="flex justify-between">
                    <span>Falharam:</span>
                    <span className="font-medium text-red-600">{details.failedMessages}</span>
                  </div>
                )}
                
                {/* Mensagem atual sendo enviada */}
                {details.currentMessage && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="text-xs font-medium text-blue-800 mb-1">Enviando agora:</div>
                    <div className="text-xs text-blue-700 truncate">
                      {details.currentMessage.substring(0, 50)}...
                    </div>
                    {details.currentPhone && (
                      <div className="text-xs text-blue-600 mt-1">
                        Para: {details.currentPhone}
                      </div>
                    )}
                    {details.currentInstance && (
                      <div className="text-xs text-blue-600">
                        Via: {details.currentInstance}
                      </div>
                    )}
                  </div>
                )}
                
                {details.instanceName && (
                  <div className="flex justify-between">
                    <span>Instância:</span>
                    <span className="font-medium">{details.instanceName}</span>
                  </div>
                )}
                
                {details.distributionMethod && (
                  <div className="flex justify-between">
                    <span>Método:</span>
                    <span className="font-medium">{details.distributionMethod}</span>
                  </div>
                )}
                
                {details.estimatedTime && (
                  <div className="flex justify-between">
                    <span>Tempo estimado:</span>
                    <span className="font-medium text-blue-600">{details.estimatedTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {children && (
            <div className="mt-4 text-sm text-secondary-700">
              {children}
            </div>
          )}

          {/* Botão de fechar (apenas para success/error) */}
          {(status === 'success' || status === 'error') && onClose && (
            <button
              onClick={onClose}
              className={`mt-4 w-full px-4 py-2 rounded-md transition-colors ${
                status === 'success' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
