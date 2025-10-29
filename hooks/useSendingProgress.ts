import { useState, useCallback } from 'react'

export interface SendingProgress {
  totalMessages: number
  sentMessages: number
  failedMessages: number
  currentMessage?: string
  currentPhone?: string
  currentInstance?: string
  progress: number
  estimatedTime?: string
  distributionMethod?: string
  instanceName?: string
}

export interface SendingProgressState {
  isActive: boolean
  progress: SendingProgress
}

export function useSendingProgress() {
  const [state, setState] = useState<SendingProgressState>({
    isActive: false,
    progress: {
      totalMessages: 0,
      sentMessages: 0,
      failedMessages: 0,
      progress: 0
    }
  })

  const startSending = useCallback((totalMessages: number, distributionMethod?: string, instanceName?: string) => {
    setState({
      isActive: true,
      progress: {
        totalMessages,
        sentMessages: 0,
        failedMessages: 0,
        progress: 0,
        distributionMethod,
        instanceName
      }
    })
  }, [])

  const updateCurrentMessage = useCallback((message: string, phone: string, instance: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        currentMessage: message,
        currentPhone: phone,
        currentInstance: instance
      }
    }))
  }, [])

  const markMessageSent = useCallback(() => {
    setState(prev => {
      const newSent = prev.progress.sentMessages + 1
      const total = prev.progress.totalMessages
      const progress = total > 0 ? Math.round((newSent / total) * 100) : 0
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          sentMessages: newSent,
          progress,
          currentMessage: undefined,
          currentPhone: undefined,
          currentInstance: undefined
        }
      }
    })
  }, [])

  const markMessageFailed = useCallback(() => {
    setState(prev => {
      const newFailed = prev.progress.failedMessages + 1
      const total = prev.progress.totalMessages
      const progress = total > 0 ? Math.round(((prev.progress.sentMessages + newFailed) / total) * 100) : 0
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          failedMessages: newFailed,
          progress,
          currentMessage: undefined,
          currentPhone: undefined,
          currentInstance: undefined
        }
      }
    })
  }, [])

  const finishSending = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isActive: false,
      progress: {
        totalMessages: 0,
        sentMessages: 0,
        failedMessages: 0,
        progress: 0
      }
    })
  }, [])

  return {
    state,
    startSending,
    updateCurrentMessage,
    markMessageSent,
    markMessageFailed,
    finishSending,
    reset
  }
}
