import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    console.log('🔍 API Disparos Simple: Iniciando...')
    
    // Consulta mais simples possível
    const { data, error } = await supabase
      .from('disparos')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false })

    console.log('📊 Resultado:', { 
      dataLength: data?.length || 0, 
      error: error?.message 
    })

    if (error) {
      console.error('❌ Erro:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      data: data || [],
      pagination: {
        page: 1,
        limit: 10,
        total: data?.length || 0,
        pages: 1
      }
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
}