'use client'

import { useEffect, useState, useRef } from 'react'
import { SparklesIcon, ClockIcon, ChatBubbleLeftRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import BackgroundMaturationModal from './BackgroundMaturationModal'

interface BackgroundMaturation {
  id: string
  progress: any
}

/**
 * Widget que exibe maturações executando em background
 * Fixo no canto inferior direito, mostra informações em tempo real
 */
export default function BackgroundMaturationWidget() {
  const [backgroundMaturations, setBackgroundMaturations] = useState<BackgroundMaturation[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedMaturationId, setSelectedMaturationId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const storedMaturationsRef = useRef<Set<string>>(new Set())

  // Ouvir eventos de maturações iniciadas
  useEffect(() => {
    const handleMaturationStart = (event: CustomEvent<{ maturationId: string; runInBackground: boolean }>) => {
      const { maturationId, runInBackground } = event.detail
      
      // Se foi iniciada em background, adicionar à lista de monitoramento
      if (runInBackground && maturationId) {
        storedMaturationsRef.current.add(maturationId)
        
        // Buscar progresso imediatamente
        fetch(`/api/maturacao/progress?id=${encodeURIComponent(maturationId)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.progress) {
              setBackgroundMaturations(prev => {
                const exists = prev.find(m => m.id === maturationId)
                if (exists) {
                  return prev.map(m => m.id === maturationId ? { ...m, progress: data.progress } : m)
                }
                return [...prev, { id: maturationId, progress: data.progress }]
              })
            }
          })
          .catch(() => {})
      }
    }

    window.addEventListener('maturation-start' as any, handleMaturationStart as EventListener)

    return () => {
      window.removeEventListener('maturation-start' as any, handleMaturationStart as EventListener)
    }
  }, [])

  // Monitorar maturações em background
  useEffect(() => {
    const checkBackgroundMaturations = async () => {
      try {
        const allMaturations: BackgroundMaturation[] = []
        const maturationIds = Array.from(storedMaturationsRef.current)

        // 1. Buscar agendamentos executando
        try {
          const res = await fetch('/api/maturacao/execute-scheduled', {
            method: 'GET',
            credentials: 'include'
          })
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.schedules) {
              const executingSchedules = data.schedules.filter((s: any) => 
                s.status === 'executando' && s.maturation_id
              )

              for (const schedule of executingSchedules) {
                const maturationId = schedule.maturation_id
                if (!storedMaturationsRef.current.has(maturationId)) {
                  storedMaturationsRef.current.add(maturationId)
                }
                maturationIds.push(maturationId)
              }
            }
          } else if (res.status === 401 || res.status === 404) {
            // Usuário não autenticado ou tabela não existe - ignorar silenciosamente
            return
          }
        } catch (error) {
          // Erro silencioso - pode ser que o banco ainda não esteja configurado
          console.debug('BackgroundMaturationWidget: Erro ao verificar agendamentos (pode ser normal se banco não estiver configurado)', error)
        }

        // 2. Buscar progresso de todas as maturações conhecidas
        for (const maturationId of new Set(maturationIds)) {
          try {
            const progressRes = await fetch(`/api/maturacao/progress?id=${encodeURIComponent(maturationId)}`)
            const progressData = await progressRes.json()
            
            if (progressData.success && progressData.progress) {
              const progress = progressData.progress
              
              // Só mostrar se não estiver finalizada ou com erro
              if (progress.status !== 'finished' && progress.status !== 'error' && progress.status !== 'stopped') {
                allMaturations.push({
                  id: maturationId,
                  progress
                })
              } else {
                // Remover da lista quando finalizar
                storedMaturationsRef.current.delete(maturationId)
              }
            } else {
              // Se não encontrou progresso, pode ter terminado ou não existir mais
              storedMaturationsRef.current.delete(maturationId)
            }
          } catch (error) {
            // Erro silencioso - remover se não conseguir buscar
            storedMaturationsRef.current.delete(maturationId)
          }
        }

        setBackgroundMaturations(allMaturations)
      } catch (error) {
        // Erro silencioso
      }
    }

    // Verificar a cada 3 segundos
    checkBackgroundMaturations()
    intervalRef.current = setInterval(checkBackgroundMaturations, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Se não há maturações em background, não mostrar
  if (backgroundMaturations.length === 0) {
    return null
  }

  const formatTime = (ms: number): string => {
    if (!ms || ms <= 0) return '0min'
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    } else if (minutes > 0) {
      return `${minutes}min ${seconds}s`
    }
    return `${seconds}s`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sending': return 'bg-blue-500'
      case 'replying': return 'bg-purple-500'
      case 'running': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'sending': return 'Enviando'
      case 'replying': return 'Respondendo'
      case 'running': return 'Em Execução'
      default: return 'Processando'
    }
  }

  const handleOpenModal = (maturationId: string) => {
    setSelectedMaturationId(maturationId)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedMaturationId(null)
  }

  // Mostrar widget compacto
  return (
    <>
      <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm">
        {backgroundMaturations.map((maturation) => {
          const { progress } = maturation
          const progressPercent = progress?.totalMinutes && typeof progress?.remainingMs === 'number'
            ? Math.max(0, Math.min(100, ((progress.totalMinutes * 60000 - progress.remainingMs) / (progress.totalMinutes * 60000)) * 100))
            : 0
          
          return (
            <div
              key={maturation.id}
              className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-w-[calc(100vw-2rem)]"
              onClick={() => setExpanded(!expanded)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(progress?.status || '')} animate-pulse`} />
                  <span className="text-xs font-semibold text-gray-700">Maturação em Background</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(!expanded)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-2">
                <span className="text-xs text-gray-600">{getStatusText(progress?.status || '')}</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Info Rows */}
              <div className="space-y-1 text-xs text-gray-600">
                {typeof progress?.remainingMs === 'number' && progress.remainingMs > 0 && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>Tempo restante: {formatTime(progress.remainingMs)}</span>
                  </div>
                )}
                {progress?.stats?.totalMessages !== undefined && (
                  <div className="flex items-center gap-1">
                    <ChatBubbleLeftRightIcon className="h-3 w-3" />
                    <span>{progress.stats.totalMessages} mensagens enviadas</span>
                  </div>
                )}
                {progress?.stats?.activePairs !== undefined && (
                  <div className="flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    <span>{progress.stats.activePairs} pares ativos</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenModal(maturation.id)
                }}
                className="mt-3 w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors"
              >
                Acompanhar em Tempo Real
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal de Maturação */}
      {showModal && selectedMaturationId && (
        <BackgroundMaturationModal
          isOpen={showModal}
          onClose={handleCloseModal}
          maturationId={selectedMaturationId}
        />
      )}
    </>
  )
}

