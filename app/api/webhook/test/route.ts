import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL do webhook é obrigatória' }, { status: 400 })
    }

    // Validar URL
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: 'URL do webhook inválida' }, { status: 400 })
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
        return NextResponse.json({
          success: true,
          message: 'Webhook testado com sucesso',
          statusCode: response.status,
          responseTime: Date.now() // Simular tempo de resposta
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `Webhook retornou status ${response.status}`,
          statusCode: response.status
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao conectar com o webhook',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
