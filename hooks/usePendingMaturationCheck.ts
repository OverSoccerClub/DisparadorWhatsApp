import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationContext } from '@/components/NotificationProvider'

/**
 * Hook para verificar agendamentos pendentes quando o usuário acessa o sistema
 * Mostra notificação se houver agendamentos ativos
 */
export function usePendingMaturationCheck() {
  const { user } = useAuth()
  const { showInfo } = useNotificationContext()
  const checkedRef = useRef(false)

  useEffect(() => {
    // Só verificar uma vez quando o usuário fizer login ou quando o sistema carregar
    if (!user || checkedRef.current) return

    const checkPendingSchedules = async () => {
      try {
        const res = await fetch('/api/maturacao/execute-scheduled')
        if (!res.ok) return

        const data = await res.json()
        if (data.success && data.schedules) {
          // Filtrar apenas agendamentos ativos (agendado, executando, pausado)
          const activeSchedules = data.schedules.filter((schedule: any) => 
            ['agendado', 'executando', 'pausado'].includes(schedule.status)
          )

          if (activeSchedules.length > 0) {
            checkedRef.current = true
            
            const formatDate = (dateString: string): string => {
              try {
                const date = new Date(dateString)
                const day = String(date.getDate()).padStart(2, '0')
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                return `${day}/${month}, ${hours}:${minutes}`
              } catch {
                return dateString
              }
            }

            const schedulesList = activeSchedules
              .slice(0, 3)
              .map((s: any) => `• ${formatDate(s.scheduled_start_at)}`)
              .join('\n')
            
            const moreText = activeSchedules.length > 3 
              ? `\n... e mais ${activeSchedules.length - 3} agendamento(s)` 
              : ''

            showInfo(
              '📅 Agendamentos de Maturação Ativos',
              `Você tem ${activeSchedules.length} agendamento(s) de maturação ativo(s):\n\n${schedulesList}${moreText}\n\nAcesse a página de Disparos para gerenciá-los.`,
              []
            )
          }
        }
      } catch (error) {
        // Silenciar erros - não é crítico
      }
    }

    // Aguardar um pouco após o carregamento para não sobrecarregar
    const timeout = setTimeout(checkPendingSchedules, 2000)
    
    return () => clearTimeout(timeout)
  }, [user, showInfo])
}

