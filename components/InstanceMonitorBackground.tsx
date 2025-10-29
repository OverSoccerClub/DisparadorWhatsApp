'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  PlayIcon, 
  StopIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { useBackgroundMonitoring } from '@/hooks/useBackgroundMonitoring'
import { useKeepAlive } from '@/hooks/useKeepAlive'

interface InstanceStatus {
  instanceName: string
  connectionStatus: string
  phoneNumber?: string
  lastSeen?: string
  profileName?: string
  errorCount: number
  lastError?: string
  reconnectAttempts: number
}

interface InstanceMonitorProps {
  userId: string
  onStatusChange?: (status: InstanceStatus[]) => void
}

export default function InstanceMonitor({ userId, onStatusChange }: InstanceMonitorProps) {
  const [instances, setInstances] = useState<InstanceStatus[]>([])
  const [monitoredInstances, setMonitoredInstances] = useState<InstanceStatus[]>([])
  const [autoReconnect, setAutoReconnect] = useState(true)
  const [checkInterval, setCheckInterval] = useState(30) // segundos
  
  // Hook para monitoramento em background
  const {
    isMonitoring,
    status: backgroundStatus,
    config: backgroundConfig,
    startMonitoring,
    stopMonitoring,
    reconnectAll,
    refreshStatus,
    error: backgroundError,
    loading: backgroundLoading
  } = useBackgroundMonitoring(userId)

  // Hook para keep-alive
  const {
    isActive: isKeepAliveActive,
    status: keepAliveStatus,
    startKeepAlive,
    stopKeepAlive,
    refreshStatus: refreshKeepAliveStatus,
    error: keepAliveError,
    loading: keepAliveLoading
  } = useKeepAlive(userId)

  // Carregar instâncias
  const loadInstances = useCallback(async () => {
    try {
      const response = await fetch(`/api/evolution/instances?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.instances) {
        const instancesWithStatus = data.instances.map((instance: any) => ({
          instanceName: instance.instanceName,
          connectionStatus: instance.connectionStatus,
          phoneNumber: instance.phoneNumber,
          lastSeen: instance.lastSeen,
          profileName: instance.profileName,
          errorCount: 0,
          reconnectAttempts: 0
        }))
        
        setInstances(instancesWithStatus)
        setMonitoredInstances(instancesWithStatus)
        onStatusChange?.(instancesWithStatus)
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }, [userId, onStatusChange])

  // Atualizar instâncias monitoradas quando o status do background mudar
  useEffect(() => {
    if (backgroundStatus && backgroundStatus.instances) {
      setMonitoredInstances(backgroundStatus.instances)
    }
  }, [backgroundStatus])

  // Carregar instâncias quando o componente montar
  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  // Iniciar monitoramento em background
  const handleStartMonitoring = async () => {
    const success = await startMonitoring({
      interval: checkInterval * 1000, // Converter para milissegundos
      autoReconnect,
      maxReconnectAttempts: 3,
      reconnectDelay: 2000
    })
    
    if (success) {
      console.log('✅ Monitoramento em background iniciado')
    }
  }

  // Parar monitoramento em background
  const handleStopMonitoring = async () => {
    const success = await stopMonitoring()
    
    if (success) {
      console.log('🛑 Monitoramento em background parado')
    }
  }

  // Reconectar instância específica
  const reconnectInstance = async (instanceName: string) => {
    try {
      const response = await fetch('/api/evolution/smart-reconnect-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, userId })
      })

      const data = await response.json()

      if (data.success) {
        if (data.requiresManualScan) {
          alert(`QR Code necessário para reconexão da instância ${instanceName}. Verifique a interface da Evolution API.`)
        } else {
          alert(`Instância ${instanceName} reconectada com sucesso usando estratégia: ${data.strategy}`)
        }
        await loadInstances()
      } else {
        alert(`Erro ao reconectar instância ${instanceName}: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao reconectar instância:', error)
      alert('Erro ao reconectar instância')
    }
  }

  // Reconectar todas as instâncias
  const handleReconnectAll = async () => {
    const disconnectedInstances = instances.filter(i => i.connectionStatus !== 'open')
    
    if (disconnectedInstances.length === 0) {
      alert('✅ Todas as instâncias estão conectadas!')
      return
    }
    
    if (confirm(`🔄 Reconectar ${disconnectedInstances.length} instância(s) desconectada(s)?`)) {
      const success = await reconnectAll()
      
      if (success) {
        alert('✅ Processo de reconexão concluído!')
        await loadInstances()
      } else {
        alert('❌ Erro na reconexão. Verifique o console para detalhes.')
      }
    }
  }

  // Carregar instâncias na inicialização
  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  // Atualizar instâncias quando status de background muda
  useEffect(() => {
    if (backgroundStatus) {
      setInstances(prev => prev.map(instance => {
        // Atualizar status baseado no monitoramento de background
        return {
          ...instance,
          connectionStatus: backgroundStatus.connectedInstances > 0 ? 'open' : 'disconnected'
        }
      }))
    }
  }, [backgroundStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'waiting_qr': return 'text-blue-600'
      default: return 'text-red-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'connecting': return <ArrowPathIcon className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'waiting_qr': return <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <XCircleIcon className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monitor de Instâncias</h3>
          {isMonitoring && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Background Ativo</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <button
              onClick={handleStopMonitoring}
              disabled={backgroundLoading}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 disabled:opacity-50"
            >
              <StopIcon className="h-4 w-4 inline mr-1" />
              Parar Background
            </button>
          ) : (
            <button
              onClick={handleStartMonitoring}
              disabled={backgroundLoading}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 inline mr-1" />
              Iniciar Background
            </button>
          )}
          
          <button
            onClick={loadInstances}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
          >
            <ArrowPathIcon className="h-4 w-4 inline mr-1" />
            Atualizar
          </button>
          
          <button
            onClick={handleReconnectAll}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-200"
          >
            Reconectar Todas
          </button>
        </div>
      </div>

      {/* Status do Monitoramento em Background */}
      {backgroundConfig && (
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Monitoramento em Background</h4>
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
            <div>
              <span className="font-medium">Status:</span> {isMonitoring ? 'Ativo' : 'Inativo'}
            </div>
            <div>
              <span className="font-medium">Intervalo:</span> {backgroundConfig.interval / 1000}s
            </div>
            <div>
              <span className="font-medium">Auto-reconexão:</span> {backgroundConfig.autoReconnect ? 'Sim' : 'Não'}
            </div>
            <div>
              <span className="font-medium">Iniciado em:</span> {backgroundConfig.startedAt ? new Date(backgroundConfig.startedAt).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Keep-Alive */}
      <div className="bg-purple-50 rounded-md p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-purple-900 flex items-center">
            <CpuChipIcon className="h-4 w-4 mr-2" />
            Sistema de Keep-Alive
          </h4>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isKeepAliveActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-purple-700">
              {isKeepAliveActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-purple-700 mb-3">
          <div>
            <span className="font-medium">Status:</span> {isKeepAliveActive ? 'Ativo' : 'Inativo'}
          </div>
          <div>
            <span className="font-medium">Intervalo:</span> {keepAliveStatus?.config?.interval ? `${keepAliveStatus.config.interval / 1000}s` : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Instâncias:</span> {keepAliveStatus?.summary?.total || 0}
          </div>
          <div>
            <span className="font-medium">Ativas:</span> {keepAliveStatus?.summary?.active || 0}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isKeepAliveActive ? (
            <button
              onClick={() => startKeepAlive({ interval: 30000, enabled: true })}
              disabled={keepAliveLoading}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 inline mr-1" />
              Iniciar Keep-Alive
            </button>
          ) : (
            <button
              onClick={stopKeepAlive}
              disabled={keepAliveLoading}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 disabled:opacity-50"
            >
              <StopIcon className="h-4 w-4 inline mr-1" />
              Parar Keep-Alive
            </button>
          )}
          
          <button
            onClick={refreshKeepAliveStatus}
            disabled={keepAliveLoading}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 inline mr-1" />
            Atualizar
          </button>
        </div>

        {keepAliveError && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-xs">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
            {keepAliveError}
          </div>
        )}
      </div>

      {/* Instâncias Sendo Monitoradas em Tempo Real */}
      {(isMonitoring || monitoredInstances.length > 0) && (
        <div className="bg-green-50 rounded-md p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-900 flex items-center">
              <CpuChipIcon className="h-4 w-4 mr-2" />
              {isMonitoring ? `Instâncias Sendo Monitoradas (${monitoredInstances.length})` : `Instâncias Disponíveis (${monitoredInstances.length})`}
            </h4>
            <div className="flex items-center text-xs text-green-700">
              <ClockIcon className="h-3 w-3 mr-1" />
              {isMonitoring ? 'Tempo Real' : 'Última Verificação'}
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {monitoredInstances.map((instance) => (
              <div key={instance.instanceName} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    instance.connectionStatus === 'connected' ? 'bg-green-500' :
                    instance.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {instance.profileName || instance.instanceName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {instance.instanceName}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xs font-medium ${
                    instance.connectionStatus === 'connected' ? 'text-green-600' :
                    instance.connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {instance.connectionStatus === 'connected' ? 'Conectado' :
                     instance.connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                  </div>
                  {instance.errorCount > 0 && (
                    <div className="text-xs text-red-500">
                      {instance.errorCount} erro(s)
                    </div>
                  )}
                  {instance.reconnectAttempts > 0 && (
                    <div className="text-xs text-orange-500">
                      {instance.reconnectAttempts} tentativa(s)
                    </div>
                  )}
                  
                  {instance.connectionStatus !== 'connected' && (
                    <button
                      onClick={() => reconnectInstance(instance.instanceName)}
                      className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      title="Reconectar esta instância"
                    >
                      🔄 Reconectar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Resumo */}
          <div className="mt-3 pt-2 border-t border-green-200">
            <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {monitoredInstances.filter(i => i.connectionStatus === 'connected').length}
                </div>
                <div>Conectadas</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">
                  {monitoredInstances.filter(i => i.connectionStatus === 'connecting').length}
                </div>
                <div>Conectando</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">
                  {monitoredInstances.filter(i => i.connectionStatus === 'disconnected').length}
                </div>
                <div>Desconectadas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurações */}
      <div className="bg-gray-50 rounded-md p-3 space-y-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Reconexão automática</span>
          </label>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Intervalo:</label>
            <select
              value={checkInterval}
              onChange={(e) => setCheckInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1min</option>
              <option value={300}>5min</option>
            </select>
          </div>
        </div>
        
        {backgroundStatus && (
          <div className="text-xs text-gray-500">
            Última verificação: {backgroundStatus.lastCheck ? new Date(backgroundStatus.lastCheck).toLocaleTimeString() : 'N/A'}
          </div>
        )}
      </div>

      {/* Erro de background */}
      {backgroundError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-700">
            <strong>Erro no monitoramento:</strong> {backgroundError}
          </div>
        </div>
      )}

      {/* Lista de instâncias */}
      <div className="space-y-2">
        {instances.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhuma instância encontrada
          </div>
        ) : (
          instances.map((instance) => (
            <div key={instance.instanceName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                {getStatusIcon(instance.connectionStatus)}
                <div>
                  <div className="font-medium text-gray-900">{instance.instanceName}</div>
                  <div className="text-sm text-gray-600">
                    {instance.phoneNumber && `📱 ${instance.phoneNumber}`}
                    {instance.profileName && ` • 👤 ${instance.profileName}`}
                  </div>
                  {instance.lastError && (
                    <div className="text-xs text-red-600">
                      ⚠️ {instance.lastError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(instance.connectionStatus)}`}>
                  {instance.connectionStatus === 'open' ? 'Conectado' : 
                   instance.connectionStatus === 'connecting' ? 'Conectando' : 
                   instance.connectionStatus === 'waiting_qr' ? 'Aguardando QR' : 'Desconectado'}
                </span>
                
                {instance.errorCount > 0 && (
                  <span className="text-xs text-red-600">
                    ({instance.errorCount} erros)
                  </span>
                )}
                
                {instance.reconnectAttempts > 0 && (
                  <span className="text-xs text-yellow-600">
                    ({instance.reconnectAttempts} tentativas)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Estatísticas */}
      {instances.length > 0 && (
        <div className="bg-blue-50 rounded-md p-3">
          <div className="text-sm font-medium text-blue-900 mb-2">Estatísticas</div>
          <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
            <div>
              <span className="font-medium">Total:</span> {instances.length}
            </div>
            <div>
              <span className="font-medium">Conectadas:</span> {instances.filter(i => i.connectionStatus === 'open').length}
            </div>
            <div>
              <span className="font-medium">Com erros:</span> {instances.filter(i => i.errorCount > 0).length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
