import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Webhook para n8n enviar código de ativação via WhatsApp
 * 
 * Este endpoint recebe dados do sistema e envia para n8n,
 * que por sua vez envia o código via WhatsApp para o usuário.
 */

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
    const { name, phone, code, email } = body

    // Validação básica
    if (!phone || !code) {
      return res.status(200).json({ success: false, message: 'Telefone e código são obrigatórios' },
        { status: 400 }
      )
    }

    // URL do webhook n8n (configurável via variável de ambiente)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      console.warn('⚠️ N8N_WEBHOOK_URL não configurada. Código não será enviado via WhatsApp.')
      return res.status(200).json({
        success: false,
        message: 'Webhook n8n não configurado',
        code: code, // Retornar código para debug em desenvolvimento
        warning: 'N8N_WEBHOOK_URL não está configurada'
      }, { status: 500 })
    }

    // Normalizar telefone (remover caracteres não numéricos, exceto +)
    const normalizedPhone = phone.replace(/[^\d+]/g, '')
    
    // Garantir formato internacional (adicionar +55 se for número brasileiro sem código)
    let formattedPhone = normalizedPhone
    if (normalizedPhone.length === 11 && !normalizedPhone.startsWith('+')) {
      // Número brasileiro: (11) 98765-4321 -> 5511987654321
      formattedPhone = `55${normalizedPhone}`
    } else if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('+')) {
      // Número brasileiro sem DDD: 98765-4321 -> não adicionar código
      formattedPhone = normalizedPhone
    }

    // Preparar mensagem para WhatsApp
    const message = `Olá ${name || 'usuário'}! 👋\n\n` +
      `Seu código de ativação é: *${code}*\n\n` +
      `Use este código para ativar sua conta no WhatsApp Dispatcher.\n\n` +
      `Este código expira em 24 horas.\n\n` +
      `_Se você não solicitou este código, ignore esta mensagem._`

    // Dados para enviar ao n8n
    const n8nPayload = {
      phone: formattedPhone,
      message: message,
      code: code,
      name: name || 'Usuário',
      email: email,
      type: 'activation_code',
      timestamp: new Date().toISOString()
    }

    // Enviar para n8n
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro ao enviar para n8n:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        
        return res.status(200).json({
          success: false,
          message: 'Erro ao enviar código via WhatsApp',
          error: `n8n retornou status ${response.status}`,
          code: process.env.NODE_ENV === 'development' ? code : undefined
        }, { status: 500 })
      }

      const n8nResponse = await response.json().catch(() => ({}))
      
      console.log('✅ Código enviado para n8n com sucesso:', {
        phone: formattedPhone,
        code: code.substring(0, 2) + '****'
      })

      return res.status(200).json({
        success: true,
        message: 'Código enviado via WhatsApp com sucesso',
        phone: formattedPhone,
        n8nResponse: n8nResponse
      })

    } catch (error: any) {
      console.error('Erro ao chamar webhook n8n:', error)
      
      return res.status(200).json({
        success: false,
        message: 'Erro ao conectar com n8n',
        error: error.message,
        code: process.env.NODE_ENV === 'development' ? code : undefined
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Erro no webhook de ativação:', error)
    return res.status(200).json({ success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    )
  }
}
}