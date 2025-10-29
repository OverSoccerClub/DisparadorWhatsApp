import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiUrl, globalApiKey, instanceName } = await request.json()

    console.log('Testando estrutura da Evolution API baseada no HTML fornecido...')
    console.log('API URL:', apiUrl)
    console.log('Instance Name:', instanceName)

    if (!apiUrl || !globalApiKey || !instanceName) {
      return NextResponse.json(
        { success: false, error: 'URL da API, API KEY GLOBAL e nome da instância são obrigatórios' },
        { status: 400 }
      )
    }

    // Baseado no HTML fornecido, tentar endpoints que podem retornar:
    // - Avatar: https://pps.whatsapp.net/v/t61.24694-24/...
    // - Nome: "Divulgador de Produtos"
    // - Telefone: "5531920055547"
    // - Estatísticas: 5 (usuários), 11 (mensagens)
    
    const testEndpoints = [
      // Endpoints de instância com dados completos
      `/instance/info/${instanceName}`,
      `/instance/status/${instanceName}`,
      `/instance/details/${instanceName}`,
      `/instance/data/${instanceName}`,
      `/instance/user/${instanceName}`,
      
      // Endpoints de perfil
      `/profile/${instanceName}`,
      `/instance/profile/${instanceName}`,
      `/chat/profile/${instanceName}`,
      `/chat/fetchProfile/${instanceName}`,
      `/chat/getProfile/${instanceName}`,
      
      // Endpoints de dados do usuário
      `/user/profile/${instanceName}`,
      `/user/info/${instanceName}`,
      `/user/data/${instanceName}`,
      
      // Endpoints de WhatsApp
      `/whatsapp/profile/${instanceName}`,
      `/whatsapp/user/${instanceName}`,
      `/whatsapp/info/${instanceName}`,
      
      // Endpoints de dados
      `/data/profile/${instanceName}`,
      `/data/user/${instanceName}`,
      `/data/info/${instanceName}`,
      
      // Endpoints de API
      `/api/profile/${instanceName}`,
      `/api/user/${instanceName}`,
      `/api/info/${instanceName}`,
      
      // Endpoints de status
      `/status/profile/${instanceName}`,
      `/status/user/${instanceName}`,
      `/status/info/${instanceName}`
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testando endpoint: ${endpoint}`)
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': globalApiKey
          }
        })

        const data = await response.json()
        const result = {
          endpoint,
          status: response.status,
          ok: response.ok,
          data: data,
          hasName: data && JSON.stringify(data).toLowerCase().includes('divulgador'),
          hasPhone: data && JSON.stringify(data).toLowerCase().includes('5531920055547'),
          hasAvatar: data && JSON.stringify(data).toLowerCase().includes('whatsapp.net'),
          hasStats: data && (JSON.stringify(data).includes('5') || JSON.stringify(data).includes('11'))
        }
        
        results.push(result)
        
        console.log(`Endpoint ${endpoint}:`, {
          status: response.status,
          ok: response.ok,
          hasName: result.hasName,
          hasPhone: result.hasPhone,
          hasAvatar: result.hasAvatar,
          hasStats: result.hasStats
        })
        
        // Se encontrou dados relevantes, parar aqui
        if (result.ok && (result.hasName || result.hasPhone || result.hasAvatar)) {
          console.log(`✅ Encontrado endpoint com dados relevantes: ${endpoint}`)
          break
        }
      } catch (error) {
        console.log(`Erro no endpoint ${endpoint}:`, error instanceof Error ? error.message : String(error))
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Filtrar resultados com dados relevantes
    const relevantResults = results.filter(r => 
      'ok' in r && r.ok && (r.hasName || r.hasPhone || r.hasAvatar || r.hasStats)
    )

    return NextResponse.json({
      success: true,
      message: 'Teste de estrutura concluído',
      data: {
        totalEndpoints: testEndpoints.length,
        relevantResults: relevantResults.length,
        allResults: results,
        relevantEndpoints: relevantResults
      }
    })

  } catch (error) {
    console.error('Erro no teste de estrutura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
