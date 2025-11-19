'use client'

import { useState, useCallback } from 'react'
import type { AlertVariant } from '@/components/AlertModal'

interface AlertState {
  open: boolean
  title?: string
  message?: string
  variant: AlertVariant
  autoCloseDelay?: number
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    variant: 'info'
  })

  const showAlert = useCallback((
    message: string,
    variant: AlertVariant = 'info',
    title?: string,
    autoCloseDelay?: number
  ) => {
    setAlert({
      open: true,
      message,
      variant,
      title,
      autoCloseDelay: autoCloseDelay ?? (variant === 'error' ? 0 : 5000)
    })
  }, [])

  const showSuccess = useCallback((message: string, title?: string, autoCloseDelay?: number) => {
    showAlert(message, 'success', title, autoCloseDelay)
  }, [showAlert])

  const showError = useCallback((message: string, title?: string, autoCloseDelay?: number) => {
    showAlert(message, 'error', title, autoCloseDelay)
  }, [showAlert])

  const showWarning = useCallback((message: string, title?: string, autoCloseDelay?: number) => {
    showAlert(message, 'warning', title, autoCloseDelay)
  }, [showAlert])

  const showInfo = useCallback((message: string, title?: string, autoCloseDelay?: number) => {
    showAlert(message, 'info', title, autoCloseDelay)
  }, [showAlert])

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }))
  }, [])

  return {
    alert,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert
  }
}

