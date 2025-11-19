import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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
      return res.status(400).json({
        success: false,
        error: 'Configuração da Evolution API não encontrada'
      })
    }

    // Buscar primeira instância do usuário
    const { data: instances, error: instancesError } = await supabase
      .from('evolution_instances')
      .select('instance_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (instancesError || !instances) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma instância configurada'
      })
    }

    // Conectar instância na Evolution API
    try {
      const response = await fetch(`${evolutionConfig.api_url}/instance/connect/${instances.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.global_api_key
        }
      })

      if (response.ok) {
        return res.status(200).json({
          success: true,
          message: 'Instância conectada com sucesso'
        })
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        return res.status(400).json({
          success: false,
          error: errorData.message || 'Erro ao conectar instância'
        })
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao conectar com a Evolution API'
      })
    }
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}

