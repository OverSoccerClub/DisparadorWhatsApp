import type { NextApiRequest, NextApiResponse } from 'next'
import { getBuildHash } from '@/lib/config/build-hash'

/**
 * API route para fornecer o hash de build
 * Permite que o cliente obtenha o hash sem precisar ler arquivos do sistema
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const buildHash = getBuildHash()
    return res.status(200).json({ hash: buildHash })
  } catch (error) {
    console.error('Erro ao obter hash de build:', error)
    return res.status(500).json({ error: 'Erro ao obter hash de build' })
  }
}

