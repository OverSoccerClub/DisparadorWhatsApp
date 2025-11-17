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
    if (open) {
      // Reset do contador quando modal abre
      setTimeLeft(Math.ceil(autoCloseDelay / 1000))
      
      // Timer para fechar o modal
      const timer = setTimeout(() => {
        if (onAutoCloseRef.current) onAutoCloseRef.current()
        if (onCloseRef.current) onCloseRef.current()
      }, autoCloseDelay)
      
      // Contador visual - fechar quando chegar a 1 segundo (antes de mostrar 0)
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdown)
            // Fechar imediatamente quando chegar a 1 segundo
            if (onAutoCloseRef.current) onAutoCloseRef.current()
            if (onCloseRef.current) onCloseRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        clearTimeout(timer)
        clearInterval(countdown)
      }
    } else {
      // Reset do contador quando modal fecha
      setTimeLeft(Math.ceil(autoCloseDelay / 1000))
    }
  }, [open, autoCloseDelay])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[10001]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <CheckCircleIcon className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
          <p className="mt-1 text-sm text-secondary-600">{message}</p>
          {children && (
            <div className="mt-4 text-sm text-secondary-700">
              {children}
            </div>
          )}
          {timeLeft > 0 && (
            <div className="mt-4 text-xs text-secondary-500">
              Fechando automaticamente em {timeLeft} segundos...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
