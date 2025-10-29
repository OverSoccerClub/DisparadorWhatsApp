import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Obter configuração do WAHA a partir de um servidor escolhido pelo usuário
async function getWahaConfigForUser(serverId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('waha_servers')
    .select('api_url, api_key')
    .eq('user_id', user.id)
    .eq('id', serverId)
    .single()

  if (error || !data) {
    throw new Error('Servidor WAHA não encontrado para este usuário')
  }

  return {
    apiUrl: data.api_url,
    apiKey: data.api_key || ''
  }
}

// GET - Listar todas as sessões
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const serverId = url.searchParams.get('serverId') || ''
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'serverId é obrigatório' }, { status: 400 })
    }

    const config = await getWahaConfigForUser(serverId)

    console.log('🔍 Buscando sessões WAHA em:', config.apiUrl)

    const response = await fetch(`${config.apiUrl}/api/sessions`, {
      method: 'GET',
      headers: config.apiKey ? {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar sessões:', response.status, response.statusText)
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar sessões: ${response.status} ${response.statusText}`
      }, { status: response.status })
    }

    const sessions = await response.json()
    console.log('✅ Sessões encontradas:', sessions.length || 0)

    return NextResponse.json({
      success: true,
      sessions: Array.isArray(sessions) ? sessions : []
    })
  } catch (error) {
    console.error('❌ Erro ao listar sessões WAHA:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao conectar com WAHA API. Verifique se o WAHA está rodando em ' + (process.env.WAHA_API_URL || 'http://localhost:3001')
    }, { status: 500 })
  }
}

// POST - Criar nova sessão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, config: sessionConfig, serverId } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Nome da sessão é obrigatório'
      }, { status: 400 })
    }

    if (!serverId) {
      return NextResponse.json({ success: false, error: 'serverId é obrigatório' }, { status: 400 })
    }

    const config = await getWahaConfigForUser(serverId)

    console.log('📱 Criando sessão WAHA:', name)

    // Criar sessão no WAHA seguindo a documentação oficial
    const response = await fetch(`${config.apiUrl}/api/sessions`, {
      method: 'POST',
      headers: config.apiKey ? {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        config: sessionConfig || {}
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Erro ao criar sessão:', errorData)
      return NextResponse.json({
        success: false,
        error: errorData.message || `Erro ao criar sessão: ${response.status} ${response.statusText}`
      }, { status: response.status })
    }

    const session = await response.json()
    console.log('✅ Sessão criada:', session)

    // Aguardar um pouco antes de tentar obter QR code
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Tentar obter QR code se a sessão foi criada
    let qrCode = null
    try {
      console.log('🔍 Tentando obter QR Code...')
      const qrResponse = await fetch(`${config.apiUrl}/api/${name}/auth/qr`, {
        method: 'GET',
        headers: config.apiKey ? {
          'X-Api-Key': config.apiKey
        } : {}
      })
      
      if (qrResponse.ok) {
        const contentType = qrResponse.headers.get('content-type') || ''
        if (contentType.includes('image/')) {
          const buffer = Buffer.from(await qrResponse.arrayBuffer())
          const base64 = buffer.toString('base64')
          const mime = contentType.split(';')[0]
          qrCode = `data:${mime};base64,${base64}`
        } else if (contentType.includes('application/json')) {
          const qrData = await qrResponse.json()
          qrCode = qrData.qr || null
        } else {
          qrCode = await qrResponse.text()
        }
        console.log('✅ QR Code obtido')
      } else {
        console.log('⚠️ QR Code ainda não disponível')
      }
    } catch (qrError) {
      console.log('⚠️ QR Code não disponível ainda:', qrError)
    }

    return NextResponse.json({
      success: true,
      session,
      qr: qrCode
    })
  } catch (error) {
    console.error('❌ Erro ao criar sessão WAHA:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar sessão: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
