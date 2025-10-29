import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST() {
  try {
    await whatsappService.reconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Tentativa de reconexão iniciada'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao reconectar WhatsApp' 
    }, { status: 500 })
  }
}
