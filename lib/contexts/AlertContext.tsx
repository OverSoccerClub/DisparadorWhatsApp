'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { AlertVariant } from '@/components/AlertModal'

interface AlertState {
  open: boolean
  title?: string
  message?: string
  variant: AlertVariant
  autoCloseDelay?: number
}

interface AlertContextType {
  alert: AlertState
  showAlert: (message: string, variant?: AlertVariant, title?: string, autoCloseDelay?: number) => void
  showSuccess: (message: string, title?: string, autoCloseDelay?: number) => void
  showError: (message: string, title?: string, autoCloseDelay?: number) => void
  showWarning: (message: string, title?: string, autoCloseDelay?: number) => void
  showInfo: (message: string, title?: string, autoCloseDelay?: number) => void
  closeAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
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

  return (
    <AlertContext.Provider value={{
      alert,
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closeAlert
    }}>
      {children}
    </AlertContext.Provider>
  )
}

// Funções no-op para uso durante SSR quando o contexto não está disponível
const noopContext: AlertContextType = {
  alert: { open: false, variant: 'info' },
  showAlert: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  closeAlert: () => {}
}

export function useAlertContext() {
  const context = useContext(AlertContext)
  // Durante SSR ou quando o contexto não está disponível, retornar funções no-op
  if (context === undefined) {
    // Em ambiente de servidor, retornar no-op para evitar erros
    if (typeof window === 'undefined') {
      return noopContext
    }
    // No cliente, ainda lançar erro se não estiver dentro do provider
    throw new Error('useAlertContext must be used within an AlertProvider')
  }
  return context
}

