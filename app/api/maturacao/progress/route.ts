import { NextRequest, NextResponse } from 'next/server'

// In-memory store (per server instance). Adequado para acompanhamento em tempo real.
const store: Map<string, any> = globalThis.__maturationStore || new Map()
// @ts-ignore
globalThis.__maturationStore = store

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') || ''
  if (!id) return NextResponse.json({ success: true, progress: null })
  const progress = store.get(id) || null
  return NextResponse.json({ success: true, progress })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, update } = body || {}
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'missing id' }, { status: 400 })
    }
    
    const current = store.get(id) || { logs: [], startedAt: Date.now() }
    
    if (update?.log) {
      const logEntry = { ts: Date.now(), ...update.log }
      current.logs = [...(current.logs || []), logEntry].slice(-200)
    }
    if (typeof update?.status === 'string') {
      current.status = update.status
    }
    if (typeof update?.remainingMs === 'number') current.remainingMs = update.remainingMs
    if (typeof update?.pair === 'object') current.pair = update.pair
    if (typeof update?.stats === 'object') {
      current.stats = update.stats
    }
    if (typeof update?.totalMinutes === 'number') current.totalMinutes = update.totalMinutes
    // Salvar nextMessageAt (pode ser number ou null para limpar)
    if ('nextMessageAt' in update) {
      current.nextMessageAt = update.nextMessageAt
    }
    
    store.set(id, current)
    
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}


