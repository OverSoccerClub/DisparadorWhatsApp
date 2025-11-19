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

    const { data: { user } } = await supabase.auth.getUser()
    
    const userId = req.query.userId as string || user?.id

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    // Validar que o userId é do usuário autenticado (se autenticado)
    if (user && userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' })
    }

    // Buscar instâncias do usuário
    const { data: instances, error } = await supabase
      .from('evolution_instances')
      .select('instance_name')
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao buscar instâncias:', error)
      return res.status(500).json({ success: false, error: 'Erro ao buscar instâncias' })
    }

    if (!instances || instances.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma instância para manter ativa',
        instances: []
      })
    }

    // Buscar configuração do usuário
    const { data: config } = await supabase
      .from('evolution_configs')
      .select('api_url, global_api_key')
      .eq('user_id', userId)
      .single()

    if (!config) {
      return res.status(200).json({
        success: true,
        message: 'Configuração não encontrada',
        instances: []
      })
    }

    // Fazer keep-alive em todas as instâncias
    const results = await Promise.allSettled(
      instances.map(async (instance) => {
        try {
          const response = await fetch(`${config.api_url}/instance/connectionState/${instance.instance_name}`, {
            method: 'GET',
            headers: {
              'apikey': config.global_api_key
            }
          })

          if (response.ok) {
            return { instanceName: instance.instance_name, status: 'ok' }
          } else {
            return { instanceName: instance.instance_name, status: 'error' }
          }
        } catch (error) {
          return { instanceName: instance.instance_name, status: 'error', error: String(error) }
        }
      })
    )

    return res.status(200).json({
      success: true,
      message: 'Keep-alive executado',
      instances: results.map((r, i) => ({
        instanceName: instances[i].instance_name,
        status: r.status === 'fulfilled' ? r.value.status : 'error'
      }))
    })
  } catch (error) {
    console.error('Erro no keep-alive:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

