import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    // Criar cliente Supabase com autenticação via cookies
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { apiUrl, apiKey } = body

    if (!apiUrl) {
      return NextResponse.json({ error: 'URL da API é obrigatória' }, { status: 400 })
    }

    // Testar conexão com o servidor WAHA
    try {
      const testUrl = `${apiUrl}/api/sessions`
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      // Adicionar API key se fornecida (WAHA aceita ambos os formatos)
      if (apiKey && apiKey.trim() !== '') {
        headers['X-Api-Key'] = apiKey.trim()
        headers['Authorization'] = `Bearer ${apiKey.trim()}`
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `Servidor WAHA retornou erro: ${response.status} ${response.statusText}`
        }, { status: 200 }) // Retornar 200 mas com success: false
      }

      const data = await response.json()

      // Contar sessões ativas
      const sessions = Array.isArray(data) ? data : []
      const activeConnections = sessions.filter((s: any) => s.status === 'WORKING' || s.status === 'CONNECTED').length

      return NextResponse.json({
        success: true,
        data: {
          instances: sessions.length,
          activeConnections,
          sessions
        }
      })
    } catch (error: any) {
      console.error('Erro ao testar conexão WAHA:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Falha ao conectar com o servidor WAHA'
      }, { status: 200 }) // Retornar 200 mas com success: false
    }
  } catch (error) {
    console.error('Erro ao processar teste de conexão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
