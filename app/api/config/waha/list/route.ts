import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
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

    // Buscar servidores WAHA do usuário
    const { data, error } = await supabase
      .from('waha_servers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar servidores WAHA:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mapear os dados do banco para o formato esperado pelo frontend
    const servers = (data || []).map(server => ({
      id: server.id,
      name: server.nome,
      apiUrl: server.api_url,
      apiKey: server.api_key,
      webhookUrl: server.webhook_url,
      webhookSecret: server.webhook_secret,
      timeout: server.timeout,
      retryAttempts: server.retry_attempts,
      rateLimit: server.rate_limit,
      enableAutoReconnect: true,
      enableQrCode: true,
      enablePresence: true
    }))

    return NextResponse.json({ 
      success: true, 
      servers
    })
  } catch (error) {
    console.error('Erro ao listar servidores WAHA:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

