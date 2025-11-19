import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { instanceName, apiUrl, globalApiKey, userId } = req.body

    if (!instanceName) {
      return res.status(200).json({ success: false, error: 'Nome da instância é obrigatório' },
        { status: 400 }
      )
    }

    if (!apiUrl || !globalApiKey) {
      return res.status(200).json({ success: false, error: 'URL da API e API KEY GLOBAL são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificação de permissão simplificada
    // Com o novo sistema de nomes, não podemos mais verificar pelo prefixo
    // Por enquanto, permitir desconexão para todos os usuários autenticados
    console.log('Verificação de permissão simplificada - permitindo desconexão para usuário:', userId)

    // Desconectar instância
    const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': globalApiKey
      }
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Instância desconectada com sucesso'
      })
    } else {
      return res.status(200).json({
        success: false,
        error: data.message || 'Erro ao desconectar instância'
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao desconectar instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}