'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline'
import { useBackgroundMonitoring } from '@/hooks/useBackgroundMonitoring'

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
  const [monitoring, setMonitoring] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [autoReconnect, setAutoReconnect] = useState(true)
  const [checkInterval, setCheckInterval] = useState(30) // segundos

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
        onStatusChange?.(instancesWithStatus)
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }, [userId, onStatusChange])

  // Verificar status de uma instância específica
  const checkInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      const response = await fetch('/api/evolution/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, userId })
      })
      
      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error(`Erro ao verificar status da instância ${instanceName}:`, error)
      return null
    }
  }, [userId])

  // Tentar reconectar uma instância com estratégias inteligentes
  const reconnectInstance = useCallback(async (instanceName: string) => {
    try {
      console.log(`🔄 Iniciando reconexão inteligente para instância ${instanceName}...`)
      
      const response = await fetch('/api/evolution/smart-reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Instância ${instanceName} reconectada com sucesso usando estratégia: ${data.strategy}`)
        
        // Se requer escaneamento manual de QR Code
        if (data.requiresManualScan && data.qrCode) {
          console.log(`📱 QR Code necessário para instância ${instanceName}`)
          // Aqui você pode implementar um modal para mostrar o QR Code
          // Por enquanto, vamos apenas logar
          return { success: true, requiresQR: true, qrCode: data.qrCode, strategy: data.strategy }
        }
        
        return { success: true, requiresQR: false, strategy: data.strategy }
      } else {
        console.log(`❌ Falha ao reconectar instância ${instanceName}:`, data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error(`Erro ao reconectar instância ${instanceName}:`, error)
      return { success: false, error: error.message }
    }
  }, [userId])

  // Monitorar todas as instâncias
  const monitorInstances = useCallback(async () => {
    if (!monitoring) return

    console.log('🔍 Verificando status de todas as instâncias...')
    setLastCheck(new Date())

    const updatedInstances = await Promise.all(
      instances.map(async (instance) => {
        const status = await checkInstanceStatus(instance.instanceName)
        
        if (status) {
          const isConnected = status.connected && status.status === 'open'
          const wasConnected = instance.connectionStatus === 'open'
          
          // Se estava conectada e agora não está
          if (wasConnected && !isConnected) {
            console.log(`⚠️ Instância ${instance.instanceName} desconectou!`)
            
            // Tentar reconectar automaticamente
            if (autoReconnect && instance.reconnectAttempts < 3) {
              const reconnectResult = await reconnectInstance(instance.instanceName)
              if (reconnectResult.success) {
                if (reconnectResult.requiresQR) {
                  return {
                    ...instance,
                    connectionStatus: 'waiting_qr',
                    errorCount: instance.errorCount + 1,
                    reconnectAttempts: instance.reconnectAttempts + 1,
                    lastError: `QR Code necessário (${reconnectResult.strategy})`
                  }
                } else {
                  return {
                    ...instance,
                    connectionStatus: 'open',
                    errorCount: 0,
                    reconnectAttempts: 0,
                    lastError: undefined
                  }
                }
              } else {
                return {
                  ...instance,
                  connectionStatus: status.status || 'disconnected',
                  errorCount: instance.errorCount + 1,
                  reconnectAttempts: instance.reconnectAttempts + 1,
                  lastError: reconnectResult.error || 'Falha na reconexão automática'
                }
              }
            }
          }
          
          return {
            ...instance,
            connectionStatus: status.status || 'disconnected',
            phoneNumber: status.phoneNumber,
            lastSeen: status.lastSeen,
            profileName: status.profileName,
            errorCount: isConnected ? 0 : instance.errorCount + 1,
            lastError: isConnected ? undefined : instance.lastError
          }
        } else {
          // Erro na verificação
          return {
            ...instance,
            errorCount: instance.errorCount + 1,
            lastError: 'Erro na verificação de status'
          }
        }
      })
    )

    setInstances(updatedInstances)
    onStatusChange?.(updatedInstances)
  }, [monitoring, instances, autoReconnect, checkInstanceStatus, reconnectInstance, onStatusChange])

  // Iniciar/parar monitoramento
  useEffect(() => {
    if (monitoring) {
      const interval = setInterval(monitorInstances, checkInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [monitoring, checkInterval, monitorInstances])

  // Carregar instâncias na inicialização
  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'connecting': return <ArrowPathIcon className="h-4 w-4 text-yellow-600 animate-spin" />
      default: return <XCircleIcon className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monitor de Instâncias</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonitoring(!monitoring)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              monitoring 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {monitoring ? 'Parar Monitoramento' : 'Iniciar Monitoramento'}
          </button>
          
          <button
            onClick={loadInstances}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
          >
            Atualizar
          </button>
          
          <button
            onClick={async () => {
              const disconnectedInstances = instances.filter(i => i.connectionStatus !== 'open')
              if (disconnectedInstances.length === 0) {
                alert('✅ Todas as instâncias estão conectadas!')
                return
              }
              
              if (confirm(`🔄 Reconectar ${disconnectedInstances.length} instância(s) desconectada(s)?`)) {
                console.log('🚀 Iniciando reconexão em massa...')
                
                for (const instance of disconnectedInstances) {
                  console.log(`📱 Reconectando: ${instance.instanceName}`)
                  const result = await reconnectInstance(instance.instanceName)
                  
                  if (result.success && result.requiresQR) {
                    console.log(`📱 ${instance.instanceName}: QR Code necessário (${result.strategy})`)
                  } else if (result.success) {
                    console.log(`✅ ${instance.instanceName}: Reconectada (${result.strategy})`)
                  } else {
                    console.log(`❌ ${instance.instanceName}: Falha - ${result.error}`)
                  }
                  
                  // Aguardar entre reconexões
                  await new Promise(resolve => setTimeout(resolve, 2000))
                }
                
                // Recarregar lista após reconexões
                await loadInstances()
                alert('✅ Processo de reconexão concluído! Verifique o console para detalhes.')
              }
            }}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-200"
          >
            Reconectar Todas
          </button>
        </div>
      </div>

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
        
        {lastCheck && (
          <div className="text-xs text-gray-500">
            Última verificação: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </div>

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
                   instance.connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
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
                
                {instance.connectionStatus !== 'open' && (
                  <button
                    onClick={() => reconnectInstance(instance.instanceName)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    Reconectar
                  </button>
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
