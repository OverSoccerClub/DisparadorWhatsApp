import { NextResponse } from 'next/server'

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY
  const nodeEnv = process.env.NODE_ENV
  
  return NextResponse.json({
    hasGeminiKey: !!geminiKey,
    geminiKeyLength: geminiKey?.length || 0,
    nodeEnv,
    message: geminiKey ? 'GEMINI_API_KEY encontrada' : 'GEMINI_API_KEY não encontrada'
  })
}
