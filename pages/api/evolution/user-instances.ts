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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    // Obter userId do query param ou usar o usuário autenticado
    const userId = (req.query.userId as string) || user.id

    // Validar que o userId é do usuário autenticado
    if (userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' })
    }

    console.log('Buscando instâncias para usuário:', userId)

    const result = await EvolutionConfigService.getUserInstances(userId)

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Instâncias carregadas com sucesso',
        data: result.data
      })
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao buscar instâncias'
      })
    }
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}
