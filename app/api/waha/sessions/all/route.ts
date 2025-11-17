import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserWithRetry } from '@/lib/utils/rate-limit-handler'

export async function GET() {
  try {
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

    // Usar retry automático para rate limit
    let authResult
    try {
      authResult = await getUserWithRetry(supabase, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      })
    } catch (error: any) {
      // Se ainda falhou após retries, retornar erro de rate limit
      if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
        return NextResponse.json({ 
          success: false, 
          error: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
          rateLimited: true
        }, { status: 429 })
      }
      return NextResponse.json({ success: false, error: 'Erro de autenticação' }, { status: 401 })
    }
    
    const { data: { user }, error: authError } = authResult
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { data: servers, error: serversError } = await supabase
      .from('waha_servers')
      .select('id, nome, api_url, api_key')
      .eq('user_id', user.id)

    if (serversError) {
      return NextResponse.json({ success: false, error: 'Erro ao buscar servidores' }, { status: 500 })
    }

    const fetchWithTimeout = async (url: string, options: any, timeoutMs = 8000) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, { ...options, signal: controller.signal })
        return res
      } finally {
        clearTimeout(timeout)
      }
    }

    const results = await Promise.allSettled(
      (servers || []).map(async (server) => {
        console.log(`🔍 Buscando sessões no servidor: ${server.nome} (${server.api_url})`)
        
        // Preparar headers de autenticação
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        
        // Adicionar autenticação se API key estiver disponível
        if (server.api_key && server.api_key.trim() !== '') {
          // WAHA aceita tanto X-Api-Key quanto Authorization Bearer
          headers['X-Api-Key'] = server.api_key.trim()
          headers['Authorization'] = `Bearer ${server.api_key.trim()}`
        }
        
        const res = await fetchWithTimeout(`${server.api_url}/api/sessions`, {
          method: 'GET',
          headers,
        })
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => '')
          console.log(`❌ Erro no servidor WAHA - ${server.nome}: ${res.status}${errorText ? ` - ${errorText.substring(0, 100)}` : ''}`)
          return []
        }
        const list = await res.json()
        if (!Array.isArray(list)) {
          console.log(`⚠️ Resposta inválida do servidor ${server.nome}`)
          return []
        }
        console.log(`✅ Servidor ${server.nome}: ${list.length} sessões encontradas`)
        
        // Processar cada sessão para buscar foto de perfil
        const sessionsWithProfilePics = await Promise.all(list.map(async (s: any) => {
          // Buscar foto de perfil se a sessão estiver conectada
          let profilePicture = null
          if (s.status === 'WORKING' && s.me?.id) {
            try {
              // Buscar foto de perfil do usuário conectado
              const profileHeaders: HeadersInit = {}
              if (server.api_key && server.api_key.trim() !== '') {
                profileHeaders['X-Api-Key'] = server.api_key.trim()
                profileHeaders['Authorization'] = `Bearer ${server.api_key.trim()}`
              }
              
              const profileResponse = await fetchWithTimeout(`${server.api_url}/api/${s.name}/profile-picture/${s.me.id}`, {
                method: 'GET',
                headers: profileHeaders,
              }, 5000)
              
              if (profileResponse.ok) {
                const contentType = profileResponse.headers.get('content-type') || ''
                if (contentType.includes('image/')) {
                  // Se retornou imagem, converter para base64
                  const buffer = Buffer.from(await profileResponse.arrayBuffer())
                  const base64 = buffer.toString('base64')
                  const mime = contentType.split(';')[0]
                  profilePicture = `data:${mime};base64,${base64}`
                }
              }
            } catch (e) {
              console.log(`⚠️ Erro ao buscar foto de perfil da sessão ${s.name}:`, e)
            }
          }
          
          return {
            name: s.name,
            status: s.status,
            config: s.config,
            me: s.me,
            serverId: server.id,
            serverName: server.nome,
            // Informações adicionais
            avatar: profilePicture || null,
            connectedAt: s.connectedAt || (s.status === 'WORKING' ? new Date().toISOString() : null),
            phoneNumber: s.me?.id ? s.me.id.replace('@c.us', '') : null,
          }
        }))
        
        return sessionsWithProfilePics
      })
    )

    const sessions = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
    console.log(`📊 Total de sessões encontradas: ${sessions.length}`)

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error('Erro ao listar sessões de todos servidores:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}


