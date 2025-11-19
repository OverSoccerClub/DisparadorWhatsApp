import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      const userId = req.query.userId as string || user.id

      // Validar que o userId é do usuário autenticado
      if (userId !== user.id) {
        return res.status(403).json({ success: false, error: 'Acesso negado' })
      }

      const result = await EvolutionConfigService.getConfig(userId, supabase)

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        })
      } else {
        return res.status(200).json({
          success: true,
          data: null
        })
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error)
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
      }

      const { userId, apiUrl, globalApiKey, webhookUrl } = req.body

      // Validar que o userId é do usuário autenticado
      if (userId && userId !== user.id) {
        return res.status(403).json({ success: false, error: 'Acesso negado' })
      }

      if (!apiUrl || !globalApiKey) {
        return res.status(400).json({ success: false, error: 'API URL e Global API Key são obrigatórios' })
      }

      const result = await EvolutionConfigService.saveConfig(
        {
          user_id: user.id,
          api_url: apiUrl,
          global_api_key: globalApiKey,
          webhook_url: webhookUrl || null
        },
        supabase
      )

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        })
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao salvar configuração'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

