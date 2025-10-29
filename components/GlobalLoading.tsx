'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Mostrar loading ao trocar de página
    setIsLoading(true)

    // Aguardar o carregamento completo
    const timer = setTimeout(() => {
      // Verificar se o DOM está completamente carregado
      if (document.readyState === 'complete') {
        setIsLoading(false)
      } else {
        // Se ainda não carregou, aguardar o evento de load
        window.addEventListener('load', () => {
          setIsLoading(false)
        })
      }
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname])

  // Também verificar quando o documento está pronto
  useEffect(() => {
    const handleLoad = () => {
      // Adicionar um pequeno delay para garantir que tudo renderizou
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-secondary-50">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Logo/Ícone */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <div className="h-16 w-16 rounded-full bg-primary-400 opacity-30"></div>
              </div>
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
          </div>
          
          {/* Título */}
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            WhatsApp Dispatcher
          </h2>
          
          {/* Mensagem */}
          <p className="text-sm text-secondary-600 mb-4">
            Carregando página...
          </p>
          
          {/* Barra de progresso animada */}
          <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-progress"></div>
          </div>
          
          {/* Texto adicional */}
          <p className="mt-4 text-xs text-secondary-500">
            Aguarde enquanto preparamos tudo para você...
          </p>
        </div>
      </div>
    </div>
  )
}

