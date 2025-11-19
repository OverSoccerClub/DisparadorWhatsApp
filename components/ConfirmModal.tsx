'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  variant?: 'danger' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  variant = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 dark:bg-black/90 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md shadow-2xl border-2 border-secondary-200 dark:border-secondary-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              variant === 'danger' 
                ? 'bg-error-100 dark:bg-error-900/20 text-error-600 dark:text-error-400' 
                : 'bg-warning-100 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400'
            }`}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-2 text-secondary-900 dark:text-secondary-100">
                {title}
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
              variant === 'danger' 
                ? 'bg-error-600 dark:bg-error-500 hover:bg-error-700 dark:hover:bg-error-600' 
                : 'bg-warning-600 dark:bg-warning-500 hover:bg-warning-700 dark:hover:bg-warning-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
