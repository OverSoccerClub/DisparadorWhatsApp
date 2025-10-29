'use client'

import { ReactNode } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ErrorOverlayProps {
  open: boolean
  title?: string
  message?: string
  onClose?: () => void
  children?: ReactNode
}

export default function ErrorOverlay({ 
  open, 
  title = 'Erro', 
  message = 'Ocorreu um erro inesperado. Tente novamente.', 
  onClose,
  children 
}: ErrorOverlayProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
          <p className="mt-2 text-sm text-secondary-600">{message}</p>
          {children && (
            <div className="mt-4 text-sm text-secondary-700">
              {children}
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
