import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      )
    }

    // Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o agendamento existe e pertence ao usuário
    const { data: schedule, error: fetchError } = await supabase
      .from('maturacao_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !schedule) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // Se estiver executando, precisamos parar a maturação também
    if (schedule.status === 'executando' && schedule.maturation_id) {
      // Tentar parar a maturação
      try {
        const origin = new URL(request.url).origin
        await fetch(`${origin}/api/maturacao/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maturationId: schedule.maturation_id })
        })
      } catch (error) {
        console.error('[CANCEL SCHEDULE] Erro ao parar maturação:', error)
        // Continuar mesmo se falhar ao parar
      }
    }

    // Atualizar status para 'cancelado' (ou deletar se preferir)
    // Vou cancelar em vez de deletar para manter histórico
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('maturacao_schedules')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[CANCEL SCHEDULE] Erro ao atualizar agendamento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[CANCEL SCHEDULE] Agendamento cancelado:', scheduleId)

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule
    })
  } catch (e) {
    console.error('[CANCEL SCHEDULE] Erro na função POST:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao cancelar agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint DELETE para excluir permanentemente um agendamento
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      )
    }

    // Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o agendamento existe e pertence ao usuário
    const { data: schedule, error: fetchError } = await supabase
      .from('maturacao_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !schedule) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // Se estiver executando, precisamos parar a maturação primeiro
    if (schedule.status === 'executando' && schedule.maturation_id) {
      try {
        const origin = new URL(request.url).origin
        await fetch(`${origin}/api/maturacao/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maturationId: schedule.maturation_id })
        })
      } catch (error) {
        console.error('[DELETE SCHEDULE] Erro ao parar maturação:', error)
      }
    }

    // Deletar agendamento
    const { error: deleteError } = await supabase
      .from('maturacao_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[DELETE SCHEDULE] Erro ao deletar agendamento:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir agendamento: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('[DELETE SCHEDULE] Agendamento excluído:', scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Agendamento excluído com sucesso'
    })
  } catch (e) {
    console.error('[DELETE SCHEDULE] Erro na função DELETE:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao excluir agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

