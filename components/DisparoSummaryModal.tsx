'use client'

import React from 'react'
import { X, CheckCircle, XCircle, Clock, Users, BarChart3, TrendingUp } from 'lucide-react'

interface DisparoSummary {
  totalMessages: number
  successCount: number
  failedCount: number
  totalTime: number
  averageTimePerMessage: number
  instanceStats: Array<{
    instanceName: string
    messageCount: number
    successCount: number
    failedCount: number
    averageTime: number
  }>
  startTime: string
  endTime: string
}

interface DisparoSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  summary: DisparoSummary | null
}

export default function DisparoSummaryModal({ isOpen, onClose, summary }: DisparoSummaryModalProps) {
  if (!isOpen || !summary) return null

  const successRate = summary.totalMessages > 0 ? (summary.successCount / summary.totalMessages) * 100 : 0
  const failureRate = summary.totalMessages > 0 ? (summary.failedCount / summary.totalMessages) * 100 : 0

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resumo do Disparo</h2>
              <p className="text-gray-600">Estatísticas detalhadas do envio concluído</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Mensagens */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Mensagens</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalMessages}</p>
                </div>
              </div>
            </div>

            {/* Sucessos */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Enviadas com Sucesso</p>
                  <p className="text-2xl font-bold text-green-900">{summary.successCount}</p>
                  <p className="text-xs text-green-700">{successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Falhas */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Falhas</p>
                  <p className="text-2xl font-bold text-red-900">{summary.failedCount}</p>
                  <p className="text-xs text-red-700">{failureRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Tempo Total */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Tempo Total</p>
                  <p className="text-2xl font-bold text-purple-900">{formatTime(summary.totalTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas de Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tempo Médio por Mensagem */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tempo Médio por Mensagem</h3>
                  <p className="text-sm text-gray-600">Tempo médio entre envios</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{formatTime(summary.averageTimePerMessage)}</p>
                <p className="text-sm text-gray-600">por mensagem</p>
              </div>
            </div>

            {/* Período de Execução */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Período de Execução</h3>
                  <p className="text-sm text-gray-600">Início e fim do disparo</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Início:</p>
                  <p className="text-sm text-gray-900">{formatDateTime(summary.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fim:</p>
                  <p className="text-sm text-gray-900">{formatDateTime(summary.endTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Distribuição por Instância */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Distribuição por Instância</h3>
              <p className="text-sm text-gray-600">Detalhamento do desempenho de cada instância</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instância
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucessos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Falhas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Sucesso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo Médio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.instanceStats.map((instance, index) => {
                    const instanceSuccessRate = instance.messageCount > 0 
                      ? (instance.successCount / instance.messageCount) * 100 
                      : 0
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {instance.instanceName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {instance.messageCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium">
                          {instance.successCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          {instance.failedCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${instanceSuccessRate}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{instanceSuccessRate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTime(instance.averageTime)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Final */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Resumo Executivo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-900">{summary.totalMessages}</p>
                <p className="text-sm text-blue-700">Mensagens Processadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{successRate.toFixed(1)}%</p>
                <p className="text-sm text-green-700">Taxa de Sucesso</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{formatTime(summary.totalTime)}</p>
                <p className="text-sm text-purple-700">Tempo Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fechar Resumo
          </button>
        </div>
      </div>
    </div>
  )
}
