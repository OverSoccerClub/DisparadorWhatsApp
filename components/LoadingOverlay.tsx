'use client'

import { ReactNode } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface LoadingOverlayProps {
  open: boolean
  title?: string
  message?: string
  children?: ReactNode
}

export default function LoadingOverlay({ open, title = 'Carregando...', message = 'Estamos carregando os dados. Aguarde um momento.', children }: LoadingOverlayProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <ArrowPathIcon className="h-6 w-6 text-primary-600 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
          <p className="mt-1 text-sm text-secondary-600">{message}</p>
          {children && (
            <div className="mt-4 text-sm text-secondary-700">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


