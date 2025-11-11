import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID do disparo é obrigatório' }, { status: 400 })
    }

    // Verificar se o disparo existe e pertence ao usuário
    const { data: disparo, error: fetchError } = await supabase
      .from('disparos')
      .select('id, user_id, telefone, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar disparo:', fetchError)
      return NextResponse.json({ error: 'Disparo não encontrado ou não pertence ao usuário' }, { status: 404 })
    }

    if (!disparo) {
      return NextResponse.json({ error: 'Disparo não encontrado ou não pertence ao usuário' }, { status: 404 })
    }

    // Excluir o disparo (garantindo que pertence ao usuário)
    const { error: deleteError } = await supabase
      .from('disparos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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
