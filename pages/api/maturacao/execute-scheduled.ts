import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Endpoint para executar agendamentos pendentes
 * Este endpoint deve ser chamado periodicamente (via cron ou job scheduler)
 * 
 * Busca agendamentos com status 'agendado' que estão na hora de executar
 * e inicia a maturação correspondente
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies[name]
            },
            set(name: string, value: string, options: CookieOptions) {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
            },
            remove(name: string, options: CookieOptions) {
              res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
            },
          },
        }
      )

      // Tentar autenticar usuário (pode ser chamado do frontend ou cron)
      const { data: { user } } = await supabase.auth.getUser()
      
      const now = new Date()
      const nowISO = now.toISOString()

      // Buscar agendamentos pendentes que devem ser executados agora
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60000).toISOString()
      
      let query = supabase
        .from('maturacao_schedules')
        .select('*')
        .eq('status', 'agendado')
        .gte('scheduled_start_at', tenMinutesAgo)
        .lte('scheduled_start_at', nowISO)
      
      // Se há usuário autenticado, filtrar por user_id
      if (user) {
        query = query.eq('user_id', user.id)
      }
      
      const { data: pendingSchedules, error: fetchError } = await query

      if (fetchError) {
        return res.status(500).json({
          error: 'Erro ao buscar agendamentos: ' + fetchError.message
        })
      }

      if (!pendingSchedules || pendingSchedules.length === 0) {
        return res.status(200).json({
          success: true,
          executed: 0,
          executedIds: [],
          message: 'Nenhum agendamento pendente'
        })
      }

      const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'
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

          // Passar cookies de autenticação
          const cookieHeader = req.headers.cookie || ''
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }
          
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

      return res.status(200).json({
        success: true,
        executed: executed.length,
        total: pendingSchedules.length,
        executedIds: executed,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      return res.status(500).json({
        error: 'Erro ao executar agendamentos',
        details: errorMessage
      })
    }
  }

  if (req.method === 'GET') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies[name]
            },
            set(name: string, value: string, options: CookieOptions) {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
            },
            remove(name: string, options: CookieOptions) {
              res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' })
      }

      const scheduleId = req.query.scheduleId as string

      // Se busca por scheduleId específico
      if (scheduleId) {
        const { data: schedule, error } = await supabase
          .from('maturacao_schedules')
          .select('*')
          .eq('id', scheduleId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ success: true, schedule })
      }

      // Verificar se deve buscar agendamentos próximos
      const checkUpcoming = req.query.checkUpcoming === 'true'
      
      if (checkUpcoming) {
        const now = new Date()
        const nowISO = now.toISOString()
        const oneMinuteFromNow = new Date(now.getTime() + 60000).toISOString()
        
        const { data: upcomingSchedules, error: upcomingError } = await supabase
          .from('maturacao_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'agendado')
          .gte('scheduled_start_at', nowISO)
          .lte('scheduled_start_at', oneMinuteFromNow)
          .order('scheduled_start_at', { ascending: true })
        
        if (upcomingError) {
          return res.status(500).json({ error: upcomingError.message })
        }
        
        return res.status(200).json({ 
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
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ success: true, schedules })
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

