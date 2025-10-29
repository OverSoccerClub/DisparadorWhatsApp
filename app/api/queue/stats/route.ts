import { NextRequest, NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/queue'

// GET /api/queue/stats - Obter estatísticas das filas
export async function GET(request: NextRequest) {
  try {
    const stats = await getQueueStats()

    if (!stats) {
      return NextResponse.json({ error: 'Erro ao obter estatísticas' }, { status: 500 })
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Erro ao obter estatísticas das filas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
