'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationSystem from './NotificationSystem'

interface NotificationContextType {
  showSuccess: (title: string, message?: string, actions?: any[]) => string
  showError: (title: string, message?: string, actions?: any[]) => string
  showWarning: (title: string, message?: string, actions?: any[]) => string
  showInfo: (title: string, message?: string, actions?: any[]) => string
  showLoading: (title: string, message?: string, progress?: number) => string
  updateNotification: (id: string, updates: any) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateNotification,
    removeNotification,
    clearAll,
    handleAction
  } = useNotifications()

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateNotification,
    removeNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
        onAction={handleAction}
      />
    </NotificationContext.Provider>
  )
}
