import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
