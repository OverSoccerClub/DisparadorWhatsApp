'use client'

import { useState, useCallback } from 'react'
import { Notification, NotificationAction } from '@/components/NotificationSystem'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      autoClose: notification.autoClose !== false,
      duration: notification.duration || 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Helper methods for common notification types
  const showSuccess = useCallback((title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'success',
      title,
      message,
      actions,
      duration: 4000
    })
  }, [addNotification])

  const showError = useCallback((title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'error',
      title,
      message,
      actions,
      duration: 6000
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      actions,
      duration: 5000
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'info',
      title,
      message,
      actions,
      duration: 4000
    })
  }, [addNotification])

  const showLoading = useCallback((title: string, message?: string, progress?: number) => {
    return addNotification({
      type: 'loading',
      title,
      message,
      progress,
      autoClose: false,
      duration: 0
    })
  }, [addNotification])

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    )
  }, [])

  const handleAction = useCallback((notificationId: string, action: NotificationAction) => {
    action.action()
    removeNotification(notificationId)
  }, [removeNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateNotification,
    handleAction
  }
}
