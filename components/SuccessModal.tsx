'use client'

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface SuccessModalProps {
  open: boolean
  title?: string
  message?: string
  children?: ReactNode
  onClose?: () => void
  onAutoClose?: () => void
  autoCloseDelay?: number
}

export default function SuccessModal({ 
  open, 
  title = 'Sucesso!', 
  message = 'Operacao realizada com sucesso.', 
  children,
  onClose,
  onAutoClose,
  autoCloseDelay = 5000
}: SuccessModalProps) {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(autoCloseDelay / 1000))
  
  // Usar refs para as funções para evitar re-execução
  const onCloseRef = useRef(onClose)
  const onAutoCloseRef = useRef(onAutoClose)
  
  // Atualizar refs quando as funções mudam
  useEffect(() => {
    onCloseRef.current = onClose
    onAutoCloseRef.current = onAutoClose
  }, [onClose, onAutoClose])
  
  // useEffect para controlar o timer
  useEffect(() => {
    if (!open) {
      // Reset do contador quando modal fecha
      setTimeLeft(Math.ceil(autoCloseDelay / 1000))
      return
    }

    // Reset do contador quando modal abre
    const initialTime = Math.ceil(autoCloseDelay / 1000)
    setTimeLeft(initialTime)
    
    // Timer principal para fechar o modal após o delay completo
    const timer = setTimeout(() => {
      if (onAutoCloseRef.current) onAutoCloseRef.current()
      if (onCloseRef.current) onCloseRef.current()
    }, autoCloseDelay)
    
    // Contador visual - decrementar a cada segundo
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1
        // Quando chegar a 0 ou menos, fechar o modal
        if (newTime <= 0) {
          clearInterval(countdown)
          // Fechar imediatamente
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
  }, [open, autoCloseDelay])

  // Fechar modal quando timeLeft chegar a 0
  useEffect(() => {
    if (open && timeLeft <= 0) {
      if (onAutoCloseRef.current) onAutoCloseRef.current()
      if (onCloseRef.current) onCloseRef.current()
    }
  }, [open, timeLeft])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[10001]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-secondary-800 rounded-lg shadow-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">{title}</h3>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{message}</p>
          {children && (
            <div className="mt-4 text-sm text-secondary-700 dark:text-secondary-300">
              {children}
            </div>
          )}
          {timeLeft > 0 && (
            <div className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">
              Fechando automaticamente em {timeLeft} segundos...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
