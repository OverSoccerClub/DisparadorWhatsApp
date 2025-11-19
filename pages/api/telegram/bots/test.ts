import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { body } = req
    const { bot_token } = body

    if (!bot_token) {
      return res.status(400).json({ error: 'Token do bot é obrigatório' })
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
        return res.status(200).json({
          success: true,
          bot_info: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            is_bot: data.result.is_bot
          }
        })
      } else {
        return res.status(400).json({ error: 'Token inválido ou bot não encontrado' })
      }
    } else {
      const errorData = await response.json().catch(() => ({ description: 'Erro desconhecido' }))
      return res.status(200).json({ 
        error: errorData.description || 'Erro ao conectar com o Telegram' 
      }, { status: response.status })
    }
  } catch (error) {
    console.error('Erro ao testar bot do Telegram:', error)
    return res.status(500).json({ error: 'Erro interno ao testar bot' })
  }
}
}