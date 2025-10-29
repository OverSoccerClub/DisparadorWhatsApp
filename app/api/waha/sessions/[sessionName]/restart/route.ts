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

// POST - Reiniciar uma sessão
export async function POST(
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

    const response = await fetch(`${config.apiUrl}/api/${sessionName}/restart`, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || `Erro ao reiniciar sessão: ${response.statusText}`
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Sessão reiniciada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao reiniciar sessão:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao reiniciar sessão: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
