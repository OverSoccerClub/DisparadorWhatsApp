'use client'

import { useState, useEffect, useCallback } from 'react'

interface BackgroundMonitoringConfig {
  interval: number
  autoReconnect: boolean
  maxReconnectAttempts: number
  reconnectDelay: number
}

interface BackgroundMonitoringStatus {
  isActive: boolean
  interval: number
  autoReconnect: boolean
  startedAt: string
  stoppedAt?: string
}

interface InstanceStatus {
  totalInstances: number
  connectedInstances: number
  disconnectedInstances: number
  lastCheck: string
  reconnectAttempts: number
  instances?: Array<{
    instanceName: string
    connectionStatus: string
    phoneNumber?: string
    lastSeen?: string
    profileName?: string
    errorCount: number
    reconnectAttempts: number
  }>
}

interface BackgroundMonitoringHook {
  isMonitoring: boolean
  status: InstanceStatus | null
  config: BackgroundMonitoringStatus | null
  startMonitoring: (config?: Partial<BackgroundMonitoringConfig>) => Promise<boolean>
  stopMonitoring: () => Promise<boolean>
  reconnectAll: () => Promise<boolean>
  refreshStatus: () => Promise<void>
  error: string | null
  loading: boolean
}

export function useBackgroundMonitoring(userId: string): BackgroundMonitoringHook {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [status, setStatus] = useState<InstanceStatus | null>(null)
  const [config, setConfig] = useState<BackgroundMonitoringStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Verificar status do monitoramento
  const refreshStatus = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/background-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'get_status' })
      })

      const data = await response.json()

      if (data.success) {
        setIsMonitoring(data.isActive || false)
        setConfig({
          isActive: data.isActive,
          interval: data.config?.intervalSeconds * 1000 || 30000,
          autoReconnect: data.config?.autoReconnect || false,
          startedAt: new Date().toISOString()
        })
        setStatus({
          totalInstances: data.summary?.total || 0,
          connectedInstances: data.summary?.connected || 0,
          disconnectedInstances: data.summary?.disconnected || 0,
          lastCheck: new Date().toISOString(),
          reconnectAttempts: 0,
          instances: data.instances || []
        })
      } else {
        setError(data.error || 'Erro ao obter status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Iniciar monitoramento em background
  const startMonitoring = useCallback(async (customConfig?: Partial<BackgroundMonitoringConfig>) => {
    if (!userId) return false

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/background-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'start_monitoring',
          config: customConfig
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsMonitoring(true)
        await refreshStatus()
        return true
      } else {
        setError(data.error || 'Erro ao iniciar monitoramento')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, refreshStatus])

  // Parar monitoramento em background
  const stopMonitoring = useCallback(async () => {
    if (!userId) return false

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/background-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'stop_monitoring' })
      })

      const data = await response.json()

      if (data.success) {
        setIsMonitoring(false)
        await refreshStatus()
        return true
      } else {
        setError(data.error || 'Erro ao parar monitoramento')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, refreshStatus])

  // Reconectar todas as instâncias
  const reconnectAll = useCallback(async () => {
    if (!userId) return false

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/background-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reconnect_all' })
      })

      const data = await response.json()

      if (data.success) {
        await refreshStatus()
        return true
      } else {
        setError(data.error || 'Erro na reconexão')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, refreshStatus])

  // Verificar status na inicialização
  useEffect(() => {
    if (userId) {
      refreshStatus()
    }
  }, [userId, refreshStatus])

  // Atualizar status periodicamente quando monitoramento está ativo
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      refreshStatus()
    }, 10000) // Atualizar a cada 10 segundos

    return () => clearInterval(interval)
  }, [isMonitoring, refreshStatus])

  return {
    isMonitoring,
    status,
    config,
    startMonitoring,
    stopMonitoring,
    reconnectAll,
    refreshStatus,
    error,
    loading
  }
}
