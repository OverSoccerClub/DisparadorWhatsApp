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
  { params }: { params: Promise<{ sessionName: string }> | { sessionName: string } }
) {
  try {
    const url = new URL(request.url)
    const serverId = url.searchParams.get('serverId') || ''
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'serverId é obrigatório' }, { status: 400 })
    }

    // Suportar Next.js 15 (params como Promise) e versões anteriores
    const resolvedParams = params instanceof Promise ? await params : params
    const sessionName = resolvedParams.sessionName

    const config = await getWahaConfigForUser(serverId)

    // Tentar diferentes formatos de endpoint do WAHA
    const restartEndpoints = [
      `${config.apiUrl}/api/sessions/${sessionName}/restart`,  // Formato com /sessions/
      `${config.apiUrl}/api/${sessionName}/restart`,           // Formato direto
      `${config.apiUrl}/api/restart`,                          // Formato com body
    ]
    
    const headers: Record<string, string> = {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }
    
    let response: Response | null = null
    let lastError: any = null
    
    // Tentar cada endpoint até encontrar um que funcione
    for (const endpoint of restartEndpoints) {
      try {
        // Para o endpoint /api/restart (sem sessionName na URL), enviar sessionName no body
        const isRestartOnlyEndpoint = endpoint === `${config.apiUrl}/api/restart`
        const body = isRestartOnlyEndpoint
          ? JSON.stringify({ session: sessionName })
          : undefined
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(30000) // 30 segundos de timeout
        })
        
        if (response.ok) {
          break
        } else {
          const errorText = await response.text().catch(() => '')
          lastError = { status: response.status, message: errorText }
          response = null // Continuar tentando
        }
      } catch (error) {
        lastError = error
        response = null // Continuar tentando
      }
    }
    
    if (!response) {
      return NextResponse.json({
        success: false,
        error: `Erro ao reiniciar sessão: Nenhum endpoint funcionou. Último erro: ${lastError?.message || lastError || 'Desconhecido'}`
      }, { status: 500 })
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || `Erro ao reiniciar sessão: ${response.statusText}`
      }, { status: response.status })
    }

    const responseData = await response.json().catch(() => ({ success: true }))

    return NextResponse.json({
      success: true,
      message: 'Sessão reiniciada com sucesso',
      data: responseData
    })
  } catch (error) {
    console.error('[RESTART] Erro ao reiniciar sessão:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao reiniciar sessão: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

