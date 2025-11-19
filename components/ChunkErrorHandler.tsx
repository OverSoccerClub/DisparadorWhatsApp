// Error boundary para tratar erros de chunk loading
'use client'

import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      // IGNORAR erros de hot-update (causam loop infinito)
      if (event.message?.includes('webpack.hot-update') || 
          event.message?.includes('hot-update.json') ||
          event.filename?.includes('webpack.hot-update')) {
        console.log('⚠️ Erro de hot-update ignorado (não é um erro real)')
        return
      }
      
      if (event.message?.includes('ChunkLoadError') || event.message?.includes('Loading chunk')) {
        console.log('🔄 ChunkLoadError detectado, recarregando página...')
        
        // Limpar cache do localStorage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Recarregar a página após um pequeno delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // IGNORAR erros de hot-update (causam loop infinito)
      if (event.reason?.message?.includes('webpack.hot-update') ||
          event.reason?.message?.includes('hot-update.json')) {
        console.log('⚠️ Erro de hot-update ignorado (não é um erro real)')
        return
      }
      
      if (event.reason?.message?.includes('ChunkLoadError') || 
          event.reason?.message?.includes('Loading chunk')) {
        console.log('🔄 ChunkLoadError em Promise detectado, recarregando página...')
        
        // Limpar cache do localStorage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Recarregar a página após um pequeno delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    // Adicionar listeners para erros de chunk
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
