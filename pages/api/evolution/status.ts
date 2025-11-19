import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get('instanceName')

    if (!instanceName) {
      return res.status(200).json({ success: false, error: 'Nome da instância é obrigatório' },
        { status: 400 }
      )
    }

    // Aqui você deve usar as configurações salvas da Evolution API
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://sua-evolution-api.com'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'sua-chave-api'

    // Verificar status da instância
    const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey
      }
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: {
          connected: data.instance?.connectionStatus === 'open',
          phoneNumber: data.instance?.phoneNumber,
          lastSeen: data.instance?.lastSeen,
          instanceName,
          status: data.instance?.connectionStatus || 'disconnected'
        }
      })
    } else {
      return res.status(200).json({
        success: false,
        error: data.message || 'Erro ao verificar status da instância'
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao verificar status da instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}