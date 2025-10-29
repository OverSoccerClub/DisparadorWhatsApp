'use client'

import { useState, useEffect, useCallback } from 'react'

interface KeepAliveConfig {
  interval: number
  enabled: boolean
}

interface KeepAliveStatus {
  isActive: boolean
  config: KeepAliveConfig | null
  instances: Array<{
    instanceName: string
    lastPing: string
    status: 'active' | 'inactive' | 'error'
    errorCount: number
  }>
  summary: {
    total: number
    active: number
    inactive: number
    errors: number
  }
}

interface KeepAliveHook {
  isActive: boolean
  status: KeepAliveStatus | null
  startKeepAlive: (config?: Partial<KeepAliveConfig>) => Promise<boolean>
  stopKeepAlive: () => Promise<boolean>
  refreshStatus: () => Promise<void>
  error: string | null
  loading: boolean
}

export function useKeepAlive(userId: string): KeepAliveHook {
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<KeepAliveStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Verificar status do keep-alive
  const refreshStatus = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/evolution/keep-alive?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setIsActive(data.isActive)
        setStatus({
          isActive: data.isActive,
          config: data.config,
          instances: data.instances || [],
          summary: data.summary || { total: 0, active: 0, inactive: 0, errors: 0 }
        })
      } else {
        setError(data.error || 'Erro ao obter status do keep-alive')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Iniciar keep-alive
  const startKeepAlive = useCallback(async (customConfig?: Partial<KeepAliveConfig>) => {
    if (!userId) return false

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/keep-alive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'start_keepalive',
          config: customConfig
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsActive(true)
        await refreshStatus()
        return true
      } else {
        setError(data.error || 'Erro ao iniciar keep-alive')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, refreshStatus])

  // Parar keep-alive
  const stopKeepAlive = useCallback(async () => {
    if (!userId) return false

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evolution/keep-alive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'stop_keepalive'
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsActive(false)
        await refreshStatus()
        return true
      } else {
        setError(data.error || 'Erro ao parar keep-alive')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, refreshStatus])

  // Verificar status quando o componente montar
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  // Atualizar status periodicamente quando ativo
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      refreshStatus()
    }, 10000) // Atualizar a cada 10 segundos

    return () => clearInterval(interval)
  }, [isActive, refreshStatus])

  return {
    isActive,
    status,
    startKeepAlive,
    stopKeepAlive,
    refreshStatus,
    error,
    loading
  }
}
