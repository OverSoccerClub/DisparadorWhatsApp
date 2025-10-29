'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  progress?: number
  autoClose?: boolean
}

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
  onAction?: (notificationId: string, action: NotificationAction) => void
}

export default function NotificationSystem({ 
  notifications, 
  onRemove, 
  onAction 
}: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-success-500" />
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-error-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-warning-500" />
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-primary-500" />
      case 'loading':
        return <ArrowPathIcon className="h-6 w-6 text-primary-500 animate-spin" />
      default:
        return <InformationCircleIcon className="h-6 w-6 text-secondary-500" />
    }
  }

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800'
      case 'error':
        return 'bg-error-50 border-error-200 text-error-800'
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800'
      case 'info':
        return 'bg-primary-50 border-primary-200 text-primary-800'
      case 'loading':
        return 'bg-secondary-50 border-secondary-200 text-secondary-800'
      default:
        return 'bg-secondary-50 border-secondary-200 text-secondary-800'
    }
  }

  const getActionButtonStyles = (variant: NotificationAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 text-white hover:bg-primary-700'
      case 'secondary':
        return 'bg-secondary-200 text-secondary-800 hover:bg-secondary-300'
      case 'danger':
        return 'bg-error-600 text-white hover:bg-error-700'
      default:
        return 'bg-primary-600 text-white hover:bg-primary-700'
    }
  }

  const handleAction = (notificationId: string, action: NotificationAction) => {
    if (onAction) {
      onAction(notificationId, action)
    }
  }

  const handleClose = (notificationId: string) => {
    onRemove(notificationId)
  }

  if (visibleNotifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out
            ${getNotificationStyles(notification.type)}
            animate-in slide-in-from-right-full
          `}
        >
          {/* Progress Bar para loading */}
          {notification.type === 'loading' && notification.progress !== undefined && (
            <div className="absolute top-0 left-0 h-1 bg-primary-200 w-full">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${notification.progress}%` }}
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  {notification.title}
                </h3>
                
                {notification.message && (
                  <p className="mt-1 text-sm opacity-90">
                    {notification.message}
                  </p>
                )}

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAction(notification.id, action)}
                        className={`
                          px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                          ${getActionButtonStyles(action.variant)}
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              {notification.autoClose !== false && (
                <button
                  onClick={() => handleClose(notification.id)}
                  className="ml-3 flex-shrink-0 text-current opacity-50 hover:opacity-75 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Auto-close timer visual */}
          {notification.duration && notification.autoClose !== false && (
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20">
              <div 
                className="h-full bg-current opacity-40 transition-all ease-linear"
                style={{ 
                  width: '100%',
                  animation: `shrink ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
