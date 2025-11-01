import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_token } = body

    if (!bot_token) {
      return NextResponse.json({ error: 'Token do bot é obrigatório' }, { status: 400 })
    }

    // Testar conexão com o bot usando getMe
    const response = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.ok && data.result) {
        return NextResponse.json({
          success: true,
          bot_info: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            is_bot: data.result.is_bot
          }
        })
      } else {
        return NextResponse.json({ error: 'Token inválido ou bot não encontrado' }, { status: 400 })
      }
    } else {
      const errorData = await response.json().catch(() => ({ description: 'Erro desconhecido' }))
      return NextResponse.json({ 
        error: errorData.description || 'Erro ao conectar com o Telegram' 
      }, { status: response.status })
    }
  } catch (error) {
    console.error('Erro ao testar bot do Telegram:', error)
    return NextResponse.json({ error: 'Erro interno ao testar bot' }, { status: 500 })
  }
}

