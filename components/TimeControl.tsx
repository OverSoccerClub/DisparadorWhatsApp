'use client'

import { useState, useEffect } from 'react'
import { ClockIcon, CalculatorIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface TimeControlConfig {
  delayMinutes: number
  delaySeconds: number
  totalTimeHours: number
  totalTimeMinutes: number
  autoCalculate: boolean
}

interface TimeControlProps {
  totalDestinatarios: number
  totalInstancias: number
  onConfigChange: (config: TimeControlConfig) => void
  disabled?: boolean
  messageType?: 'promocional' | 'informativa' | 'pessoal' | 'comercial'
  humanizeConversation?: boolean
}

export default function TimeControl({ 
  totalDestinatarios, 
  totalInstancias, 
  onConfigChange, 
  disabled = false,
  messageType,
  humanizeConversation = true
}: TimeControlProps) {
  const [config, setConfig] = useState<TimeControlConfig>({
    delayMinutes: 1,
    delaySeconds: 30,
    totalTimeHours: 3,
    totalTimeMinutes: 0,
    autoCalculate: true
  })

  const [calculations, setCalculations] = useState({
    totalDelaySeconds: 0,
    totalTimeSeconds: 0,
    messagesPerInstance: 0,
    estimatedTime: '',
    isFeasible: true,
    warningMessage: ''
  })

  // Sugestão segura baseada no tipo da mensagem
  const getSuggestedConfig = () => {
    const instances = Math.max(1, totalInstancias)
    const recipients = Math.max(0, totalDestinatarios)

    let minDelaySecondsByType = 12 // default de segurança
    switch (messageType) {
      case 'promocional':
        minDelaySecondsByType = 20
        break
      case 'comercial':
        minDelaySecondsByType = 18
        break
      case 'informativa':
        minDelaySecondsByType = 12
        break
      case 'pessoal':
        minDelaySecondsByType = 6
        break
      default:
        minDelaySecondsByType = 12
    }

    const delaySecondsSuggested = minDelaySecondsByType
    const totalTimeSecondsSuggested = Math.ceil((recipients * delaySecondsSuggested) / instances * 1.1) // +10% buffer

    const hours = Math.floor(totalTimeSecondsSuggested / 3600)
    const minutes = Math.floor((totalTimeSecondsSuggested % 3600) / 60)
    const seconds = Math.max(0, delaySecondsSuggested)

    return {
      delayMinutes: Math.floor(seconds / 60),
      delaySeconds: seconds % 60,
      totalTimeHours: hours,
      totalTimeMinutes: minutes,
      description: `Sugestão segura para ${messageType || 'mensagem'}`,
    }
  }

  // Calcular métricas quando config mudar
  useEffect(() => {
    if (totalDestinatarios === 0 || totalInstancias === 0) {
      // Resetar cálculos quando não há dados suficientes
      setCalculations({
        totalDelaySeconds: 0,
        totalTimeSeconds: 0,
        messagesPerInstance: 0,
        estimatedTime: '',
        isFeasible: false,
        warningMessage: totalInstancias === 0 ? 'Nenhuma instância conectada' : 'Nenhum destinatário selecionado'
      })
      return
    }

    const totalDelaySeconds = (config.delayMinutes * 60) + config.delaySeconds

    // Conversa humanizada: 3 esperas médias entre 4 mensagens
    // Médias aproximadas: 1.2-3.5s (2.35), 1.5-4s (2.75), 1.5-4s (2.75) => ~7.85s
    const humanizedOverheadSeconds = humanizeConversation ? 7.85 : 0

    // Tempo por destinatário considera o delay configurado + overhead da conversa humanizada
    const timePerRecipientSeconds = totalDelaySeconds + humanizedOverheadSeconds
    const totalTimeSeconds = (config.totalTimeHours * 3600) + (config.totalTimeMinutes * 60)
    const messagesPerInstance = Math.ceil(totalDestinatarios / totalInstancias)
    const totalTimeNeeded = totalDestinatarios * timePerRecipientSeconds
    const estimatedTimeSeconds = totalTimeNeeded

    // Converter para formato legível
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
      } else {
        return `${secs}s`
      }
    }

    const isFeasible = totalTimeNeeded <= totalTimeSeconds
    let warningMessage = ''

    if (!isFeasible) {
      const excessTime = totalTimeNeeded - totalTimeSeconds
      warningMessage = `Tempo insuficiente! Seria necessário mais ${formatTime(excessTime)}`
    } else if (totalTimeNeeded < totalTimeSeconds * 0.8) {
      warningMessage = 'Tempo muito generoso. Considere reduzir o delay para otimizar.'
    }

    setCalculations({
      totalDelaySeconds,
      totalTimeSeconds,
      messagesPerInstance,
      estimatedTime: formatTime(estimatedTimeSeconds),
      isFeasible,
      warningMessage
    })

    onConfigChange(config)
  }, [config, totalDestinatarios, totalInstancias, onConfigChange, humanizeConversation])

  const handleDelayChange = (field: 'delayMinutes' | 'delaySeconds', value: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }))
  }

  const handleTotalTimeChange = (field: 'totalTimeHours' | 'totalTimeMinutes', value: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }))
  }

  const handleAutoCalculate = () => {
    if (totalDestinatarios === 0 || totalInstancias === 0) {
      console.warn('Não é possível calcular delay: destinatários ou instâncias = 0')
      return
    }

    // Calcular delay ideal baseado no tempo disponível
    const totalTimeSeconds = (config.totalTimeHours * 3600) + (config.totalTimeMinutes * 60)
    const idealDelaySeconds = Math.floor(totalTimeSeconds / totalDestinatarios)
    
    // Garantir delay mínimo de 30 segundos para segurança
    const safeDelaySeconds = Math.max(idealDelaySeconds, 30)
    
    const delayMinutes = Math.floor(safeDelaySeconds / 60)
    const delaySeconds = safeDelaySeconds % 60

    setConfig(prev => ({
      ...prev,
      delayMinutes,
      delaySeconds,
      autoCalculate: true
    }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ClockIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Controle de Tempo</h3>
      </div>

      {/* Delay entre mensagens */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Delay entre mensagens
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Minutos</label>
            <input
              type="number"
              min="0"
              max="59"
              value={config.delayMinutes}
              onChange={(e) => handleDelayChange('delayMinutes', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Segundos</label>
            <input
              type="number"
              min="0"
              max="59"
              value={config.delaySeconds}
              onChange={(e) => handleDelayChange('delaySeconds', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Tempo total disponível */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tempo total disponível
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Horas</label>
            <input
              type="number"
              min="0"
              max="24"
              value={config.totalTimeHours}
              onChange={(e) => handleTotalTimeChange('totalTimeHours', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Minutos</label>
            <input
              type="number"
              min="0"
              max="59"
              value={config.totalTimeMinutes}
              onChange={(e) => handleTotalTimeChange('totalTimeMinutes', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Botão de cálculo automático */}
      <div className="flex justify-center">
        <button
          onClick={handleAutoCalculate}
          disabled={disabled || totalDestinatarios === 0 || totalInstancias === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <CalculatorIcon className="h-4 w-4" />
          Calcular Delay Ideal
        </button>
      </div>

      {/* Resultados dos cálculos */}
      {totalDestinatarios > 0 && totalInstancias > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <CalculatorIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Cálculos</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Delay total:</span>
              <span className="ml-2 font-medium">{calculations.totalDelaySeconds}s</span>
            </div>
            <div>
              <span className="text-gray-600">Tempo estimado:</span>
              <span className="ml-2 font-medium">{calculations.estimatedTime}</span>
            </div>
            <div>
              <span className="text-gray-600">Mensagens por instância:</span>
              <span className="ml-2 font-medium">{calculations.messagesPerInstance}</span>
            </div>
            <div>
              <span className="text-gray-600">Tempo disponível:</span>
              <span className="ml-2 font-medium">
                {Math.floor(calculations.totalTimeSeconds / 3600)}h {Math.floor((calculations.totalTimeSeconds % 3600) / 60)}m
              </span>
            </div>
          </div>

          {/* Avisos */}
          {calculations.warningMessage && (
            <div className={`mt-3 p-3 rounded-md flex items-center gap-2 ${
              calculations.isFeasible 
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{calculations.warningMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Sugestão Segura */}
      {totalDestinatarios > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Sugestão segura{messageType ? ` (${messageType})` : ''}</span>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const s = getSuggestedConfig()
                setConfig(prev => ({
                  ...prev,
                  delayMinutes: s.delayMinutes,
                  delaySeconds: s.delaySeconds,
                  totalTimeHours: s.totalTimeHours,
                  totalTimeMinutes: s.totalTimeMinutes,
                  autoCalculate: true
                }))
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              Aplicar sugestão
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-900">
            {(() => { const s = getSuggestedConfig(); return (
              <>
                <div>
                  <span className="text-blue-800">Delay recomendado:</span>
                  <span className="ml-2 font-semibold">{s.delayMinutes}m {s.delaySeconds}s</span>
                </div>
                <div>
                  <span className="text-blue-800">Tempo total estimado:</span>
                  <span className="ml-2 font-semibold">{s.totalTimeHours}h {s.totalTimeMinutes}m</span>
                </div>
              </>
            )})()}
          </div>
          <p className="mt-2 text-xs text-blue-700">
            A sugestão considera o tipo de mensagem, o número de destinatários e as instâncias conectadas para mitigar riscos de spam.
          </p>
        </div>
      )}
    </div>
  )
}
