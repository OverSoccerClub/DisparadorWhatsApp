import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { WahaVariationService } from '@/lib/waha-variation-service'
import { generateTypedVariations } from '@/lib/messageVariations'

export async function POST(request: NextRequest) {
  // Ler body apenas uma vez para evitar "Body is unusable"
  const rawBody = await request.json().catch(() => null)
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    if (!rawBody) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }
    const { 
      originalMessage, 
      prompt, 
      count = 3, 
      language = 'português brasileiro',
      tone = 'profissional e amigável',
      maxLength = 500
    } = rawBody

    if (!originalMessage) {
      return NextResponse.json({ error: 'Mensagem original é obrigatória' }, { status: 400 })
    }

    // Validação da mensagem
    const validation = WahaVariationService.validateMessageForVariations(originalMessage)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Mensagem inválida para variações',
        issues: validation.issues,
        suggestions: validation.suggestions
      }, { status: 400 })
    }

    const result = await WahaVariationService.generateVariations({
      originalMessage,
      prompt,
      count,
      language,
      tone,
      maxLength
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Erro ao gerar variações (IA):', error)
    // Fallback local sem IA para não bloquear o fluxo
    try {
      if (!rawBody || !rawBody.originalMessage) throw new Error('Body ausente no fallback')
      const originalMessage: string = rawBody.originalMessage
      const count: number = rawBody.count || 3

      // Extrair TODOS os links da mensagem original (obrigatório preservar todos)
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
      const originalUrls = [...new Set((originalMessage.match(urlRegex) || []))]
      const responsibility = 'Jogue com responsabilidade'

      let variations = generateTypedVariations(originalMessage, count)
      // Garantir TODOS os links e responsabilidade em cada variação
      // Comparação case-insensitive e normalizada para garantir preservação
      variations = variations.map(v => {
        let s = v
        // Verificar quais links estão faltando na variação (comparação normalizada)
        const variationUrls = [...new Set((v.match(urlRegex) || []).map(u => u.trim()))]
        const normalizedVariationUrls = variationUrls.map(u => u.toLowerCase().trim())
        const missingLinks = originalUrls.filter(originalUrl => {
          const normalized = originalUrl.toLowerCase().trim()
          return !normalizedVariationUrls.some(vu => vu === normalized || vu.startsWith(normalized) || normalized.startsWith(vu))
        })
        // Adicionar todos os links que estão faltando
        if (missingLinks.length > 0) {
          s = `${s} ${missingLinks.join(' ')}`.trim()
        }
        // Garantir aviso de responsabilidade
        if (!new RegExp(responsibility, 'i').test(s)) {
          s = `${s} ${responsibility}`.trim()
        }
        return s
      })

      return NextResponse.json({ 
        success: true,
        result: {
          variations,
          originalMessage,
          generatedAt: new Date().toISOString(),
          prompt: 'local-fallback'
        }
      })
    } catch (fbError) {
      console.error('Erro no fallback local de variações:', fbError)
      return NextResponse.json({ 
        error: 'Erro ao gerar variações',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 })
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const result = await WahaVariationService.testConnection()

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Erro ao testar conexão Gemini:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
