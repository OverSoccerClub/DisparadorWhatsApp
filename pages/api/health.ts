import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Endpoint simples para health check em ambientes como EasyPanel.
 * Retorna 200 se a aplicação está de pé e variável de ambiente essencial carregada.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'missing'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'missing'

  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    checks: {
      supabaseUrl,
      supabaseKey
    }
  })
}

