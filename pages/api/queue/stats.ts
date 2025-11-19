import type { NextApiRequest, NextApiResponse } from 'next'
import { getQueueStats } from '@/lib/queue'

// GET /api/queue/stats - Obter estatísticas das filas
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const stats = await getQueueStats()

    if (!stats) {
      return res.status(500).json({ error: 'Erro ao obter estatísticas' })
    }

    return res.status(200).json({ data: stats })
  } catch (error) {
    console.error('Erro ao obter estatísticas das filas:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
}