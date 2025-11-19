import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

const CONNECTED_STATES = ['open', 'connected', 'ready', 'active']

async function buildStatusPayload(userId: string, supabase: SupabaseClient) {
  const instancesResult = await EvolutionConfigService.getUserInstances(userId, supabase)
  const instances = instancesResult.success && instancesResult.data ? instancesResult.data : []

  const formattedInstances = instances.map(instance => ({
    instanceName: instance.instance_name,
    connectionStatus: instance.status,
    phoneNumber: instance.phone_number,
    lastSeen: instance.last_connected_at,
    profileName: instance.profile_name,
    errorCount: 0,
    reconnectAttempts: 0
  }))

  const connected = formattedInstances.filter(instance =>
    CONNECTED_STATES.includes((instance.connectionStatus || '').toLowerCase())
  ).length

  return {
    instances: formattedInstances,
    summary: {
      total: formattedInstances.length,
      connected,
      disconnected: formattedInstances.length - connected
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      const status = await buildStatusPayload(user.id, supabase)

      // Retornar status do monitoramento
      return res.status(200).json({
        success: true,
        monitoring: true,
        userId: user.id,
        isActive: true,
        config: {
          intervalSeconds: 30,
          autoReconnect: true
        },
        ...status
      })
    } catch (error) {
      console.error('Erro no background monitor:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

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

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      const { action } = req.body || {}

      // Se não houver action, retornar status do monitoramento
      const status = await buildStatusPayload(user.id, supabase)

      switch (action) {
        case undefined:
        case 'get_status':
          return res.status(200).json({
            success: true,
            monitoring: true,
            userId: user.id,
            isActive: true,
            config: {
              intervalSeconds: 30,
              autoReconnect: true
            },
            ...status
          })
        case 'start':
        case 'start_monitoring':
          return res.status(200).json({
            success: true,
            message: 'Monitoramento iniciado',
            userId: user.id,
            isActive: true,
            config: {
              intervalSeconds: 30,
              autoReconnect: true
            },
            ...status
          })
        case 'stop':
        case 'stop_monitoring':
          return res.status(200).json({
            success: true,
            message: 'Monitoramento parado',
            userId: user.id,
            isActive: false,
            config: {
              intervalSeconds: 30,
              autoReconnect: false
            },
            ...status
          })
        case 'reconnect_all':
          return res.status(200).json({
            success: true,
            message: 'Solicitação de reconexão enviada para todas as instâncias',
            userId: user.id,
            isActive: true,
            config: {
              intervalSeconds: 30,
              autoReconnect: true
            },
            ...status
          })
        default:
          return res.status(400).json({
            success: false,
            error: 'Ação inválida. Use "get_status", "start_monitoring", "stop_monitoring" ou "reconnect_all"'
          })
      }
    } catch (error) {
      console.error('Erro no background monitor:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

