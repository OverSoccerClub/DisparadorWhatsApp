import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessions,
      cadenceSeconds = 60,
      messageTemplates,
      numberOfRounds = 1,
      minutesPerRound = 10,
      pauseMinutesBetweenRounds = 5,
      scheduledStartAt,
      scheduledEndAt
    } = body

    // Validar dados obrigatórios
    if (!Array.isArray(sessions) || sessions.length < 2) {
      return NextResponse.json(
        { error: 'Selecione ao menos duas sessões' },
        { status: 400 }
      )
    }

    if (!scheduledStartAt) {
      return NextResponse.json(
        { error: 'Data e hora de início são obrigatórias' },
        { status: 400 }
      )
    }

    // Validar e parsear data/hora
    // O frontend envia com timezone (ex: 2025-11-01T15:42:00-03:00)
    // Precisamos garantir que a hora seja preservada
    let scheduledDate: Date
    try {
      scheduledDate = new Date(scheduledStartAt)
      
      // Validar se a data é válida
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Data/hora inválida' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro ao processar data/hora: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 400 }
      )
    }
    
    // Validar data no futuro
    const now = new Date()
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: 'A data e hora de agendamento deve ser no futuro' },
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

    // Calcular data/hora final se não fornecida
    // Se scheduledEndAt não foi fornecido, calcular baseado na data de início
    let finalEndAt: string
    if (scheduledEndAt) {
      // Usar a data final fornecida pelo frontend (já com timezone correto)
      finalEndAt = scheduledEndAt
    } else {
      // Calcular data final adicionando minutos à data de início
      const totalPauseMinutes = numberOfRounds > 1 ? (numberOfRounds - 1) * pauseMinutesBetweenRounds : 0
      const totalMinutes = (numberOfRounds * minutesPerRound) + totalPauseMinutes
      
      // Adicionar minutos diretamente na data, preservando o timezone
      const endDate = new Date(scheduledDate.getTime() + (totalMinutes * 60 * 1000))
      
      // Extrair timezone da data de início se existir
      const timezoneMatch = scheduledStartAt.match(/([+-]\d{2}:\d{2})$/)
      
      if (timezoneMatch) {
        // Preservar o timezone da data de início
        const timezoneOffset = timezoneMatch[1]
        const endYear = endDate.getFullYear()
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
        const endDay = String(endDate.getDate()).padStart(2, '0')
        const endHours = String(endDate.getHours()).padStart(2, '0')
        const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
        const endSeconds = String(endDate.getSeconds()).padStart(2, '0')
        finalEndAt = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:${endSeconds}${timezoneOffset}`
      } else {
        // Sem timezone explícito, usar ISO (UTC)
        finalEndAt = endDate.toISOString()
      }
    }

    // Inserir agendamento no banco
    const { data: schedule, error: insertError } = await supabase
      .from('maturacao_schedules')
      .insert({
        user_id: user.id,
        sessions,
        cadence_seconds: cadenceSeconds,
        message_templates: messageTemplates,
        number_of_rounds: numberOfRounds,
        minutes_per_round: minutesPerRound,
        pause_minutes_between_rounds: pauseMinutesBetweenRounds,
        scheduled_start_at: scheduledStartAt,
        scheduled_end_at: finalEndAt,
        status: 'agendado'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[MATURACAO SCHEDULE] Erro ao inserir agendamento:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar agendamento: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log('[MATURACAO SCHEDULE] Agendamento criado:', {
      id: schedule.id,
      scheduledStartAt,
      scheduledEndAt: finalEndAt,
      user: user.id
    })

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        scheduledStartAt: schedule.scheduled_start_at,
        scheduledEndAt: schedule.scheduled_end_at,
        status: schedule.status
      }
    })
  } catch (e) {
    console.error('[MATURACAO SCHEDULE] Erro na função POST:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao criar agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

