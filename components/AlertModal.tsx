'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertModalProps {
  open: boolean
  title?: string
  message?: string
  variant?: AlertVariant
  children?: ReactNode
  onClose?: () => void
  onAutoClose?: () => void
  autoCloseDelay?: number
  showCloseButton?: boolean
}

const variantConfig: Record<AlertVariant, { icon: typeof CheckCircleIcon; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircleIcon,
    color: 'text-success-600',
    bgColor: 'bg-success-50 dark:bg-success-900/20'
  },
  error: {
    icon: XCircleIcon,
    color: 'text-error-600',
    bgColor: 'bg-error-50 dark:bg-error-900/20'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20'
  },
  info: {
    icon: InformationCircleIcon,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20'
  }
}

export default function AlertModal({ 
  open, 
  title, 
  message, 
  variant = 'info',
  children,
  onClose,
  onAutoClose,
  autoCloseDelay,
  showCloseButton = true
}: AlertModalProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  
  const onCloseRef = useRef(onClose)
  const onAutoCloseRef = useRef(onAutoClose)
  
  useEffect(() => {
    onCloseRef.current = onClose
    onAutoCloseRef.current = onAutoClose
  }, [onClose, onAutoClose])
  
  useEffect(() => {
    if (!open) {
      setTimeLeft(null)
      return
    }

    if (autoCloseDelay && autoCloseDelay > 0) {
      const initialTime = Math.ceil(autoCloseDelay / 1000)
      setTimeLeft(initialTime)
      
      const timer = setTimeout(() => {
        if (onAutoCloseRef.current) onAutoCloseRef.current()
        if (onCloseRef.current) onCloseRef.current()
      }, autoCloseDelay)
      
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null
          const newTime = prev - 1
          if (newTime <= 0) {
            clearInterval(countdown)
            if (onAutoCloseRef.current) onAutoCloseRef.current()
            if (onCloseRef.current) onCloseRef.current()
            return 0
          }
          return newTime
        })
      }, 1000)
      
      return () => {
        clearTimeout(timer)
        clearInterval(countdown)
      }
    } else {
      setTimeLeft(null)
    }
  }, [open, autoCloseDelay])
  
  if (!open) return null
  
  const config = variantConfig[variant]
  const Icon = config.icon
  
  // Títulos padrão por variante
  const defaultTitles: Record<AlertVariant, string> = {
    success: 'Sucesso!',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
  }
  
  const displayTitle = title || defaultTitles[variant]
  
  return (
    <div className="fixed inset-0 z-[10001]">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-lg shadow-xl p-6 text-center">
          <div className={`flex items-center justify-center mb-3 w-12 h-12 mx-auto rounded-full ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
            {displayTitle}
          </h3>
          {message && (
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              {message}
            </p>
          )}
          {children && (
            <div className="mt-4 text-sm text-secondary-700 dark:text-secondary-300">
              {children}
            </div>
          )}
          {timeLeft !== null && timeLeft > 0 && (
            <div className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">
              Fechando automaticamente em {timeLeft} segundos...
            </div>
          )}
          {showCloseButton && !autoCloseDelay && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

