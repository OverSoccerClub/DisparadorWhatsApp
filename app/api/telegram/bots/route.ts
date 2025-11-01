import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, bot_token, bot_username, numero_remetente, status } = body

    if (!nome || !bot_token) {
      return NextResponse.json({ error: 'Nome e token do bot são obrigatórios' }, { status: 400 })
    }

    // Criar bot
    const { data, error } = await supabase
      .from('telegram_bots')
      .insert({
        user_id: user.id,
        nome,
        bot_token,
        bot_username: bot_username || null,
        numero_remetente: numero_remetente || null,
        status: status || 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar bot:', error)
      return NextResponse.json({ error: 'Erro ao criar bot' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bot: data })
  } catch (error) {
    console.error('Erro ao criar bot:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Buscar bots do Telegram do usuário
    const { data: bots, error: botsError } = await supabase
      .from('telegram_bots')
      .select('id, nome, bot_token, bot_username, numero_remetente, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (botsError) {
      console.error('Erro ao buscar bots do Telegram:', botsError)
      return NextResponse.json({ success: false, error: 'Erro ao buscar bots' }, { status: 500 })
    }

    // Validar bots testando conexão com Telegram API
    const validatedBots = await Promise.all((bots || []).map(async (bot: any) => {
      try {
        // Testar conexão com o bot usando getMe
        const testResponse = await fetch(`https://api.telegram.org/bot${bot.bot_token}/getMe`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (testResponse.ok) {
          const botInfo = await testResponse.json()
          return {
            id: bot.id,
            nome: bot.nome,
            botToken: bot.bot_token,
            botUsername: botInfo.result?.username || bot.bot_username,
            numeroRemetente: bot.numero_remetente,
            status: bot.status === 'active' && testResponse.ok ? 'active' : 'inactive'
          }
        } else {
          return {
            id: bot.id,
            nome: bot.nome,
            botToken: bot.bot_token,
            botUsername: bot.bot_username,
            numeroRemetente: bot.numero_remetente,
            status: 'inactive'
          }
        }
      } catch (error) {
        console.error(`Erro ao validar bot ${bot.nome}:`, error)
        return {
          id: bot.id,
          nome: bot.nome,
          botToken: bot.bot_token,
          botUsername: bot.bot_username,
          numeroRemetente: bot.numero_remetente,
          status: 'inactive'
        }
      }
    }))

    return NextResponse.json({ success: true, bots: validatedBots })
  } catch (error) {
    console.error('Erro ao listar bots do Telegram:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

