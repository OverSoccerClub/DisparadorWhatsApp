import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { body } = req
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
      return res.status(400).json({ error: 'Selecione ao menos duas sessões' })
    }

    if (!scheduledStartAt) {
      return res.status(400).json({ error: 'Data e hora de início são obrigatórias' })
    }

    // Validar e parsear data/hora
    // O frontend envia com timezone (ex: 2025-11-01T15:42:00-03:00)
    // Precisamos garantir que a hora seja preservada
    let scheduledDate: Date
    try {
      scheduledDate = new Date(scheduledStartAt)
      
      // Validar se a data é válida
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: 'Data/hora inválida' })
      }
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao processar data/hora: ' + (error instanceof Error ? error.message : String(error)) })
    }
    
    // Validar data no futuro
    const now = new Date()
    if (scheduledDate <= now) {
      return res.status(400).json({ error: 'A data e hora de agendamento deve ser no futuro' })
    }

    // Autenticar usuário
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
          },
          remove(name: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
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
      return res.status(500).json({ error: 'Erro ao criar agendamento: ' + insertError.message })
    }

    console.log('[MATURACAO SCHEDULE] Agendamento criado:', {
      id: schedule.id,
      scheduledStartAt,
      scheduledEndAt: finalEndAt,
      user: user.id
    })

    return res.status(200).json({
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
    return res.status(200).json({
        error: 'Erro ao criar agendamento',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
}