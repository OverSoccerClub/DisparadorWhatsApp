import type { NextApiRequest, NextApiResponse } from 'next'
import { InstanceNameGenerator } from '@/lib/instance-name-generator'
import { InstanceUniquenessChecker } from '@/lib/instance-uniqueness-checker'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { body } = req
    console.log('Dados recebidos:', body)
    
    const { apiUrl, globalApiKey, instanceName, webhookUrl, userId } = body

    if (!apiUrl || !globalApiKey) {
      console.log('Campos obrigatórios faltando:', { apiUrl: !!apiUrl, globalApiKey: !!globalApiKey })
      return res.status(200).json({ success: false, error: 'URL da API e API KEY GLOBAL são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar nome único usando o novo sistema
    let finalInstanceName = instanceName
    
    if (!finalInstanceName) {
      console.log('Gerando nome único para usuário:', userId)
      
      // Tentar gerar um nome único
      finalInstanceName = await InstanceNameGenerator.generateUniqueInstanceName(
        { userId },
        async (name) => {
          const result = await InstanceUniquenessChecker.checkInstanceNameUniqueness(
            name,
            userId,
            apiUrl,
            globalApiKey
          )
          return result.isUnique
        }
      )
    } else {
      // Se o usuário forneceu um nome, verificar se é único
      const uniquenessResult = await InstanceUniquenessChecker.checkInstanceNameUniqueness(
        finalInstanceName,
        userId,
        apiUrl,
        globalApiKey
      )
      
      if (!uniquenessResult.isUnique) {
        return res.status(200).json({
          success: false,
          error: `Nome da instância "${finalInstanceName}" já existe. ${uniquenessResult.error || ''}`
        }, { status: 400 })
      }
    }
    
    console.log('Nome da instância final:', finalInstanceName)

    // Configuração mínima da instância - apenas campos essenciais
    const instanceConfig = {
      instanceName: finalInstanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    }

    console.log('Tentando criar instância na Evolution API:', apiUrl)
    console.log('Configuração:', JSON.stringify(instanceConfig, null, 2))

    // Criar instância na Evolution API seguindo a documentação
    const response = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': globalApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(instanceConfig)
    })

    console.log('Status da resposta Evolution API:', response.status)
    const data = await response.json()
    console.log('Resposta da Evolution API:', data)
    
    // Log detalhado da mensagem de erro
    if (data.response && data.response.message && Array.isArray(data.response.message)) {
      console.log('Mensagens de erro detalhadas:', data.response.message)
      data.response.message.forEach((msg: any, index: number) => {
        console.log(`Erro ${index + 1}:`, msg)
      })
    }

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Instância criada com sucesso',
        data: {
          instanceName: finalInstanceName,
          status: 'created',
          instanceData: data
        }
      })
    } else {
      // Extrair mensagem de erro específica
      let errorMessage = 'Erro ao criar instância na Evolution API'
      
      if (data.response && data.response.message) {
        if (Array.isArray(data.response.message)) {
          errorMessage = data.response.message.join(', ')
        } else {
          errorMessage = data.response.message
        }
      } else if (data.message) {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      }

      return res.status(200).json({
        success: false,
        error: errorMessage,
        details: data,
        statusCode: response.status
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro ao criar instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}