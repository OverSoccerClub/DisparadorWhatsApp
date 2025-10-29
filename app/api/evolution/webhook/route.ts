import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('Webhook Evolution API recebido:', data)

    // Processar diferentes tipos de eventos
    switch (data.event) {
      case 'APPLICATION_STARTUP':
        console.log('Aplicação iniciada')
        break
        
      case 'QRCODE_UPDATED':
        console.log('QR Code atualizado:', data.data?.qrcode?.base64)
        // Aqui você pode salvar o QR Code no banco de dados
        break
        
      case 'CONNECTION_UPDATE':
        console.log('Status da conexão atualizado:', data.data?.state)
        // Aqui você pode atualizar o status da conexão
        break
        
      case 'MESSAGES_UPSERT':
        console.log('Nova mensagem recebida:', data.data)
        // Aqui você pode processar mensagens recebidas
        break
        
      case 'MESSAGES_UPDATE':
        console.log('Mensagem atualizada:', data.data)
        // Aqui você pode processar atualizações de mensagens (entregue, lida, etc.)
        break
        
      case 'SEND_MESSAGE':
        console.log('Mensagem enviada:', data.data)
        // Aqui você pode processar confirmações de envio
        break
        
      default:
        console.log('Evento não tratado:', data.event)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
