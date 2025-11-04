'use client'

import { useEffect, useRef } from 'react'
import { useNotificationContext } from '@/components/NotificationProvider'

interface Schedule {
  id: string
  scheduled_start_at: string
  status: string
  maturation_id?: string
  number_of_rounds?: number
  minutes_per_round?: number
  pause_minutes_between_rounds?: number
  sessions?: string[]
}

// Função auxiliar para formatar data/hora
const formatScheduleDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Hook para monitorar agendamentos de maturação
 * Verifica agendamentos próximos (5 segundos antes) e quando iniciam
 * Funciona globalmente, mesmo quando componentes estão desmontados
 */
export function useScheduledMaturationMonitor() {
  const { showInfo, showSuccess } = useNotificationContext()
  const checkedScheduleIdsRef = useRef<Set<string>>(new Set())
  const notifiedUpcomingSchedulesRef = useRef<Set<string>>(new Set())
  const userChoiceRef = useRef<Map<string, 'acompanhar' | 'background'>>(new Map())
  const rateLimitBackoffRef = useRef<number>(30000) // Intervalo inicial: 30 segundos (reduzir requisições)
  const consecutiveErrorsRef = useRef<number>(0)
  // Evitar sobreposição de verificações (mutex simples)
  const inFlightRef = useRef<boolean>(false)
  
  // Callbacks que podem ser definidos externamente para abrir modal, etc
  const callbacksRef = useRef<{
    onMaturationStart?: (maturationId: string, runInBackground: boolean) => void
    onUpcomingMaturation?: (schedule: Schedule) => void
  }>({})
  
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null
    
    const scheduleNextCheck = (delay: number) => {
      if (checkInterval) clearInterval(checkInterval)
      // Adicionar jitter aleatório (±10%) para evitar picos sincronizados
      const jitter = Math.floor(delay * 0.1 * (Math.random() * 2 - 1))
      const nextDelay = Math.max(5000, delay + jitter)
      checkInterval = setInterval(checkScheduledMaturations, nextDelay)
    }
    
    const checkScheduledMaturations = async () => {
      if (inFlightRef.current) return // Ainda processando; não sobrepor
      inFlightRef.current = true
      try {
        // 1. Verificar agendamentos próximos (vão iniciar em breve - 5 segundos a 1 minuto)
        const upcomingRes = await fetch('/api/maturacao/execute-scheduled?checkUpcoming=true')
        
        // Tratar rate limit (429)
        if (upcomingRes.status === 429) {
          // Backoff exponencial: aumentar intervalo progressivamente
          consecutiveErrorsRef.current++
          rateLimitBackoffRef.current = Math.min(
            rateLimitBackoffRef.current * 2,
            60000 // Máximo: 1 minuto
          )
          
          // Reiniciar intervalo com backoff
          scheduleNextCheck(rateLimitBackoffRef.current)
          return // Não processar, aguardar próximo ciclo
        }
        
        // Se sucesso, resetar backoff e contador de erros apenas se havia sido aumentado
        if (upcomingRes.ok) {
          const previousBackoff = rateLimitBackoffRef.current
          consecutiveErrorsRef.current = 0
          rateLimitBackoffRef.current = 30000 // Resetar para 30s
          
          // Só redefinir intervalo se o backoff foi alterado
          if (previousBackoff !== 30000) {
            scheduleNextCheck(rateLimitBackoffRef.current)
          }
        }
        
        if (!upcomingRes.ok) return
        
        const upcomingData = await upcomingRes.json()
        
        if (upcomingData.success && upcomingData.upcomingSchedules) {
          const now = new Date()
          
          for (const schedule of upcomingData.upcomingSchedules) {
            // Verificar se está a 5 segundos ou menos do início e ainda não foi notificado
            // schedule.scheduled_start_at vem do banco em UTC (Supabase armazena em UTC)
            const scheduledStart = new Date(schedule.scheduled_start_at)
            const secondsUntilStart = (scheduledStart.getTime() - now.getTime()) / 1000
            
            if (secondsUntilStart <= 5 && secondsUntilStart > 0 && !notifiedUpcomingSchedulesRef.current.has(schedule.id)) {
              notifiedUpcomingSchedulesRef.current.add(schedule.id)
              
              // Calcular informações para exibir
              const sessionsList = Array.isArray(schedule.sessions) ? schedule.sessions : []
              const totalPauseMinutes = (schedule.number_of_rounds && schedule.number_of_rounds > 1 
                ? (schedule.number_of_rounds - 1) * (schedule.pause_minutes_between_rounds || 0) 
                : 0)
              const totalMinutes = ((schedule.number_of_rounds || 1) * (schedule.minutes_per_round || 10)) + totalPauseMinutes
              
              const detailsMessage = `📋 Detalhes da Maturação:\n` +
                `• Rodadas: ${schedule.number_of_rounds || 1}\n` +
                `• Tempo por rodada: ${schedule.minutes_per_round || 10} min\n` +
                `• Pausa entre rodadas: ${schedule.pause_minutes_between_rounds || 0} min\n` +
                `• Total estimado: ${totalMinutes} min\n` +
                `• Sessões: ${sessionsList.length} selecionadas\n` +
                `• Início: ${formatScheduleDateTime(schedule.scheduled_start_at)}`
              
              showInfo(
                '🚀 Maturação Agendada Iniciando',
                `Sua maturação agendada vai iniciar em ${Math.ceil(secondsUntilStart)} segundo(s).\n\n${detailsMessage}`,
                [{
                  label: 'Acompanhar em Tempo Real',
                  action: () => {
                    try {
                      userChoiceRef.current.set(schedule.id, 'acompanhar')
                      callbacksRef.current.onUpcomingMaturation?.(schedule)
                    } catch (error) {
                      // Erro silencioso
                    }
                  }
                }, {
                  label: 'Executar em Background',
                  action: () => {
                    try {
                      userChoiceRef.current.set(schedule.id, 'background')
                    } catch (error) {
                      // Erro silencioso
                    }
                  }
                }]
              )
            }
          }
        }
        
        // 2. Verificar agendamentos que estão na hora de iniciar (dentro da janela de execução)
        // Chamar o endpoint POST para executar agendamentos pendentes
        // Isso é necessário porque não há cron job externo configurado
        try {
          const executeRes = await fetch('/api/maturacao/execute-scheduled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          
          // Tratar rate limit (429)
          if (executeRes.status === 429) {
            consecutiveErrorsRef.current++
            rateLimitBackoffRef.current = Math.min(
              rateLimitBackoffRef.current * 2,
              120000 // Máximo: 2 minutos (aumentado para reduzir requisições)
            )
            
            // Reiniciar intervalo com backoff
            scheduleNextCheck(rateLimitBackoffRef.current)
            return
          }
          
          if (executeRes.ok) {
            const previousBackoff = rateLimitBackoffRef.current
            consecutiveErrorsRef.current = 0
            rateLimitBackoffRef.current = 10000
            
            // Só redefinir intervalo se o backoff foi alterado
            if (previousBackoff !== 10000) {
              scheduleNextCheck(rateLimitBackoffRef.current)
            }
          }
        } catch (error) {
          // Erro silencioso (pode ser problema de autenticação ou rede)
        }
        
        // 3. Verificar agendamentos que já iniciaram
        // IMPORTANTE: Tratar erros de autenticação e rate limit de forma graciosa
        try {
          const res = await fetch('/api/maturacao/execute-scheduled')
          
          // Tratar rate limit (429)
          if (res.status === 429) {
            consecutiveErrorsRef.current++
            rateLimitBackoffRef.current = Math.min(
              rateLimitBackoffRef.current * 2,
              120000 // Máximo: 2 minutos (aumentado para reduzir requisições)
            )
            
            // Reiniciar intervalo com backoff
            scheduleNextCheck(rateLimitBackoffRef.current)
            return
          }
          
          if (!res.ok) {
            // Se retornar erro de autenticação, não é crítico - apenas continuar
            if (res.status === 401) {
              // Silenciar erro 401 - pode acontecer se cookies expiraram temporariamente
              return
            }
            return
          }
          
          // Se sucesso, resetar backoff apenas se havia sido aumentado
          if (res.ok) {
            const previousBackoff = rateLimitBackoffRef.current
            consecutiveErrorsRef.current = 0
            rateLimitBackoffRef.current = 10000
            
            // Só redefinir intervalo se o backoff foi alterado
            if (previousBackoff !== 10000) {
              scheduleNextCheck(rateLimitBackoffRef.current)
            }
          }
          
          const data = await res.json()
          
          if (data.success && data.schedules) {
            // Filtrar agendamentos que começaram a executar recentemente
            const executingSchedules = data.schedules.filter((schedule: Schedule) => {
              return schedule.status === 'executando' 
                && schedule.maturation_id 
                && !checkedScheduleIdsRef.current.has(schedule.id)
            })
            
            for (const schedule of executingSchedules) {
              checkedScheduleIdsRef.current.add(schedule.id)
              const scheduledMaturationId = schedule.maturation_id!
              
              // Verificar escolha do usuário (se escolheu antes do início)
              const userChoice = userChoiceRef.current.get(schedule.id)
              
              if (userChoice === 'acompanhar') {
                // Usuário escolheu acompanhar em tempo real
                try {
                  callbacksRef.current.onMaturationStart?.(scheduledMaturationId, false)
                } catch (error) {
                  // Erro silencioso
                }
              } else if (userChoice === 'background') {
                // Usuário escolheu background
                try {
                  callbacksRef.current.onMaturationStart?.(scheduledMaturationId, true)
                } catch (error) {
                  // Erro silencioso
                }
              } else {
                // Usuário não escolheu antes (mostrar notificação)
                showSuccess(
                  '✅ Maturação Agendada Iniciada',
                  'Sua maturação agendada começou a ser executada agora.',
                  [{
                    label: 'Acompanhar',
                    action: () => {
                      try {
                        callbacksRef.current.onMaturationStart?.(scheduledMaturationId, false)
                      } catch (error) {
                        // Erro silencioso
                      }
                    }
                  }, {
                    label: 'Executar em Background',
                    action: () => {
                      try {
                        callbacksRef.current.onMaturationStart?.(scheduledMaturationId, true)
                      } catch (error) {
                        // Erro silencioso
                      }
                    }
                  }]
                )
              }
            }
          }
        } catch (error) {
          // Erro silencioso - não é crítico
        }
      } catch (error) {
        // Erro silencioso
      } finally {
        inFlightRef.current = false
      }
    }
    
    // Verificar a cada 30 segundos inicialmente (ajustado para evitar rate limit)
    // O intervalo será aumentado automaticamente se houver rate limit (backoff exponencial até 2 minutos)
    scheduleNextCheck(rateLimitBackoffRef.current)
    checkScheduledMaturations() // Verificar imediatamente
    
    return () => {
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [showInfo, showSuccess])
  
  // Retornar função para configurar callbacks
  return {
    setCallbacks: (callbacks: typeof callbacksRef.current) => {
      callbacksRef.current = { ...callbacksRef.current, ...callbacks }
    }
  }
}

