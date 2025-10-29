import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  if (authError || !user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('waha_servers')
    .select('api_url, api_key')
    .eq('user_id', user.id)
    .eq('id', serverId)
    .single()

  if (error || !data) throw new Error('Servidor WAHA não encontrado para este usuário')

  return { apiUrl: data.api_url, apiKey: data.api_key || '' }
}

// GET - Obter QR Code de uma sessão
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionName: string } }
) {
  try {
    const url = new URL(request.url)
    const serverId = url.searchParams.get('serverId') || ''
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'serverId é obrigatório' }, { status: 400 })
    }

    const config = await getWahaConfigForUser(serverId)
    const sessionName = params.sessionName

    const response = await fetch(`${config.apiUrl}/api/${sessionName}/auth/qr`, {
      headers: {
        'X-Api-Key': config.apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || 'QR Code não disponível'
      }, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || ''

    // Caso 1: WAHA retorna imagem (ex: image/png)
    if (contentType.includes('image/')) {
      const buffer = Buffer.from(await response.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mime = contentType.split(';')[0]
      const dataUrl = `data:${mime};base64,${base64}`
      return NextResponse.json({ success: true, qr: dataUrl })
    }

    // Caso 2: WAHA retorna JSON com campo qr
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json({ success: true, qr: data.qr || null })
    }

    // Caso 3: texto simples com data URL
    const text = await response.text()
    return NextResponse.json({ success: true, qr: text })
  } catch (error) {
    console.error('Erro ao obter QR Code:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter QR Code: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
