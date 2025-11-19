import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { apiUrl, globalApiKey, instanceName, userId } = req.body
    
    console.log('DELETE Instance - Dados recebidos:', { 
      apiUrl: !!apiUrl, 
      globalApiKey: !!globalApiKey, 
      instanceName, 
      userId 
    })

    if (!apiUrl || !globalApiKey || !instanceName) {
      console.log('Erro: Parâmetros obrigatórios não fornecidos')
      return res.status(400).json({
        success: false,
        error: 'URL da API, API KEY GLOBAL e nome da instancia sao obrigatorios'
      })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            res.setHeader(
              'Set-Cookie',
              `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${
                options.maxAge ? `Max-Age=${options.maxAge}` : ''
              }`
            )
          },
          remove(name: string, _options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          }
        }
      }
    )

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      })
    }

    // Sempre confiar no usuário autenticado
    const effectiveUserId = user.id

    // Validar que o body não tenta excluir outra conta
    if (userId && userId !== effectiveUserId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    console.log('Verificação de permissão - usuário autenticado:', effectiveUserId)

    // Excluir instância da Evolution API
    console.log('Fazendo requisição para Evolution API:', `${apiUrl}/instance/delete/${instanceName}`)
    
    let evolutionApiSuccess = false
    let evolutionApiError = null
    
    // Excluir instância da Evolution API
    try {
      console.log('Fazendo requisição real para Evolution API:', `${apiUrl}/instance/delete/${instanceName}`)
      const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': globalApiKey
        }
      })

      console.log('Resposta da Evolution API:', response.status)
      const data = await response.json()
      console.log('Dados da resposta da Evolution API:', data)

      if (response.ok) {
        evolutionApiSuccess = true
        console.log('Exclusão bem-sucedida na Evolution API')
      } else {
        evolutionApiError = data.message || 'Erro ao excluir da Evolution API'
        console.log('Erro na Evolution API:', evolutionApiError)
      }
    } catch (fetchError) {
      console.error('Erro ao conectar com a Evolution API:', fetchError)
      evolutionApiError = 'Erro ao conectar com a Evolution API: ' + (fetchError instanceof Error ? fetchError.message : String(fetchError))
      console.log('Falha na exclusão da Evolution API:', evolutionApiError)
    }

    // Excluir instância do Supabase
    console.log('🗑️ Excluindo instância do Supabase...', { userId: effectiveUserId, instanceName })
    let supabaseSuccess = false
    let supabaseError = null

    try {
      const result = await EvolutionConfigService.deleteInstance(effectiveUserId, instanceName, supabase)
      console.log('📊 Resultado da exclusão no Supabase:', result)
      
      if (result.success) {
        supabaseSuccess = true
        console.log('✅ Exclusão bem-sucedida no Supabase')
      } else {
        supabaseError = result.error || 'Erro desconhecido ao excluir do Supabase'
        console.error('❌ Erro no Supabase:', supabaseError)
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : String(error)
      console.error('❌ Erro ao excluir do Supabase (catch):', error)
    }

    // Determinar resultado final
    if (evolutionApiSuccess && supabaseSuccess) {
      return res.status(200).json({
        success: true,
        message: 'Instância excluída com sucesso da Evolution API e do banco de dados',
        data: {
          instanceName,
          status: 'deleted',
          evolutionApi: 'success',
          supabase: 'success'
        }
      })
    } else if (evolutionApiSuccess && !supabaseSuccess) {
      return res.status(200).json({
        success: true,
        message: 'Instância excluída da Evolution API, mas houve erro no banco de dados',
        data: {
          instanceName,
          status: 'deleted',
          evolutionApi: 'success',
          supabase: 'error',
          supabaseError
        }
      })
    } else if (!evolutionApiSuccess && supabaseSuccess) {
      return res.status(200).json({
        success: true,
        message: 'Instância excluída do banco de dados, mas houve erro na Evolution API',
        data: {
          instanceName,
          status: 'deleted',
          evolutionApi: 'error',
          evolutionApiError,
          supabase: 'success'
        }
      })
    } else {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir instância da Evolution API e do banco de dados',
        details: {
          evolutionApiError,
          supabaseError
        }
      })
    }

  } catch (error) {
    console.error('Erro ao excluir instância:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}