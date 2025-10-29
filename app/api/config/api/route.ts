import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl, webhookSecret, apiKey, baseUrl, timeout, retryAttempts, rateLimit } = body

    // Validar dados obrigatórios
    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL do webhook é obrigatória' }, { status: 400 })
    }

    // Validar URL do webhook
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: 'URL do webhook inválida' }, { status: 400 })
    }

    // Aqui você salvaria as configurações no banco de dados
    // Por enquanto, vamos simular o salvamento
    const config = {
      webhookUrl,
      webhookSecret,
      apiKey,
      baseUrl,
      timeout: parseInt(timeout) || 30,
      retryAttempts: parseInt(retryAttempts) || 3,
      rateLimit: parseInt(rateLimit) || 100,
      updatedAt: new Date().toISOString()
    }

    // Simular salvamento
    console.log('Configurações de API salvas:', config)

    return NextResponse.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso',
      data: config
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Aqui você buscaria as configurações do banco de dados
    // Por enquanto, vamos retornar configurações padrão
    const defaultConfig = {
      webhookUrl: '',
      webhookSecret: '',
      apiKey: '',
      baseUrl: '',
      timeout: 30,
      retryAttempts: 3,
      rateLimit: 100
    }

    return NextResponse.json({ data: defaultConfig })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
