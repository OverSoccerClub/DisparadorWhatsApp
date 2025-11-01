'use client'

import { useEffect, useRef } from 'react'
import ChipMaturationModal from './ChipMaturationModal'

interface BackgroundMaturationModalProps {
  isOpen: boolean
  onClose: () => void
  maturationId: string
}

/**
 * Wrapper do modal de maturação que configura o maturationId via evento
 */
export default function BackgroundMaturationModal({ isOpen, onClose, maturationId }: BackgroundMaturationModalProps) {
  const eventDispatchedRef = useRef(false)

  useEffect(() => {
    if (isOpen && maturationId && !eventDispatchedRef.current) {
      // Disparar evento para configurar o modal com o maturationId correto
      // Pequeno delay para garantir que o modal já está montado
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('maturation-start', {
          detail: { maturationId, runInBackground: false }
        }))
        eventDispatchedRef.current = true
      }, 100)
    } else if (!isOpen) {
      // Resetar quando fechar
      eventDispatchedRef.current = false
    }
  }, [isOpen, maturationId])

  return (
    <ChipMaturationModal
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

