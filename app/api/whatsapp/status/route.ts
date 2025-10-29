import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function GET() {
  try {
    const status = await whatsappService.getStatus()
    
    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Erro ao obter status do WhatsApp:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao obter status do WhatsApp' 
    }, { status: 500 })
  }
}
