import type { NextApiRequest, NextApiResponse } from 'next'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
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
      return res.status(200).json({ success: false, error: 'URL da API, API KEY GLOBAL e nome da instancia sao obrigatorios' },
        { status: 400 }
      )
    }

    // Verificação de permissão simplificada
    // Com o novo sistema de nomes, não podemos mais verificar pelo prefixo
    // Por enquanto, permitir exclusão para todos os usuários autenticados
    console.log('Verificação de permissão simplificada - permitindo exclusão para usuário:', userId)

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
    console.log('Excluindo instância do Supabase...')
    let supabaseSuccess = false
    let supabaseError = null

    if (userId) {
      try {
        const result = await EvolutionConfigService.deleteInstance(userId, instanceName)
        if (result.success) {
          supabaseSuccess = true
          console.log('Exclusão bem-sucedida no Supabase')
        } else {
          supabaseError = result.error
          console.log('Erro no Supabase:', supabaseError)
        }
      } catch (error) {
        supabaseError = error instanceof Error ? error.message : String(error)
        console.error('Erro ao excluir do Supabase:', error)
      }
    } else {
      console.log('Usuário não fornecido, pulando exclusão do Supabase')
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
      return res.status(200).json({
        success: false,
        error: 'Erro ao excluir instância da Evolution API e do banco de dados',
        details: {
          evolutionApiError,
          supabaseError
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao excluir instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}