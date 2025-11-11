'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInactivityTimeoutOptions {
  timeout: number // Tempo em milissegundos (30 minutos = 30 * 60 * 1000)
  onTimeout: () => void // Callback quando o timeout é atingido
  events?: string[] // Eventos que resetam o timer
  enabled?: boolean // Se o monitoramento está habilitado
}

/**
 * Hook para monitorar inatividade do usuário e executar callback após timeout
 */
export function useInactivityTimeout({
  timeout,
  onTimeout,
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  enabled = true
}: UseInactivityTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Função para resetar o timer
  const resetTimer = useCallback(() => {
    if (!enabled) return

    // Limpar timer anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Atualizar última atividade
    lastActivityRef.current = Date.now()

    // Criar novo timer
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      
      // Verificar se realmente passou o timeout (pode haver pequenas diferenças)
      if (timeSinceLastActivity >= timeout) {
        onTimeout()
      }
    }, timeout)
  }, [timeout, onTimeout, enabled])

  // Função para verificar inatividade
  const checkInactivity = useCallback(() => {
    if (!enabled) return

    const timeSinceLastActivity = Date.now() - lastActivityRef.current
    
    if (timeSinceLastActivity >= timeout) {
      onTimeout()
    } else {
      // Resetar timer com o tempo restante
      resetTimer()
    }
  }, [timeout, onTimeout, enabled, resetTimer])

  useEffect(() => {
    if (!enabled) {
      // Limpar timer se desabilitado
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Iniciar timer na montagem
    resetTimer()

    // Adicionar listeners para eventos de atividade
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true })
    })

    // Verificar inatividade quando a janela ganha foco
    window.addEventListener('focus', checkInactivity)
    
    // Verificar inatividade quando a página fica visível
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkInactivity()
      }
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      events.forEach(event => {
        window.removeEventListener(event, resetTimer)
      })
      
      window.removeEventListener('focus', checkInactivity)
    }
  }, [enabled, events, resetTimer, checkInactivity])

  // Retornar função para resetar manualmente
  return {
    reset: resetTimer,
    getLastActivity: () => lastActivityRef.current
  }
}

