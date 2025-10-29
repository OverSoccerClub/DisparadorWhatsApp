import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID do disparo é obrigatório' }, { status: 400 })
    }

    // Verificar se o disparo existe
    const { data: disparo, error: fetchError } = await supabase
      .from('disparos')
      .select('id, user_id, telefone, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar disparo:', fetchError)
      return NextResponse.json({ error: 'Disparo não encontrado' }, { status: 404 })
    }

    if (!disparo) {
      return NextResponse.json({ error: 'Disparo não encontrado' }, { status: 404 })
    }

    // Excluir o disparo
    const { error: deleteError } = await supabase
      .from('disparos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir disparo:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir disparo' }, { status: 500 })
    }

    console.log(`✅ Disparo excluído: ${id} (${disparo.telefone})`)

    return NextResponse.json({
      success: true,
      message: 'Disparo excluído com sucesso',
      data: {
        id: disparo.id,
        telefone: disparo.telefone,
        status: disparo.status
      }
    })

  } catch (error) {
    console.error('Erro interno ao excluir disparo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
