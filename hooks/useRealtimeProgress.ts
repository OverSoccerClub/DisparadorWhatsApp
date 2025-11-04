import { useState, useEffect, useCallback } from 'react'

export interface MessageLog {
  phone: string
  message: string
  instance: string
  status: 'sent' | 'failed'
  timestamp: number
}

export interface RealtimeProgress {
  totalMessages: number
  sentMessages: number
  failedMessages: number
  currentMessage?: string
  currentPhone?: string
  currentInstance?: string
  progress: number
  status: 'sending' | 'success' | 'error'
  estimatedTime?: string
  nextMessageAt?: number // Timestamp para próxima mensagem (para cronômetro)
  messageLogs?: MessageLog[] // Logs precisos de cada mensagem enviada
}

export function useRealtimeProgress(sessionId: string | null) {
  const [progress, setProgress] = useState<RealtimeProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const updateProgress = useCallback(async (action: string, data?: any) => {
    if (!sessionId) return

    try {
      await fetch('/api/disparos/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action, data })
      })
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
    }
  }, [sessionId])

  const startProgress = useCallback((totalMessages: number) => {
    updateProgress('start', { totalMessages })
  }, [updateProgress])

  const updateCurrent = useCallback((message: string, phone: string, instance: string) => {
    updateProgress('updateCurrent', { message, phone, instance })
  }, [updateProgress])

  const markSent = useCallback(() => {
    updateProgress('markSent')
  }, [updateProgress])

  const markFailed = useCallback(() => {
    updateProgress('markFailed')
  }, [updateProgress])

  const finish = useCallback(() => {
    updateProgress('finish')
  }, [updateProgress])

  const setError = useCallback(() => {
    updateProgress('error')
  }, [updateProgress])

  const clear = useCallback(() => {
    updateProgress('clear')
    setProgress(null)
  }, [updateProgress])

  // Polling para atualizações (em produção, use WebSockets)
  useEffect(() => {
    if (!sessionId) return

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/disparos/progress?sessionId=${sessionId}`)
        if (response.status === 404) {
          // Ainda sem progresso armazenado para esta sessão; ignorar silenciosamente
          setIsConnected(false)
          return
        }
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setProgress(data.progress)
            setIsConnected(true)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar progresso:', error)
        setIsConnected(false)
      }
    }

    // Polling a cada 2 segundos
    const interval = setInterval(pollProgress, 2000)
    pollProgress() // Primeira chamada imediata

    return () => clearInterval(interval)
  }, [sessionId])

  return {
    progress,
    isConnected,
    startProgress,
    updateCurrent,
    markSent,
    markFailed,
    finish,
    setError,
    clear
  }
}
