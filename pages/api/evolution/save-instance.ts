import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }

    const { userId, instanceName, connectionStatus, phoneNumber, profileName, profilePictureUrl, qrCode } = req.body

    // Validar que o userId é do usuário autenticado
    if (userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' })
    }

    if (!instanceName) {
      return res.status(400).json({ success: false, error: 'Nome da instância é obrigatório' })
    }

    console.log('💾 Salvando instância no Supabase:', {
      userId,
      instanceName,
      connectionStatus: connectionStatus || 'disconnected'
    })

    // Salvar instância usando o serviço
    const result = await EvolutionConfigService.saveInstance({
      user_id: userId,
      instance_name: instanceName,
      status: connectionStatus || 'disconnected',
      phone_number: phoneNumber || null,
      profile_name: profileName || null,
      profile_picture_url: profilePictureUrl || null,
      qr_code: qrCode || null,
      last_connected_at: connectionStatus === 'open' || connectionStatus === 'connected' ? new Date().toISOString() : null
    })

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Instância salva com sucesso',
        data: result.data
      })
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao salvar instância'
      })
    }
  } catch (error) {
    console.error('Erro ao salvar instância:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}

