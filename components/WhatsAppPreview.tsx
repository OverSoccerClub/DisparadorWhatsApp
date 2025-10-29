'use client'

import { useState } from 'react'
import { DevicePhoneMobileIcon, EyeIcon } from '@heroicons/react/24/outline'

interface WhatsAppPreviewProps {
  message: string
  recipientName?: string
  recipientPhone?: string
  className?: string
}

export default function WhatsAppPreview({ 
  message, 
  recipientName = 'João Silva', 
  recipientPhone = '+55 11 99999-9999',
  className = ''
}: WhatsAppPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  // Simular formatação da mensagem como no WhatsApp
  const formatMessage = (text: string) => {
    return text
      .replace(/\n/g, '\n') // Manter quebras de linha
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Converter **texto** para *texto* (negrito)
      .replace(/\*(.*?)\*/g, '*$1*') // Manter itálico
      .replace(/`(.*?)`/g, '```$1```') // Converter `código` para ```código```
      .replace(/\{\{nome\}\}/g, recipientName) // Substituir {{nome}} pelo nome do destinatário
      .replace(/\{\{telefone\}\}/g, recipientPhone) // Substituir {{telefone}} pelo telefone
      .replace(/\{\{empresa\}\}/g, 'Sua Empresa') // Substituir {{empresa}} por nome da empresa
      .replace(/\{\{data\}\}/g, new Date().toLocaleDateString('pt-BR')) // Substituir {{data}} pela data atual
  }

  const formattedMessage = formatMessage(message)

  return (
    <div className={`relative ${className}`}>
      {/* Botão para mostrar/ocultar preview */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
      >
        <DevicePhoneMobileIcon className="h-4 w-4" />
        <span>{showPreview ? 'Ocultar Preview' : 'Preview WhatsApp'}</span>
        <EyeIcon className="h-4 w-4" />
      </button>

      {/* Preview do WhatsApp */}
      {showPreview && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-80">
            {/* Header do WhatsApp */}
            <div className="bg-green-600 text-white p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{recipientName}</h3>
                <p className="text-green-100 text-xs">{recipientPhone}</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="bg-gray-100 p-4 min-h-48 max-h-64 overflow-y-auto">
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
              <div className="flex justify-end mb-4">
                <div className="max-w-xs">
                  <div className="bg-green-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {formattedMessage}
                    </p>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">12:34</span>
                  </div>
                </div>
              </div>

              {/* Indicador de digitação */}
              <div className="flex justify-start mb-4">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-xs">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input do WhatsApp */}
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                  <span className="text-gray-500 text-sm">Digite uma mensagem</span>
                </div>
                <button className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Seta indicadora */}
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        </div>
      )}
    </div>
  )
}
