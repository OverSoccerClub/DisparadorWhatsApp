import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get('instanceName')

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: 'Nome da instância é obrigatório' },
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
      return NextResponse.json({
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
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao verificar status da instância'
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao verificar status da instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
