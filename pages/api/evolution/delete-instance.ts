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
      const sanitizedApiUrl = apiUrl.replace(/\/+$/, '')
      const encodedInstanceName = encodeURIComponent(instanceName)
      const trimmedApiKey = globalApiKey.trim()
      const evolutionUrl = `${sanitizedApiUrl}/instance/delete/${encodedInstanceName}`

      console.log('Fazendo requisição real para Evolution API:', evolutionUrl)
      const response = await fetch(evolutionUrl, {
        method: 'DELETE',
        headers: {
          'apikey': trimmedApiKey,
          'Authorization': `Bearer ${trimmedApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      console.log('📊 Resposta da Evolution API:', response.status, response.statusText)
      
      let data: any = null
      let responseText = ''
      
      try {
        responseText = await response.text()
        if (responseText && responseText.trim()) {
          try {
            data = JSON.parse(responseText)
          } catch {
            // Se não for JSON, usar como texto
            data = responseText
          }
        }
      } catch (textError) {
        console.log('⚠️ Não foi possível ler o corpo da resposta')
      }
      
      console.log('📦 Dados da resposta da Evolution API:', data || '(vazio)')

      // Verificar se a exclusão foi bem-sucedida
      // Evolution API pode retornar 200, 204 ou 202 para sucesso
      if (response.ok || response.status === 200 || response.status === 204 || response.status === 202) {
        evolutionApiSuccess = true
        console.log('✅ Exclusão bem-sucedida na Evolution API')
      } else {
        // Verificar se há mensagem de erro na resposta
        evolutionApiError =
          (typeof data === 'string' && data.trim() ? data.trim() : null) ||
          (data?.message ? String(data.message) : null) ||
          (data?.error ? String(data.error) : null) ||
          `Erro HTTP ${response.status}: ${response.statusText || 'Erro desconhecido'}`
        console.error('❌ Erro na Evolution API:', evolutionApiError)
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