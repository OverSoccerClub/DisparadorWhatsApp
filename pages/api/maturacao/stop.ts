import type { NextApiRequest, NextApiResponse } from 'next'

// Store compartilhado
const store: Map<string, any> = globalThis.__maturationStore || new Map()
// @ts-ignore
globalThis.__maturationStore = store

// Flag para parar maturação (compartilhado com start route)
const stopFlags: Map<string, boolean> = globalThis.__maturationStopFlags || new Map()
// @ts-ignore
globalThis.__maturationStopFlags = stopFlags

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { maturationId } = req.body

    if (!maturationId) {
      return res.status(400).json({ error: 'maturationId é obrigatório' })
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

    return res.status(200).json({ success: true, stopped: true })
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao parar maturação' })
  }
}

// Função helper para verificar se deve parar (não exportada - uso interno apenas)
function shouldStop(maturationId: string): boolean {
  return stopFlags.get(maturationId) === true
}

// Tornar função disponível globalmente para outras rotas
// @ts-ignore
globalThis.__shouldStopMaturation = shouldStop
