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

    // Verificar se pode pausar (só pode pausar se estiver agendado ou executando)
    if (schedule.status !== 'agendado' && schedule.status !== 'executando') {
      return NextResponse.json(
        { error: `Não é possível pausar um agendamento com status "${schedule.status}"` },
        { status: 400 }
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
        console.error('[PAUSE SCHEDULE] Erro ao parar maturação:', error)
        // Continuar mesmo se falhar ao parar
      }
    }

    // Atualizar status para 'pausado'
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('maturacao_schedules')
      .update({
        status: 'pausado',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[PAUSE SCHEDULE] Erro ao atualizar agendamento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao pausar agendamento: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[PAUSE SCHEDULE] Agendamento pausado:', scheduleId)

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule
    })
  } catch (e) {
    console.error('[PAUSE SCHEDULE] Erro na função POST:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao pausar agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

