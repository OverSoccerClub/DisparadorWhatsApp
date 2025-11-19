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
    const { webhookUrl } = body

    if (!webhookUrl) {
      return res.status(400).json({ error: 'URL do webhook é obrigatória' })
    }

    // Validar URL
    try {
      new URL(webhookUrl)
    } catch {
      return res.status(400).json({ error: 'URL do webhook inválida' })
    }

    // Simular teste do webhook
    const testPayload = {
      event: 'webhook_test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Teste de conectividade do webhook',
        status: 'success'
      }
    }

    try {
      // Aqui você faria uma requisição real para o webhook
      // Por enquanto, vamos simular uma resposta
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhatsApp-Dispatcher/1.0'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      })

      if (response.ok) {
        return res.status(200).json({
          success: true,
          message: 'Webhook testado com sucesso',
          statusCode: response.status,
          responseTime: Date.now() // Simular tempo de resposta
        })
      } else {
        return res.status(200).json({
          success: false,
          message: `Webhook retornou status ${response.status}`,
          statusCode: response.status
        })
      }
    } catch (error) {
      return res.status(200).json({
        success: false,
        message: 'Erro ao conectar com o webhook',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
}