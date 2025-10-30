import { NextRequest, NextResponse } from 'next/server'

// Store para manter o progresso em memória (em produção, use Redis ou banco de dados)
const progressStore = new Map<string, {
  totalMessages: number
  sentMessages: number
  failedMessages: number
  currentMessage?: string
  currentPhone?: string
  currentInstance?: string
  progress: number
  status: 'sending' | 'success' | 'error'
  startTime: number
}>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID é obrigatório' }, { status: 400 })
  }

  const progress = progressStore.get(sessionId)
  
  if (!progress) {
    // Sem progresso ainda para esta sessão; responder vazio para evitar 404 ruidoso no polling
    return NextResponse.json({ success: true, progress: null })
  }

  return NextResponse.json({
    success: true,
    progress: {
      ...progress,
      estimatedTime: calculateEstimatedTime(progress)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action, data } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID é obrigatório' }, { status: 400 })
    }

    switch (action) {
      case 'start':
        progressStore.set(sessionId, {
          totalMessages: data.totalMessages,
          sentMessages: 0,
          failedMessages: 0,
          progress: 0,
          status: 'sending',
          startTime: Date.now()
        })
        break

      case 'updateCurrent':
        const current = progressStore.get(sessionId)
        if (current) {
          progressStore.set(sessionId, {
            ...current,
            currentMessage: data.message,
            currentPhone: data.phone,
            currentInstance: data.instance
          })
        }
        break

      case 'markSent':
        const sent = progressStore.get(sessionId)
        if (sent) {
          const newSent = sent.sentMessages + 1
          const progress = sent.totalMessages > 0 ? Math.round((newSent / sent.totalMessages) * 100) : 0
          progressStore.set(sessionId, {
            ...sent,
            sentMessages: newSent,
            progress,
            currentMessage: undefined,
            currentPhone: undefined,
            currentInstance: undefined
          })
        }
        break

      case 'markFailed':
        const failed = progressStore.get(sessionId)
        if (failed) {
          const newFailed = failed.failedMessages + 1
          const progress = failed.totalMessages > 0 ? Math.round(((failed.sentMessages + newFailed) / failed.totalMessages) * 100) : 0
          progressStore.set(sessionId, {
            ...failed,
            failedMessages: newFailed,
            progress,
            currentMessage: undefined,
            currentPhone: undefined,
            currentInstance: undefined
          })
        }
        break

      case 'finish':
        const finish = progressStore.get(sessionId)
        if (finish) {
          progressStore.set(sessionId, {
            ...finish,
            status: 'success'
          })
        }
        break

      case 'error':
        const error = progressStore.get(sessionId)
        if (error) {
          progressStore.set(sessionId, {
            ...error,
            status: 'error'
          })
        }
        break

      case 'clear':
        progressStore.delete(sessionId)
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function calculateEstimatedTime(progress: any): string {
  const elapsed = Date.now() - progress.startTime
  const remaining = progress.totalMessages - (progress.sentMessages + progress.failedMessages)
  
  if (remaining <= 0) return 'Concluído'
  
  const avgTimePerMessage = elapsed / (progress.sentMessages + progress.failedMessages)
  const estimatedMs = remaining * avgTimePerMessage
  
  const minutes = Math.round(estimatedMs / 60000)
  if (minutes < 1) return 'Menos de 1 minuto'
  if (minutes === 1) return '1 minuto'
  return `${minutes} minutos`
}
