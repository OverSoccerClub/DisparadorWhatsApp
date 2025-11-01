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

    // Só pode retomar se estiver pausado
    if (schedule.status !== 'pausado') {
      return NextResponse.json(
        { error: `Não é possível retomar um agendamento com status "${schedule.status}". Apenas agendamentos pausados podem ser retomados.` },
        { status: 400 }
      )
    }

    // Atualizar status para 'agendado' (volta para a fila de execução)
    // Se a data/hora já passou, manter status como agendado mas não executar imediatamente
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('maturacao_schedules')
      .update({
        status: 'agendado',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[RESUME SCHEDULE] Erro ao atualizar agendamento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao retomar agendamento: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[RESUME SCHEDULE] Agendamento retomado:', scheduleId)

    // Se a data/hora já passou, pode executar imediatamente
    const scheduledDate = new Date(schedule.scheduled_start_at)
    const now = new Date()
    
    if (scheduledDate <= now) {
      // Tentar executar imediatamente
      try {
        const origin = new URL(request.url).origin
        await fetch(`${origin}/api/maturacao/execute-scheduled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('[RESUME SCHEDULE] Erro ao executar agendamento imediatamente:', error)
        // Não falhar, apenas logar o erro
      }
    }

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule
    })
  } catch (e) {
    console.error('[RESUME SCHEDULE] Erro na função POST:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao retomar agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

