import { NextRequest, NextResponse } from 'next/server'

// Store compartilhado
const store: Map<string, any> = globalThis.__maturationStore || new Map()
// @ts-ignore
globalThis.__maturationStore = store

// Flag para parar maturação (compartilhado com start route)
const stopFlags: Map<string, boolean> = globalThis.__maturationStopFlags || new Map()
// @ts-ignore
globalThis.__maturationStopFlags = stopFlags

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { maturationId } = body

    if (!maturationId) {
      return NextResponse.json({ error: 'maturationId é obrigatório' }, { status: 400 })
    }

    // Marcar para parar
    stopFlags.set(maturationId, true)
    
    // Também limpar flag após um tempo para evitar conflitos em novas maturações
    setTimeout(() => {
      stopFlags.delete(maturationId)
    }, 60000) // Limpar após 1 minuto

    // Atualizar status no progresso
    const current = store.get(maturationId) || { logs: [], startedAt: Date.now() }
    current.status = 'stopped'
    current.logs = [...(current.logs || []), { 
      ts: Date.now(), 
      type: 'info', 
      message: 'Maturação interrompida pelo usuário' 
    }].slice(-200)
    store.set(maturationId, current)

    return NextResponse.json({ success: true, stopped: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao parar maturação' }, { status: 500 })
  }
}

// Função helper para verificar se deve parar
export function shouldStop(maturationId: string): boolean {
  return stopFlags.get(maturationId) === true
}

