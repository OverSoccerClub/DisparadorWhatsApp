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
    const { 
      id,
      name,
      apiUrl, 
      apiKey, 
      webhookUrl, 
      webhookSecret, 
      timeout, 
      retryAttempts, 
      rateLimit,
      enableAutoReconnect,
      enableQrCode,
      enablePresence
    } = body

    // Validar dados obrigatórios
    if (!name || !apiUrl) {
      return NextResponse.json({ error: 'Nome e URL da API são obrigatórios' }, { status: 400 })
    }

    // Validar URL da API
    try {
      new URL(apiUrl)
    } catch {
      return NextResponse.json({ error: 'URL da API do WAHA inválida' }, { status: 400 })
    }

    // Validar webhook URL se fornecida
    if (webhookUrl) {
      try {
        new URL(webhookUrl)
      } catch {
        return NextResponse.json({ error: 'URL do webhook inválida' }, { status: 400 })
      }
    }

    const serverData = {
      user_id: user.id, // Usar o ID do usuário autenticado
      nome: name,
      api_url: apiUrl,
      api_key: apiKey || '',
      webhook_url: webhookUrl || '',
      webhook_secret: webhookSecret || '',
      timeout: parseInt(timeout as string) || 30,
      retry_attempts: parseInt(retryAttempts as string) || 3,
      rate_limit: parseInt(rateLimit as string) || 100,
      ativo: true,
      updated_at: new Date().toISOString()
    }

    if (id) {
      // Atualizar servidor existente
      const { data, error } = await supabase
        .from('waha_servers')
        .update(serverData)
        .eq('id', id)
        .eq('user_id', user.id) // Verificar que pertence ao usuário
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar servidor WAHA:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Servidor WAHA atualizado com sucesso',
        data
      })
    } else {
      // Criar novo servidor
      const { data, error } = await supabase
        .from('waha_servers')
        .insert([serverData])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar servidor WAHA:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Servidor WAHA criado com sucesso',
        data
      })
    }
  } catch (error) {
    console.error('Erro ao salvar servidor WAHA:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do servidor é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('waha_servers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Verificar que pertence ao usuário

    if (error) {
      console.error('Erro ao excluir servidor WAHA:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Servidor WAHA excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir servidor WAHA:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
