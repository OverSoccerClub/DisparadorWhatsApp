import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Store compartilhado para progresso de disparos
const dispatchProgressStore: Map<string, any> = globalThis.__dispatchProgressStore || new Map()
// @ts-ignore
globalThis.__dispatchProgressStore = dispatchProgressStore

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const sessionId = req.query.sessionId as string

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório' })
    }

    // Buscar progresso do store
    const progress = dispatchProgressStore.get(sessionId)

    if (!progress) {
      return res.status(200).json({
        success: true,
        progress: {
          sessionId,
          status: 'not_found',
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          percentage: 0
        }
      })
    }

    return res.status(200).json({
      success: true,
      progress: {
        sessionId,
        ...progress
      }
    })
  } catch (error) {
    console.error('Erro ao buscar progresso:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Função helper para atualizar progresso (usada por outras rotas)
export function updateDispatchProgress(sessionId: string, progress: any) {
  dispatchProgressStore.set(sessionId, {
    ...progress,
    updatedAt: new Date().toISOString()
  })
}

// Função helper para remover progresso (usada por outras rotas)
export function removeDispatchProgress(sessionId: string) {
  dispatchProgressStore.delete(sessionId)
}

