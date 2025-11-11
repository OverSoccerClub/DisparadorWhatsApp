'use client'

import { useEffect, useState, useRef } from 'react'
import { XMarkIcon, SparklesIcon, DevicePhoneMobileIcon, ClockIcon, PlayIcon, StopIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, CalendarIcon, ArrowsPointingOutIcon, PauseIcon, TrashIcon } from '@heroicons/react/24/outline'
import SuccessModal from './SuccessModal'
import ConfirmModal from './ConfirmModal'
import { useNotificationContext } from './NotificationProvider'

interface SessionItem {
  type?: 'waha' | 'evolution' // Tipo de sessão/instância
  serverId?: string // Para WAHA
  serverName: string
  sessionName: string
  status: string
  phoneNumber?: string
}

interface ChipMaturationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChipMaturationModal({ isOpen, onClose }: ChipMaturationModalProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [cadenceSeconds, setCadenceSeconds] = useState(60)
  const [numberOfRounds, setNumberOfRounds] = useState(1)
  const [minutesPerRound, setMinutesPerRound] = useState(10)
  const [pauseMinutesBetweenRounds, setPauseMinutesBetweenRounds] = useState(5)
  const [messageTemplates, setMessageTemplates] = useState<string>(
    'Olá! Como você está?\nTudo certo por aí?\nÓtimo conversar com você!'
  )
  
  // Agendamento
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('')
  
  // Calcular tempo total estimado (rodadas × tempo por rodada + pausas entre rodadas)
  // Pausa entre rodadas: (numberOfRounds - 1) * pauseMinutesBetweenRounds
  const totalPauseMinutes = numberOfRounds > 1 ? (numberOfRounds - 1) * pauseMinutesBetweenRounds : 0
  const totalMinutes = (numberOfRounds * minutesPerRound) + totalPauseMinutes
  
  // Calcular data/hora final baseada nas configurações
  const calculateEndDateTime = (): { endDate: string; endTime: string; endDateTime: Date | null } => {
    if (!scheduleEnabled || !scheduledDate || !scheduledTime) {
      return { endDate: '', endTime: '', endDateTime: null }
    }
    
    try {
      const startDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const endDateTime = new Date(startDateTime.getTime() + (totalMinutes * 60 * 1000))
      
      const endDate = endDateTime.toISOString().split('T')[0]
      const endTime = endDateTime.toTimeString().slice(0, 5)
      
      return { endDate, endTime, endDateTime }
    } catch {
      return { endDate: '', endTime: '', endDateTime: null }
    }
  }
  
  const { endDate, endTime, endDateTime } = calculateEndDateTime()
  
  // Função auxiliar para formatar data/hora
  const formatEndDateTime = (date: Date | null): string => {
    if (!date) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  const [maturationId, setMaturationId] = useState<string | null>(null)
  const [progress, setProgress] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [runInBackground, setRunInBackground] = useState(false)
  const { showInfo, showSuccess, showError } = useNotificationContext()
  
  // Refs para controlar polling quando em background
  const backgroundMaturationIdRef = useRef<string | null>(null)
  const backgroundProgressRef = useRef<any>(null)
  
  // Lista de agendamentos
  const [schedules, setSchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [showSchedulesList, setShowSchedulesList] = useState(false)
  
  // Modal de confirmação
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger' as 'danger' | 'warning'
  })
  
  // Inicializar data/hora com valores padrão (hoje e hora atual + 1 hora)
  useEffect(() => {
    if (isOpen && !scheduledDate) {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0) // 09:00 do dia seguinte
      
      setScheduledDate(tomorrow.toISOString().split('T')[0])
      setScheduledTime(tomorrow.toTimeString().slice(0, 5))
    }
  }, [isOpen, scheduledDate])
  
  // Carregar agendamentos quando modal abrir
  const loadSchedules = async () => {
    setLoadingSchedules(true)
    try {
      const res = await fetch('/api/maturacao/execute-scheduled')
      const data = await res.json()
      if (data.success && data.schedules) {
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('[FRONTEND] Erro ao carregar agendamentos:', error)
    } finally {
      setLoadingSchedules(false)
    }
  }
  
  useEffect(() => {
    if (isOpen) {
      loadSchedules()
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadSchedules, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen])
  
  // Funções para pausar e cancelar
  const handlePauseSchedule = async (scheduleId: string) => {
    try {
      const res = await fetch('/api/maturacao/schedule/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        showSuccess('Agendamento Pausado', 'O agendamento foi pausado com sucesso.')
        loadSchedules() // Recarregar lista
      } else {
        showError('Erro ao pausar', data.error || 'Não foi possível pausar o agendamento.')
      }
    } catch (error) {
      showError('Erro ao pausar', 'Erro ao pausar agendamento: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handleCancelSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    setConfirmModal({
      open: true,
      title: 'Cancelar Agendamento',
      message: `Tem certeza que deseja cancelar este agendamento${schedule ? ` (${formatScheduleDateTime(schedule.scheduled_start_at)})` : ''}? Esta ação não pode ser desfeita.`,
      variant: 'warning',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, open: false })
        try {
          const res = await fetch('/api/maturacao/schedule/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduleId })
          })
          
          const data = await res.json()
          
          if (res.ok && data.success) {
            showSuccess('Agendamento Cancelado', 'O agendamento foi cancelado com sucesso.')
            loadSchedules() // Recarregar lista
          } else {
            showError('Erro ao cancelar', data.error || 'Não foi possível cancelar o agendamento.')
          }
        } catch (error) {
          showError('Erro ao cancelar', 'Erro ao cancelar agendamento: ' + (error instanceof Error ? error.message : String(error)))
        }
      }
    })
  }
  
  const handleResumeSchedule = async (scheduleId: string) => {
    // Encontrar o agendamento na lista para verificar data
    const schedule = schedules.find(s => s.id === scheduleId)
    
    if (schedule) {
      const scheduledDate = new Date(schedule.scheduled_start_at)
      const now = new Date()
      
      // Se a data já passou, avisar o usuário
      if (scheduledDate <= now) {
        setConfirmModal({
          open: true,
          title: 'Retomar Agendamento',
          message: `A data/hora deste agendamento (${formatScheduleDateTime(schedule.scheduled_start_at)}) já passou. Deseja retomar mesmo assim? O sistema tentará executar imediatamente.`,
          variant: 'warning',
          onConfirm: async () => {
            setConfirmModal({ ...confirmModal, open: false })
            await executeResume(scheduleId, schedule)
          }
        })
        return
      }
    }
    
    await executeResume(scheduleId, schedule)
  }
  
  const executeResume = async (scheduleId: string, schedule?: any) => {
    try {
      const res = await fetch('/api/maturacao/schedule/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        const message = schedule && new Date(schedule.scheduled_start_at) <= new Date()
          ? 'O agendamento foi retomado e será executado imediatamente.'
          : 'O agendamento foi retomado e voltou para a fila de execução.'
        showSuccess('Agendamento Retomado', message)
        loadSchedules() // Recarregar lista
      } else {
        showError('Erro ao retomar', data.error || 'Não foi possível retomar o agendamento.')
      }
    } catch (error) {
      showError('Erro ao retomar', 'Erro ao retomar agendamento: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handleDeleteSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    setConfirmModal({
      open: true,
      title: 'Excluir Agendamento',
      message: `Tem certeza que deseja excluir permanentemente este agendamento${schedule ? ` (${formatScheduleDateTime(schedule.scheduled_start_at)})` : ''}? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, open: false })
        try {
          const res = await fetch(`/api/maturacao/schedule/cancel?id=${scheduleId}`, {
            method: 'DELETE'
          })
          
          const data = await res.json()
          
          if (res.ok && data.success) {
            showSuccess('Agendamento Excluído', 'O agendamento foi excluído permanentemente.')
            loadSchedules() // Recarregar lista
          } else {
            showError('Erro ao excluir', data.error || 'Não foi possível excluir o agendamento.')
          }
        } catch (error) {
          showError('Erro ao excluir', 'Erro ao excluir agendamento: ' + (error instanceof Error ? error.message : String(error)))
        }
      }
    })
  }
  
  // Formatar data/hora para exibição
  // IMPORTANTE: dateString vem do Supabase em UTC, mas precisamos exibir no horário local do usuário
  const formatScheduleDateTime = (dateString: string): string => {
    try {
      if (!dateString) return ''
      
      // dateString vem em UTC do Supabase (ex: "2025-11-01T19:04:00.000Z" ou "2025-11-01T19:04:00+00:00")
      // Quando criamos new Date(dateString), o JavaScript já converte automaticamente para o timezone local
      // Então formatar sem especificar timeZone usa automaticamente o timezone do navegador
      const date = new Date(dateString)
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('[formatScheduleDateTime] Data inválida:', dateString)
        return dateString
      }
      
      // Formatar usando timezone local do navegador
      // getHours() e getMinutes() já retornam no timezone local
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${day}/${month}/${year}, ${hours}:${minutes}`
    } catch (error) {
      console.error('[formatScheduleDateTime] Erro ao formatar data:', error, dateString)
      return dateString
    }
  }
  
  // Obter cor do status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case 'executando': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'concluido': return 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
      case 'pausado': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case 'cancelado': return 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300'
      case 'erro': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      default: return 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
    }
  }
  
  // Obter texto do status
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'agendado': return 'Agendado'
      case 'executando': return 'Executando'
      case 'concluido': return 'Concluído'
      case 'pausado': return 'Pausado'
      case 'cancelado': return 'Cancelado'
      case 'erro': return 'Erro'
      default: return status
    }
  }

  // Cache simples para evitar múltiplas chamadas
  const sessionsCacheRef = useRef<{ data: SessionItem[], timestamp: number } | null>(null)
  const CACHE_DURATION = 30000 // 30 segundos de cache
  
  useEffect(() => {
    if (!isOpen) return
    
    // Verificar cache
    const now = Date.now()
    if (sessionsCacheRef.current && (now - sessionsCacheRef.current.timestamp) < CACHE_DURATION) {
      console.log('[FRONTEND] Usando cache de sessões/instâncias')
      setSessions(sessionsCacheRef.current.data)
      return
    }
    
    // Debounce: aguardar 300ms antes de fazer requisições
    const timeoutId = setTimeout(async () => {
      console.log('[FRONTEND] Carregando sessões WAHA e instâncias Evolution...')
      try {
        const allSessions: SessionItem[] = []
        
        // Função helper para fazer fetch com retry em caso de rate limit
        const fetchWithRetry = async (url: string, retries = 3): Promise<Response | null> => {
          for (let i = 0; i < retries; i++) {
            try {
              const res = await fetch(url)
              
              // Se for rate limit, aguardar antes de tentar novamente
              if (res.status === 429) {
                const waitTime = Math.min(1000 * Math.pow(2, i), 10000) // Backoff exponencial, max 10s
                console.warn(`[FRONTEND] Rate limit detectado, aguardando ${waitTime}ms antes de tentar novamente...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
              }
              
              return res
            } catch (e) {
              if (i === retries - 1) throw e
              const waitTime = Math.min(1000 * Math.pow(2, i), 10000)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          }
          return null
        }
        
        // Carregar sessões WAHA
        try {
          const wahaRes = await fetchWithRetry('/api/waha/sessions/all')
          if (wahaRes) {
            const wahaData = await wahaRes.json()
            console.log('[FRONTEND] Dados de sessões WAHA:', {
              success: wahaData.success,
              totalSessions: wahaData.sessions?.length || 0
            })
            
            if (wahaData.success) {
              const ws = (wahaData.sessions || []).filter((s: any) => {
                const statusUpper = String(s.status || '').toUpperCase()
                const valid = ['WORKING','CONNECTED','READY','OPEN','AUTHENTICATED'].includes(statusUpper)
                if (!valid) {
                  console.log('[FRONTEND] Sessão WAHA filtrada:', s.name, 'Status:', s.status)
                }
                return valid
              }).map((s: any) => ({
                type: 'waha' as const,
                serverId: s.serverId,
                serverName: s.serverName,
                sessionName: s.name,
                status: s.status,
                phoneNumber: s.phoneNumber || (s.me?.id ? String(s.me.id).replace('@c.us', '') : undefined)
              }))
              allSessions.push(...ws)
              console.log('[FRONTEND] Sessões WAHA válidas:', ws.length)
            }
          }
        } catch (e) {
          console.error('[FRONTEND] Erro ao carregar sessões WAHA:', e)
        }
        
        // Carregar instâncias Evolution API (com pequeno delay para evitar chamadas simultâneas)
        await new Promise(resolve => setTimeout(resolve, 200))
        
        try {
          const evolutionRes = await fetchWithRetry('/api/evolution/instances')
          if (evolutionRes) {
            const evolutionData = await evolutionRes.json()
            console.log('[FRONTEND] Dados de instâncias Evolution:', {
              success: evolutionData.success,
              totalInstances: evolutionData.instances?.length || 0
            })
            
            if (evolutionData.success && evolutionData.instances) {
              const ev = evolutionData.instances
                .filter((inst: any) => inst.connected === true)
                .map((inst: any) => ({
                  type: 'evolution' as const,
                  serverId: undefined,
                  serverName: 'Evolution API',
                  sessionName: inst.instance_name || inst.name,
                  status: inst.status || 'open',
                  phoneNumber: inst.userPhone || inst.phoneNumber
                }))
              allSessions.push(...ev)
              console.log('[FRONTEND] Instâncias Evolution válidas:', ev.length)
            }
          }
        } catch (e) {
          console.error('[FRONTEND] Erro ao carregar instâncias Evolution:', e)
        }
        
        console.log('[FRONTEND] Total de sessões/instâncias carregadas:', allSessions.length)
        
        // Atualizar cache
        sessionsCacheRef.current = {
          data: allSessions,
          timestamp: Date.now()
        }
        
        setSessions(allSessions)
      } catch (e) {
        console.error('[FRONTEND] Exceção ao carregar sessões/instâncias:', e)
      }
    }, 300) // Debounce de 300ms
    
    return () => clearTimeout(timeoutId)
  }, [isOpen])

  const toggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const handleStart = async () => {
    if (selected.length < 2) {
      alert('Selecione pelo menos 2 sessões para criar conversas')
      return
    }
    
    // Validar agendamento se habilitado
    if (scheduleEnabled) {
      if (!scheduledDate || !scheduledTime) {
        alert('Preencha a data e hora do agendamento')
        return
      }
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const now = new Date()
      
      if (scheduledDateTime <= now) {
        alert('A data e hora de agendamento deve ser no futuro')
        return
      }
    }
    
    setLoading(true)
    try {
      // Se for agendamento, usar API de agendamento
      if (scheduleEnabled) {
        // Criar data/hora considerando timezone local do usuário
        // O input de data retorna YYYY-MM-DD e o input de hora retorna HH:mm
        // Precisamos criar uma data local (não UTC) e depois formatar com timezone
        const localDateTimeString = `${scheduledDate}T${scheduledTime}:00`
        const scheduledDateTime = new Date(localDateTimeString)
        
        // Validar se a data é válida
        if (isNaN(scheduledDateTime.getTime())) {
          alert('Data ou hora inválida. Verifique os valores informados.')
          setLoading(false)
          return
        }
        
        // Criar string ISO preservando o horário local escolhido pelo usuário
        // Obter componentes da data local (não UTC)
        const year = scheduledDateTime.getFullYear()
        const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0')
        const day = String(scheduledDateTime.getDate()).padStart(2, '0')
        const hours = String(scheduledDateTime.getHours()).padStart(2, '0')
        const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0')
        const seconds = String(scheduledDateTime.getSeconds()).padStart(2, '0')
        
        // Obter offset do timezone local
        // getTimezoneOffset() retorna offset em minutos (positivo = está atrás de UTC, negativo = está à frente)
        // Exemplo: Brasil UTC-3 = getTimezoneOffset() retorna 180 (positivo) = string ISO precisa "-03:00"
        // Exemplo: Japão UTC+9 = getTimezoneOffset() retorna -540 (negativo) = string ISO precisa "+09:00"
        const timezoneOffsetMinutes = scheduledDateTime.getTimezoneOffset()
        const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60)
        const offsetMins = Math.abs(timezoneOffsetMinutes) % 60
        // Se timezoneOffset é positivo (está atrás de UTC), então o offset na string é negativo
        // Exemplo: UTC-3 = offsetMinutes = 180 (positivo) = offset string = "-03:00"
        const offsetSign = timezoneOffsetMinutes >= 0 ? '-' : '+'
        const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`
        
        // Criar string ISO com timezone local (ex: 2025-11-01T15:42:00-03:00)
        const scheduledStartAtISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`
        
        // Para a data final, calcular baseado na data de início preservando timezone
        let scheduledEndAtISO: string | null = null
        if (endDateTime) {
          const endYear = endDateTime.getFullYear()
          const endMonth = String(endDateTime.getMonth() + 1).padStart(2, '0')
          const endDay = String(endDateTime.getDate()).padStart(2, '0')
          const endHours = String(endDateTime.getHours()).padStart(2, '0')
          const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0')
          const endSeconds = String(endDateTime.getSeconds()).padStart(2, '0')
          scheduledEndAtISO = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:${endSeconds}${offsetString}`
        }
        
        console.log('[FRONTEND] Data/hora local escolhida:', {
          scheduledDate,
          scheduledTime,
          localDateTimeString,
          scheduledDateTimeLocal: scheduledDateTime.toString(),
          scheduledStartAtISO,
          timezoneOffset: offsetString,
          timezoneOffsetMinutes
        })
        
        const payload = {
          sessions: selected,
          cadenceSeconds,
          messageTemplates,
          numberOfRounds,
          minutesPerRound,
          pauseMinutesBetweenRounds,
          scheduledStartAt: scheduledStartAtISO,
          scheduledEndAt: scheduledEndAtISO
        }
        
        console.log('[FRONTEND] Criando agendamento:', payload)
        
        const res = await fetch('/api/maturacao/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const data = await res.json()
        
        if (!(res.ok && data.success)) {
          console.error('[FRONTEND] Erro ao agendar maturação:', data)
          showInfo('Erro ao agendar', 'Erro ao agendar maturação: ' + (data.error || 'Erro desconhecido'))
        } else {
          const message = `Maturação agendada para ${formatEndDateTime(scheduledDateTime)}\nPrevisão de término: ${formatEndDateTime(endDateTime)}`
          setSuccessMessage(message)
          setShowSuccessModal(true)
          // Recarregar lista de agendamentos
          loadSchedules()
          // Mostrar lista de agendamentos automaticamente
          setShowSchedulesList(true)
        }
      } else {
        // Execução imediata (código original)
      const id = `maturation_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      setMaturationId(id)
      console.log('[FRONTEND] MaturationId gerado:', id)
      
      const payload = {
        sessions: selected,
        cadenceSeconds,
        messageTemplates,
        numberOfRounds,
        minutesPerRound,
          pauseMinutesBetweenRounds,
        maturationId: id
      }
      
      console.log('[FRONTEND] Enviando requisição:', payload)
      
      const res = await fetch('/api/maturacao/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      console.log('[FRONTEND] Resposta recebida:', {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText
      })
      
      const data = await res.json()
      console.log('[FRONTEND] Dados da resposta:', data)
      
      if (!(res.ok && data.success)) {
        console.error('[FRONTEND] Erro ao iniciar maturação:', data)
        alert('Erro ao iniciar maturação: ' + (data.error || 'Erro desconhecido'))
        setMaturationId(null)
      } else {
        console.log('[FRONTEND] Maturação iniciada com sucesso!')
          
          // Se foi iniciada em background, disparar evento para o widget
          if (runInBackground && id) {
            window.dispatchEvent(new CustomEvent('maturation-start', {
              detail: { maturationId: id, runInBackground: true }
            }))
          }
        }
      }
    } catch (e) {
      console.error('[FRONTEND] Exceção:', e)
      alert('Erro: ' + (e instanceof Error ? e.message : String(e)))
      setMaturationId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!maturationId) return
    try {
      await fetch('/api/maturacao/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maturationId })
      })
      setMaturationId(null)
      setProgress(null)
    } catch (e) {
      console.error('Erro ao parar maturação:', e)
    }
  }

  // Gerar preview de mensagens
  const generatePreview = () => {
    const templates = messageTemplates.split(/\n+/).filter(Boolean)
    const selectedSessions = sessions.filter(s => selected.includes(`${s.serverId}:${s.sessionName}`))
    if (selectedSessions.length < 2) return []
    
    const preview = []
    for (let i = 0; i < Math.min(2, selectedSessions.length); i++) {
      const from = selectedSessions[i]
      const to = selectedSessions[(i + 1) % selectedSessions.length]
      const greeting = ['Olá', 'Oi', 'E aí', 'Bom dia', 'Boa tarde'][Math.floor(Math.random() * 5)]
      const message = templates[Math.floor(Math.random() * templates.length)] || 'Mensagem de teste'
      preview.push({
        from: `${from.serverName || 'Servidor'} • ${from.sessionName || 'Sessão'}`,
        to: `${to.serverName || 'Servidor'} • ${to.sessionName || 'Sessão'}`,
        greeting: `${greeting}, ${to.sessionName || 'Sessão'}!`,
        message: message.replace(/\{\{nome\}\}/g, to.sessionName || 'Sessão')
      })
    }
    return preview
  }

  // Poll de progresso
  useEffect(() => {
    if (!maturationId) {
      backgroundMaturationIdRef.current = null
      backgroundProgressRef.current = null
      return
    }
    
    let active = true
    const tick = async () => {
      try {
        const r = await fetch(`/api/maturacao/progress?id=${encodeURIComponent(maturationId)}`)
        const d = await r.json()
        if (active && d?.success) {
          const progressData = d.progress || null
          const previousStatus = progress?.status
          setProgress(progressData)
          
          // Se estiver em background, atualizar ref e verificar se terminou
          if (runInBackground) {
            backgroundMaturationIdRef.current = maturationId
            backgroundProgressRef.current = progressData
          }
          
          // Notificar quando maturação for concluída (tanto em background quanto acompanhando)
          if (progressData?.status === 'finished' && previousStatus !== 'finished') {
            const totalMessages = progressData.stats?.totalMessages || 0
            const conversationsCompleted = progressData.stats?.conversationsCompleted || 0
            
            showSuccess(
              '🎉 Maturação Concluída!',
              `Sua maturação foi concluída com sucesso!\n\n📊 Estatísticas:\n• ${totalMessages} mensagens enviadas\n• ${conversationsCompleted} conversas completadas`,
              []
            )
            
            // Limpar estados se estava em background
            if (runInBackground) {
              setRunInBackground(false)
              backgroundMaturationIdRef.current = null
              backgroundProgressRef.current = null
            }
            
            // Parar o polling após alguns segundos
            setTimeout(() => {
              if (active) {
                setMaturationId(null)
              }
            }, 5000) // Aguardar 5 segundos para o usuário ver a notificação
          } else if (progressData?.status === 'error' && previousStatus !== 'error') {
            // Notificar erro apenas quando mudar de status
            if (runInBackground) {
              showInfo(
                '❌ Erro na Maturação',
                'A maturação encontrou um erro durante a execução.',
                [{
                  label: 'Ver Detalhes',
                  action: () => {
                    setRunInBackground(false)
                    setMaturationId(maturationId)
                  }
                }]
              )
            }
          }
        }
      } catch {}
    }
    const i = setInterval(tick, 1000)
    tick()
    return () => { active = false; clearInterval(i) }
  }, [maturationId, runInBackground, showSuccess, showInfo])
  
  // Hook para monitorar agendamentos (configurar callbacks quando modal abrir)
  useEffect(() => {
    // Quando maturação agendada iniciar, receber evento global
    const handleMaturationStart = (event: CustomEvent<{ maturationId: string; runInBackground: boolean }>) => {
      const { maturationId: matId, runInBackground: bg } = event.detail
      setMaturationId(matId)
      setRunInBackground(bg)
      
      // Se modal estiver fechado e usuário quer acompanhar, o DisparosPage já abrirá o modal
      // Aqui apenas configuramos os estados
      console.log('[ChipMaturationModal] Maturação agendada iniciada:', { maturationId: matId, runInBackground: bg })
    }
    
    window.addEventListener('maturation-start' as any, handleMaturationStart as EventListener)
    
    return () => {
      window.removeEventListener('maturation-start' as any, handleMaturationStart as EventListener)
    }
  }, [])

  // Função para gerar chave única (mesmo formato da API)
  const getSessionKey = (s: SessionItem): string => {
    if (s.type === 'evolution') {
      return `evolution:${s.sessionName}`
    }
    return `waha:${s.serverId}:${s.sessionName}`
  }
  
  const selectedSessions = sessions.filter(s => selected.includes(getSessionKey(s)))
  const pairsCount = Math.floor(selectedSessions.length / 2) + (selectedSessions.length % 2)
  const previewMessages = generatePreview()
  
  // Calcular percentual de progresso baseado no tempo restante
  const progressPercent = progress?.totalMinutes && typeof progress?.remainingMs === 'number'
    ? Math.max(0, Math.min(100, ((progress.totalMinutes * 60000 - progress.remainingMs) / (progress.totalMinutes * 60000)) * 100))
    : progress?.status === 'finished' ? 100
    : progress?.status === 'stopped' ? 0
    : 0

  if (!isOpen) return null

  // Componente de cronômetro para próxima mensagem
  function NextMessageTimer({ nextMessageAt }: { nextMessageAt: number }) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0)

    useEffect(() => {
      if (!nextMessageAt || nextMessageAt <= 0) return
      
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, nextMessageAt - now)
        setTimeRemaining(remaining)
      }

      updateTimer() // Atualizar imediatamente
      const interval = setInterval(updateTimer, 1000) // Atualizar a cada segundo

      return () => clearInterval(interval)
    }, [nextMessageAt])

    const totalSeconds = Math.floor(timeRemaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const displaySeconds = totalSeconds % 60

    if (timeRemaining <= 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
        <ClockIcon className="h-4 w-4" />
        <span>Enviando...</span>
      </div>
    )
  }

  // Se for menos de 1 minuto, mostrar apenas segundos (ex: "43s")
  // Se for 1 minuto ou mais, mostrar minutos e segundos (ex: "1m 30s")
  const displayText = minutes > 0 
    ? `${minutes}m ${displaySeconds}s`
    : `${displaySeconds}s`

  return (
    <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
      <ClockIcon className="h-4 w-4" />
      <span>{displayText}</span>
    </div>
  )
  }

  return (
    <div className="fixed inset-0 z-[10500]">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl bg-white dark:bg-secondary-800 rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-5 py-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div>
                <h3 className="text-base font-bold text-secondary-900 dark:text-secondary-100">Maturação de Chips</h3>
                <p className="text-xs text-secondary-600 dark:text-secondary-400">Simulação de conversas humanizadas entre sessões</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-secondary-800">
            {/* Grid Principal: Seleção de Sessões e Configurações */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seção de Seleção de Sessões - Coluna Esquerda */}
              <div className="lg:col-span-1">
                <div className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2 mb-3">
                <DevicePhoneMobileIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Selecionar Sessões/Instâncias
                {selected.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">
                    {selected.length} selecionada{selected.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
                <div className="max-h-64 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-lg bg-secondary-50 dark:bg-secondary-900">
                {sessions.map((s) => {
                  const key = getSessionKey(s)
                  const isSelected = selected.includes(key)
                  const typeLabel = s.type === 'evolution' ? 'Evolution' : 'WAHA'
                  return (
                    <label 
                      key={key} 
                      className={`flex items-center gap-3 px-4 py-3 border-b dark:border-secondary-700 last:border-b-0 cursor-pointer hover:bg-white dark:hover:bg-secondary-800 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500 dark:border-l-primary-400' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggle(key)}
                        className="w-4 h-4 text-primary-600 dark:text-primary-400 rounded focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-secondary-900 dark:text-secondary-100">{s.serverName}</span>
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300">{typeLabel}</span>
                          <span className="text-secondary-400 dark:text-secondary-500">•</span>
                          <span className="text-sm text-secondary-700 dark:text-secondary-300">{s.sessionName}</span>
                          {isSelected && <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                        </div>
                        {s.phoneNumber && (
                          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 flex items-center gap-1">
                            <DevicePhoneMobileIcon className="h-3 w-3" />
                            {s.phoneNumber}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <DevicePhoneMobileIcon className="h-10 w-10 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Nenhuma sessão WAHA ou instância Evolution conectada encontrada.</p>
                  </div>
                )}
              </div>
              {selected.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Como funciona:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>As sessões serão pareadas automaticamente</li>
                        <li>Cada par conversará entre si de forma rotativa</li>
                        <li>As conversas são humanizadas com saudações variadas</li>
                        <li>O sistema garante delays mínimos entre mensagens</li>
                      </ul>
                      {selected.length >= 2 && (
                        <p className="mt-2 font-medium">Serão criados aproximadamente {pairsCount} par(es) de conversação.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Configurações de Rodadas e Tempo - Coluna Direita (2 colunas) */}
              <div className="lg:col-span-2">
                <div className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2 mb-3">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Configurações de Tempo
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Número de Rodadas
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="input flex-1" 
                    min={1} 
                    max={100} 
                    value={numberOfRounds} 
                    onChange={e => setNumberOfRounds(Math.max(1, Math.min(100, parseInt(e.target.value || '1'))))} 
                  />
                  <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">rodadas</span>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">Quantidade de rodadas que serão executadas.</p>
                <div className="mt-2 p-2 bg-white dark:bg-secondary-800 rounded border border-secondary-200 dark:border-secondary-700">
                  <div className="text-xs text-secondary-600 dark:text-secondary-400">
                    <span className="font-medium">Quantidade:</span> {numberOfRounds} rodada{numberOfRounds !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Tempo por Rodada
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="input flex-1" 
                    min={1} 
                    max={1440} 
                    value={minutesPerRound} 
                    onChange={e => setMinutesPerRound(Math.max(1, parseInt(e.target.value || '10')))} 
                  />
                  <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">min</span>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">Duração de cada rodada individual.</p>
                <div className="mt-2 p-2 bg-white dark:bg-secondary-800 rounded border border-secondary-200 dark:border-secondary-700">
                  <div className="text-xs text-secondary-600 dark:text-secondary-400">
                    <span className="font-medium">Por rodada:</span> {minutesPerRound} minuto{minutesPerRound !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Pausa Entre Rodadas
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="input flex-1" 
                    min={0} 
                    max={1440} 
                    value={pauseMinutesBetweenRounds} 
                    onChange={e => setPauseMinutesBetweenRounds(Math.max(0, parseInt(e.target.value || '5')))} 
                  />
                  <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">min</span>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">Tempo de espera entre uma rodada e a próxima.</p>
                <div className="mt-2 p-2 bg-white dark:bg-secondary-800 rounded border border-secondary-200 dark:border-secondary-700">
                  <div className="text-xs text-secondary-600 dark:text-secondary-400">
                    <span className="font-medium">Pausa:</span> {pauseMinutesBetweenRounds} minuto{pauseMinutesBetweenRounds !== 1 ? 's' : ''}
                    {numberOfRounds > 1 && (
                      <span className="block mt-1 text-secondary-500 dark:text-secondary-500">
                        ({numberOfRounds - 1} pausa{numberOfRounds - 1 !== 1 ? 's' : ''} total)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                <label className="block text-sm font-semibold text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Duração Total
                </label>
                <div className="px-3 py-2 bg-white dark:bg-secondary-800 border border-primary-300 dark:border-primary-700 rounded-lg text-sm font-semibold text-primary-700 dark:text-primary-400 text-center">
                  {totalMinutes} minuto{totalMinutes !== 1 ? 's' : ''}
                </div>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 text-center">
                  <span className="font-medium">Cálculo:</span> ({numberOfRounds} × {minutesPerRound}) + {totalPauseMinutes} min{pauseMinutesBetweenRounds > 0 && numberOfRounds > 1 ? ' (pausas)' : ''} = {totalMinutes} min
                </p>
                <div className="mt-2 p-2 bg-white dark:bg-secondary-800 rounded border border-primary-200 dark:border-primary-800">
                  <div className="text-xs text-primary-700 dark:text-primary-400">
                    <span className="font-medium">Tempo total estimado:</span> ~{totalMinutes} minuto{totalMinutes !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
                </div>
              </div>
            </div>
            
            {/* Delay e Templates lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delay Mínimo Entre Mensagens */}
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Delay Mínimo Entre Mensagens
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="input flex-1" 
                    min={60} 
                    max={600} 
                    value={cadenceSeconds} 
                    onChange={e => setCadenceSeconds(Math.max(60, parseInt(e.target.value || '60')))} 
                  />
                  <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">seg</span>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                  Delay mínimo obrigatório: <span className="font-semibold">60 segundos (1 minuto)</span>. O sistema randomiza entre 1-3 minutos para cada mensagem.
                </p>
              </div>

              {/* Templates de Mensagem */}
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Templates de Mensagens
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {showPreview ? 'Ocultar' : 'Ver'} Preview
                  </button>
                </div>
                <textarea 
                  className="input h-32 resize-none font-mono text-sm" 
                  value={messageTemplates} 
                  onChange={e => setMessageTemplates(e.target.value)}
                  placeholder="Digite uma mensagem por linha. Cada linha será usada como variação."
                />
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
                  <span className="font-semibold">Dica:</span> Digite uma mensagem por linha. O sistema selecionará aleatoriamente entre elas. 
                  Use {'{{nome}}'} para incluir o nome da sessão destinatária.
                </p>
                {showPreview && previewMessages.length > 0 && (
                  <div className="mt-4 p-3 bg-white dark:bg-secondary-800 rounded border border-primary-200 dark:border-primary-800">
                    <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-2">Preview de Mensagens:</p>
                    <div className="space-y-3">
                      {previewMessages.map((p, idx) => (
                        <div key={idx} className="text-xs border-l-4 border-l-primary-500 dark:border-l-primary-400 pl-2">
                          <div className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                            {p.from} → {p.to}
                          </div>
                          <div className="text-secondary-700 dark:text-secondary-300 space-y-1">
                            <div className="italic">"{p.greeting}"</div>
                            <div>"{p.message}"</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agendamento e Lista de Agendamentos lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agendamento */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={e => setScheduleEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-secondary-800"
                  />
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Agendar Maturação</span>
                  </div>
                </label>
              </div>
              
              {scheduleEnabled && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-1">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input w-full text-sm"
                        required={scheduleEnabled}
                      />
                    </div>
                    
                    <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-1">
                        Hora de Início
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="input w-full text-sm"
                        required={scheduleEnabled}
                      />
                    </div>
                  </div>
                  
                  {endDateTime && (
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-300 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Previsão de Término</p>
                          <p className="text-sm text-blue-800 dark:text-blue-400 font-medium">
                            {formatEndDateTime(endDateTime)}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Duração estimada: {totalMinutes} minuto{totalMinutes !== 1 ? 's' : ''}
                            {totalPauseMinutes > 0 && (
                              <span> (incluindo {totalPauseMinutes} min de pausas)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      <span className="font-semibold">ℹ️ Como funciona:</span> A maturação será executada automaticamente na data e hora especificadas. 
                      Você receberá notificações quando iniciar e concluir.
                    </p>
                  </div>
                </div>
              )}
              
              {!scheduleEnabled && (
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
                  Marque esta opção para agendar a maturação em vez de executá-la imediatamente.
                </p>
              )}
              </div>
              
              {/* Lista de Agendamentos */}
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowSchedulesList(!showSchedulesList)}>
                  <CalendarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Meus Agendamentos</span>
                  {schedules.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">
                      {schedules.length}
                    </span>
                  )}
                </label>
                <button
                  onClick={() => {
                    setShowSchedulesList(!showSchedulesList)
                    if (!showSchedulesList) loadSchedules()
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  {showSchedulesList ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              
              {showSchedulesList && (
                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                  {loadingSchedules ? (
                    <div className="text-center py-4 text-sm text-secondary-500 dark:text-secondary-400">
                      Carregando agendamentos...
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-4 text-sm text-secondary-500 dark:text-secondary-400">
                      Nenhum agendamento encontrado.
                    </div>
                  ) : (
                    schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(schedule.status)}`}>
                                {getStatusText(schedule.status)}
                              </span>
                              {schedule.number_of_rounds && (
                                <span className="text-xs text-secondary-600 dark:text-secondary-400">
                                  {schedule.number_of_rounds} rodada{schedule.number_of_rounds !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-secondary-700 dark:text-secondary-300 space-y-0.5">
                              <div>
                                <span className="font-medium">Início:</span> {formatScheduleDateTime(schedule.scheduled_start_at)}
                              </div>
                              {schedule.scheduled_end_at && (
                                <div>
                                  <span className="font-medium">Fim:</span> {formatScheduleDateTime(schedule.scheduled_end_at)}
                                </div>
                              )}
                              {schedule.created_at && (
                                <div className="text-secondary-500 dark:text-secondary-500">
                                  Criado em: {formatScheduleDateTime(schedule.created_at)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {schedule.status === 'pausado' && (
                              <button
                                onClick={() => handleResumeSchedule(schedule.id)}
                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded transition-colors flex items-center gap-1"
                                title="Retomar agendamento"
                              >
                                <PlayIcon className="h-3 w-3" />
                                Retomar
                              </button>
                            )}
                            {(schedule.status === 'agendado' || schedule.status === 'executando') && (
                              <button
                                onClick={() => handlePauseSchedule(schedule.id)}
                                className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded transition-colors flex items-center gap-1"
                                title="Pausar agendamento"
                              >
                                <PauseIcon className="h-3 w-3" />
                                Pausar
                              </button>
                            )}
                            {(schedule.status === 'agendado' || schedule.status === 'pausado' || schedule.status === 'executando') && (
                              <button
                                onClick={() => handleCancelSchedule(schedule.id)}
                                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded transition-colors"
                                title="Cancelar agendamento"
                              >
                                Cancelar
                              </button>
                            )}
                            {(schedule.status === 'cancelado' || schedule.status === 'concluido' || schedule.status === 'erro') && (
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-700 dark:text-secondary-300 rounded transition-colors"
                                title="Excluir permanentemente"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {schedule.error_message && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                            <span className="font-medium">Erro:</span> {schedule.error_message}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>
            </div>
            
            {/* Status em Tempo Real - Largura Completa */}
            {maturationId && (
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h4 className="text-sm font-bold text-secondary-900 dark:text-secondary-100">Status em Tempo Real</h4>
                    {runInBackground && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                        Executando em Background
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!runInBackground && (
                      <button
                        onClick={() => {
                          setRunInBackground(true)
                          onClose()
                          showInfo(
                            'Executando em Background',
                            'A maturação continuará executando. Você receberá uma notificação quando terminar.',
                          )
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium transition-colors"
                        title="Executar em background"
                      >
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                        Background
                      </button>
                    )}
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium transition-colors"
                  >
                    <StopIcon className="h-4 w-4" />
                    Parar
                  </button>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">Progresso</span>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white dark:bg-secondary-800 rounded-lg p-2 border border-secondary-200 dark:border-secondary-700">
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-0.5">Estado</div>
                    <div className="text-sm font-bold text-secondary-900 dark:text-secondary-100 capitalize">
                      {progress?.status === 'started' && '🟢 Iniciado'}
                      {progress?.status === 'sending' && '📤 Enviando'}
                      {progress?.status === 'replying' && '💬 Respondendo'}
                      {progress?.status === 'running' && '⚙️ Executando'}
                      {progress?.status === 'finished' && '✅ Finalizado'}
                      {progress?.status === 'no_sessions' && '❌ Sem Sessões'}
                      {progress?.status === 'no_numbers' && '❌ Sem Números'}
                      {!progress?.status && '⏳ Aguardando...'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-secondary-800 rounded-lg p-2 border border-secondary-200 dark:border-secondary-700">
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-0.5">Tempo Restante</div>
                    <div className="text-sm font-bold text-secondary-900 dark:text-secondary-100">
                      {typeof progress?.remainingMs === 'number' 
                        ? `${Math.max(0, Math.ceil(progress.remainingMs / 60000))} min`
                        : '—'
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-secondary-800 rounded-lg p-2 border border-secondary-200 dark:border-secondary-700">
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-0.5">Mensagens Enviadas</div>
                    <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {progress?.stats?.totalMessages || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-secondary-800 rounded-lg p-2 border border-secondary-200 dark:border-secondary-700">
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-0.5">Pares Ativos</div>
                    <div className="text-sm font-bold text-secondary-900 dark:text-secondary-100">
                      {progress?.stats?.activePairs || 0}
                    </div>
                  </div>
                </div>

                {/* Par Atual */}
                {progress?.pair && (
                  <div className="mb-4 p-3 bg-white dark:bg-secondary-800 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-2 flex items-center justify-between">
                      <span>Conversa Atual</span>
                      {/* SEMPRE mostrar o ícone de tempo e cronômetro quando houver pair */}
                      <div className="flex items-center gap-1">
                        {typeof progress?.nextMessageAt === 'number' && progress.nextMessageAt > Date.now() ? (
                          <NextMessageTimer nextMessageAt={progress.nextMessageAt} />
                        ) : (
                          <>
                            <ClockIcon className="h-4 w-4 text-secondary-500 dark:text-secondary-400 flex-shrink-0" />
                            <span className="text-xs text-secondary-500 dark:text-secondary-400 whitespace-nowrap">Calculando tempo...</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded font-medium">
                        {progress.pair.from}
                      </div>
                      <span className="text-secondary-400 dark:text-secondary-500">→</span>
                      <div className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded font-medium">
                        {progress.pair.to}
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs de Conversação */}
                <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 max-h-64 overflow-y-auto">
                  <div className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-2 flex items-center justify-between">
                    <span>Histórico de Conversação</span>
                    <span className="text-secondary-500 dark:text-secondary-400 font-normal">
                      {progress?.logs?.length || 0} evento{progress?.logs?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(progress?.logs || []).slice().reverse().slice(0, 50).map((l: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded border-l-2 ${
                          l.type === 'greeting' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800' :
                          l.type === 'message' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' :
                          l.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' :
                          l.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800' :
                          'bg-secondary-50 dark:bg-secondary-900 border-secondary-300 dark:border-secondary-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-secondary-400 dark:text-secondary-500 font-mono text-[10px]">
                            {new Date(l.ts).toLocaleTimeString()}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            l.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                            l.direction === 'A->B' || l.direction === 'A→B' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                            l.direction === 'B->A' || l.direction === 'B→A' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                            l.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                            'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                          }`}>
                            {l.direction || l.type || 'info'}
                          </span>
                        </div>
                        {(l.message || l.text) && (
                          <div className={`mt-1 ${l.type === 'error' ? 'text-red-700 dark:text-red-400 font-medium' : 'text-secondary-700 dark:text-secondary-300 italic'}`}>
                            "{l.message || l.text || ''}"
                            {(l.message || l.text || '').length > 100 ? '...' : ''}
                          </div>
                        )}
                        {l.details && (
                          <div className="text-red-600 dark:text-red-400 mt-1 text-[9px] font-mono opacity-75">
                            {l.details}
                          </div>
                        )}
                        {l.from && l.to && (
                          <div className="text-secondary-600 dark:text-secondary-400 mt-1 text-[10px]">
                            {l.from} → {l.to}
                          </div>
                        )}
                      </div>
                    ))}
                    {!progress?.logs?.length && (
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center py-4">
                        <InformationCircleIcon className="h-5 w-5 text-secondary-300 dark:text-secondary-600 mx-auto mb-1" />
                        Aguardando início das conversas...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informação quando não há maturação ativa */}
            {!maturationId && (
              <div className="bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                <div className="text-xs text-secondary-600 dark:text-secondary-400 text-center">
                  <InformationCircleIcon className="h-6 w-6 text-secondary-400 dark:text-secondary-600 mx-auto mb-2" />
                  <p>Inicie a maturação para acompanhar o progresso em tempo real.</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between bg-secondary-50 dark:bg-secondary-900">
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              {selected.length >= 2 ? (
                <span className="text-green-600 dark:text-green-400 font-medium">✓ {selected.length} sessões selecionadas</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">⚠️ Selecione pelo menos 2 sessões</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose} 
                className="btn btn-secondary btn-sm"
                disabled={loading && !!maturationId}
              >
                {maturationId ? 'Fechar' : 'Cancelar'}
              </button>
              {maturationId ? (
                <button 
                  onClick={handleStop} 
                  className="btn bg-red-600 hover:bg-red-700 text-white btn-sm flex items-center gap-1"
                >
                  <StopIcon className="h-4 w-4" />
                  Parar Maturação
                </button>
              ) : (
                <button 
                  onClick={handleStart} 
                  disabled={loading || selected.length < 2} 
                  className="btn btn-primary btn-sm flex items-center gap-1"
                >
                  <PlayIcon className="h-4 w-4" />
                  {loading ? 'Iniciando...' : 'Iniciar Maturação'}
                </button>
              )}
            </div>
          </div>
          
          {/* Modal de Sucesso ao Agendar */}
          <SuccessModal
            open={showSuccessModal}
            title="Maturação Agendada!"
            message={successMessage}
            onClose={() => {
              setShowSuccessModal(false)
              onClose()
            }}
            onAutoClose={() => {
              setShowSuccessModal(false)
              onClose()
            }}
            autoCloseDelay={6000}
          />
          
          {/* Modal de Confirmação */}
          <ConfirmModal
            open={confirmModal.open}
            title={confirmModal.title}
            message={confirmModal.message}
            variant={confirmModal.variant}
            confirmText={confirmModal.variant === 'danger' ? 'Excluir' : 'Confirmar'}
            cancelText="Cancelar"
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
          />
        </div>
      </div>
    </div>
  )
}


