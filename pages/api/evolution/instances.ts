import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Configuração do servidor incompleta' 
      })
    }

    // Criar cliente Supabase com gerenciamento de cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // Verificar autenticação usando Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Erro na autenticação:', authError)
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      })
    }

    console.log('✅ Usuário autenticado:', user.email)

    // Buscar instâncias do usuário usando o serviço
    const result = await EvolutionConfigService.getUserInstances(user.id)

    if (!result.success) {
      console.error('Erro ao buscar instâncias:', result.error)
      return res.status(500).json({
        success: false,
        message: result.error || 'Erro ao buscar instâncias'
      })
    }

    const instances = result.data || []
    console.log(`📱 Instâncias encontradas: ${instances.length}`)

    const formattedInstances = instances.map(instance => ({
      id: instance.id,
      instanceName: instance.instance_name,
      serverUrl: instance.server_url,
      status: instance.status,
      connectionStatus: instance.status, // Alias para compatibilidade
      profileName: instance.profile_name,
      profilePictureUrl: instance.profile_picture_url,
      qrCode: instance.qr_code,
      lastConnectedAt: instance.last_connected_at,
      createdAt: instance.created_at
    }))

    // Sempre retornar ambos os formatos para compatibilidade
    return res.status(200).json({
      success: true,
      data: formattedInstances,
      instances: formattedInstances
    })
  } catch (error) {
    console.error('Erro ao listar instâncias:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar instâncias' 
    })
  }
}
