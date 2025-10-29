import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiUrl, globalApiKey } = await request.json()

    console.log('Descobrindo endpoints da Evolution API...')
    console.log('API URL:', apiUrl)

    if (!apiUrl || !globalApiKey) {
      return NextResponse.json(
        { success: false, error: 'URL da API e API KEY GLOBAL são obrigatórios' },
        { status: 400 }
      )
    }

    // Lista de endpoints comuns da Evolution API para testar
    const commonEndpoints = [
      // Endpoints de instância
      '/instance/list',
      '/instance/connectionState',
      '/instance/status',
      '/instance/info',
      
      // Endpoints de chat
      '/chat/list',
      '/chat/profile',
      '/chat/fetchProfile',
      '/chat/getProfile',
      '/chat/contacts',
      '/chat/groups',
      
      // Endpoints de perfil
      '/profile',
      '/profile/me',
      '/profile/user',
      '/profile/instance',
      
      // Endpoints de usuário
      '/user/profile',
      '/user/info',
      '/user/me',
      
      // Endpoints de WhatsApp
      '/whatsapp/profile',
      '/whatsapp/user',
      '/whatsapp/me',
      
      // Endpoints de dados
      '/data/profile',
      '/data/user',
      '/data/me',
      
      // Endpoints de API
      '/api/profile',
      '/api/user',
      '/api/me',
      
      // Endpoints de status
      '/status/profile',
      '/status/user',
      '/status/me'
    ]

    const results = []

    for (const endpoint of commonEndpoints) {
      try {
        console.log(`Testando endpoint: ${endpoint}`)
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': globalApiKey
          }
        })

        const data = await response.json()
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        console.log(`Endpoint ${endpoint}:`, {
          status: response.status,
          ok: response.ok,
          dataKeys: data ? Object.keys(data) : 'N/A'
        })
      } catch (error) {
        console.log(`Erro no endpoint ${endpoint}:`, error instanceof Error ? error.message : String(error))
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Filtrar apenas endpoints que funcionaram
    const workingEndpoints = results.filter(r => r.ok && r.status === 200)
    const profileEndpoints = results.filter(r => 
      r.ok && 
      r.data && 
      (JSON.stringify(r.data).toLowerCase().includes('name') || 
       JSON.stringify(r.data).toLowerCase().includes('profile') ||
       JSON.stringify(r.data).toLowerCase().includes('user'))
    )

    return NextResponse.json({
      success: true,
      message: 'Descoberta de endpoints concluída',
      data: {
        totalEndpoints: commonEndpoints.length,
        workingEndpoints: workingEndpoints.length,
        profileEndpoints: profileEndpoints.length,
        allResults: results,
        workingEndpointsList: workingEndpoints,
        profileEndpointsList: profileEndpoints
      }
    })

  } catch (error) {
    console.error('Erro na descoberta de endpoints:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
