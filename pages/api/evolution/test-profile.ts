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
    const { apiUrl, globalApiKey, instanceName } = req.body

    console.log('Testando busca de perfil para instância:', instanceName)
    console.log('API URL:', apiUrl)

    if (!apiUrl || !globalApiKey || !instanceName) {
      return res.status(200).json({ success: false, error: 'URL da API, API KEY GLOBAL e nome da instância são obrigatórios' },
        { status: 400 }
      )
    }

    // Testar diferentes endpoints da Evolution API para buscar perfil
    const endpoints = [
      `/chat/fetchProfile/${instanceName}`,
      `/chat/profile/${instanceName}`,
      `/instance/profile/${instanceName}`,
      `/profile/${instanceName}`,
      `/chat/getProfile/${instanceName}`
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        console.log(`Testando endpoint: ${endpoint}`)
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': globalApiKey
          }
        })

        const data = await response.json()
        console.log(`Resposta do endpoint ${endpoint}:`, {
          status: response.status,
          ok: response.ok,
          data: data
        })

        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          data: data
        })
      } catch (error) {
        console.log(`Erro no endpoint ${endpoint}:`, error)
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Teste de endpoints concluído',
      results
    })

  } catch (error) {
    console.error('Erro no teste de perfil:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}