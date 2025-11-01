import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Endpoint para executar agendamentos pendentes
 * Este endpoint deve ser chamado periodicamente (via cron ou job scheduler)
 * 
 * Busca agendamentos com status 'agendado' que estão na hora de executar
 * e inicia a maturação correspondente
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar como sistema (pode usar uma API key ou token especial)
    // Por enquanto, vamos usar autenticação normal mas pode ser melhorado
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

    // Tentar autenticar usuário (pode ser chamado do frontend ou cron)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const now = new Date()
    const nowISO = now.toISOString()

    // Buscar agendamentos pendentes que devem ser executados agora
    // IMPORTANTE: Só executamos agendamentos que JÁ PASSARAM ou estão EXATAMENTE no momento
    // Não executamos agendamentos futuros (isso é por design para garantir execução no horário certo)
    // 
    // Tolerância: aceitamos executar agendamentos que estão até 10 minutos atrasados (para recuperar se houve delay)
    // Mas NUNCA executamos antes do horário agendado
    // IMPORTANTE: As comparações são feitas em UTC porque o Supabase armazena timestamps em UTC
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000).toISOString()
    
    // Se há usuário autenticado, buscar apenas seus agendamentos
    // Se não há (cron job), buscar todos os agendamentos de todos os usuários
    let query = supabase
      .from('maturacao_schedules')
      .select('*')
      .eq('status', 'agendado') // Só executa agendamentos com status 'agendado' (ignora pausados e cancelados)
      .gte('scheduled_start_at', tenMinutesAgo) // Buscar agendamentos desde 10 minutos atrás (tolerância para recuperação)
      .lte('scheduled_start_at', nowISO) // Até AGORA (não no futuro!) - só executa se já passou o horário
    
    // Se há usuário autenticado, filtrar por user_id
    if (user) {
      query = query.eq('user_id', user.id)
    }
    
    const { data: pendingSchedules, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar agendamentos: ' + fetchError.message },
        { status: 500 }
      )
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        executed: 0,
        executedIds: [],
        message: 'Nenhum agendamento pendente'
      })
    }

    const origin = new URL(request.url).origin
    const executed: string[] = []
    const errors: Array<{ id: string; error: string }> = []

    // Processar cada agendamento
    for (const schedule of pendingSchedules) {
      try {
        // Atualizar status para 'executando'
        await supabase
          .from('maturacao_schedules')
          .update({
            status: 'executando',
            updated_at: nowISO
          })
          .eq('id', schedule.id)

        // Gerar ID de maturação
        const maturationId = `scheduled_${schedule.id}_${Date.now()}`

        // Preparar payload para iniciar maturação
        const payload = {
          sessions: schedule.sessions,
          cadenceSeconds: schedule.cadence_seconds || 60,
          messageTemplates: schedule.message_templates || '',
          numberOfRounds: schedule.number_of_rounds || 1,
          minutesPerRound: schedule.minutes_per_round || 10,
          pauseMinutesBetweenRounds: schedule.pause_minutes_between_rounds || 5,
          maturationId
        }

        // IMPORTANTE: Passar cookies de autenticação para que o endpoint de maturação tenha acesso ao usuário
        const cookieHeader = request.headers.get('cookie') || ''
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Passar cookies se existirem (para autenticação)
        if (cookieHeader) {
          headers['Cookie'] = cookieHeader
        }
        
        const startResponse = await fetch(`${origin}/api/maturacao/start`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        if (!startResponse.ok) {
          const errorData = await startResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
          throw new Error(errorData.error || 'Erro ao iniciar maturação')
        }

        // Atualizar agendamento com maturation_id
        await supabase
          .from('maturacao_schedules')
          .update({
            maturation_id: maturationId,
            executed_at: nowISO,
            updated_at: nowISO
          })
          .eq('id', schedule.id)

        executed.push(schedule.id)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Atualizar status para 'erro'
        await supabase
          .from('maturacao_schedules')
          .update({
            status: 'erro',
            error_message: errorMessage,
            updated_at: nowISO
          })
          .eq('id', schedule.id)

        errors.push({ id: schedule.id, error: errorMessage })
      }
    }

    return NextResponse.json({
      success: true,
      executed: executed.length,
      total: pendingSchedules.length,
      executedIds: executed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'Erro ao executar agendamentos',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint GET para verificar agendamentos pendentes (útil para debug)
 * Suporta buscar por scheduleId específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Se busca por scheduleId específico
    if (scheduleId) {
      const { data: schedule, error } = await supabase
        .from('maturacao_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, schedule })
    }

    // Verificar se deve buscar agendamentos próximos (5 segundos antes até 1 minuto depois)
    const checkUpcoming = searchParams.get('checkUpcoming') === 'true'
    
    if (checkUpcoming) {
      const now = new Date()
      const nowISO = now.toISOString()
      const fiveSecondsFromNow = new Date(now.getTime() + 5000).toISOString()
      const oneMinuteFromNow = new Date(now.getTime() + 60000).toISOString()
      
      // Buscar agendamentos que vão iniciar em breve (agora até 1 minuto no futuro)
      // IMPORTANTE: As comparações são feitas em UTC porque o Supabase armazena timestamps em UTC
      const { data: upcomingSchedules, error: upcomingError } = await supabase
        .from('maturacao_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'agendado')
        .gte('scheduled_start_at', nowISO) // Agendamentos que ainda não começaram (>= agora)
        .lte('scheduled_start_at', oneMinuteFromNow) // Até 1 minuto no futuro
        .order('scheduled_start_at', { ascending: true })
      
      if (upcomingError) {
        return NextResponse.json({ error: upcomingError.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        upcomingSchedules: upcomingSchedules || [],
        now: nowISO
      })
    }
    
    // Buscar todos os agendamentos do usuário
    const { data: schedules, error } = await supabase
      .from('maturacao_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_start_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, schedules })
  } catch (e) {
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
}

