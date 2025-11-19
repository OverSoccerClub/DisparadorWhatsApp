import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    // Buscar configurações de Evolution API do usuário
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_configs')
      .select('api_url, global_api_key')
      .eq('user_id', user.id)
      .single()

    if (configError || !evolutionConfig) {
      return res.status(200).json({
        success: true,
        data: {
          connected: false,
          message: 'Configuração da Evolution API não encontrada'
        }
      })
    }

    // Buscar instâncias do usuário
    const { data: instances, error: instancesError } = await supabase
      .from('evolution_instances')
      .select('instance_name, status, last_connected_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (instancesError || !instances || instances.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          connected: false,
          message: 'Nenhuma instância configurada'
        }
      })
    }

    const instance = instances[0]

    // Verificar status da instância na Evolution API
    try {
      const response = await fetch(`${evolutionConfig.api_url}/instance/connectionState/${instance.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.global_api_key
        }
      })

      if (response.ok) {
        const data = await response.json()
        const connected = data.instance?.state === 'open' || data.instance?.connectionStatus === 'open'

        return res.status(200).json({
          success: true,
          data: {
            connected,
            phoneNumber: data.instance?.phoneNumber,
            lastSeen: data.instance?.lastSeen,
            instanceName: instance.instance_name,
            status: data.instance?.connectionStatus || data.instance?.state || 'disconnected'
          }
        })
      } else {
        return res.status(200).json({
          success: true,
          data: {
            connected: false,
            message: 'Erro ao verificar status da instância'
          }
        })
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      return res.status(200).json({
        success: true,
        data: {
          connected: false,
          message: 'Erro ao conectar com a Evolution API'
        }
      })
    }
  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}

