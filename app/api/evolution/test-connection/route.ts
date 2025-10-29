import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiUrl, globalApiKey, instanceName } = await request.json()

    console.log('Testando conexão com Evolution API...')
    console.log('API URL:', apiUrl)
    console.log('Instance Name:', instanceName)

    if (!apiUrl || !globalApiKey || !instanceName) {
      return NextResponse.json(
        { success: false, error: 'URL da API, API KEY GLOBAL e nome da instância são obrigatórios' },
        { status: 400 }
      )
    }

    // Testar status da instância
    console.log('1. Testando status da instância...')
    const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': globalApiKey
      }
    })

    const statusData = await statusResponse.json()
    console.log('Status da instância:', statusData)

    const connected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
    console.log('Instância conectada:', connected)

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Instância não está conectada',
        status: statusData
      })
    }

    // Testar busca de perfil com múltiplos endpoints
    console.log('2. Testando busca de perfil com múltiplos endpoints...')
    const profileEndpoints = [
      `/chat/fetchProfile/${instanceName}`,
      `/chat/profile/${instanceName}`,
      `/instance/profile/${instanceName}`,
      `/profile/${instanceName}`,
      `/chat/getProfile/${instanceName}`,
      `/chat/fetchProfile/${instanceName}?number=${statusData.instance?.phoneNumber || ''}`,
      `/chat/profile/${instanceName}?number=${statusData.instance?.phoneNumber || ''}`
    ]

    const profileResults = []
    for (const endpoint of profileEndpoints) {
      try {
        console.log(`Testando endpoint: ${endpoint}`)
        const profileResponse = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': globalApiKey
          }
        })

        const profileData = await profileResponse.json()
        profileResults.push({
          endpoint,
          status: profileResponse.status,
          ok: profileResponse.ok,
          data: profileData
        })
        
        console.log(`Endpoint ${endpoint}:`, {
          status: profileResponse.status,
          ok: profileResponse.ok,
          data: profileData
        })
      } catch (error) {
        console.log(`Erro no endpoint ${endpoint}:`, error instanceof Error ? error.message : String(error))
        profileResults.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de conexão concluído',
      data: {
        instanceStatus: statusData,
        profileResults: profileResults,
        connected: connected
      }
    })

  } catch (error) {
    console.error('Erro no teste de conexão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
