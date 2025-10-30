import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { WahaVariationService } from '@/lib/waha-variation-service'
import { generateTypedVariations } from '@/lib/messageVariations'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      originalMessage, 
      prompt, 
      count = 3, 
      language = 'português brasileiro',
      tone = 'profissional e amigável',
      maxLength = 500
    } = body

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
      const body = await request.json()
      const originalMessage: string = body.originalMessage
      const count: number = body.count || 3

      const primaryUrl = (originalMessage.match(/https?:\/\/\S+/i) || [])[0]
      const responsibility = 'Jogue com responsabilidade'

      let variations = generateTypedVariations(originalMessage, count)
      // Garantir link e responsabilidade
      variations = variations.map(v => {
        let s = v
        if (primaryUrl && !s.includes(primaryUrl)) s = `${s} ${primaryUrl}`.trim()
        if (!new RegExp(responsibility, 'i').test(s)) s = `${s} ${responsibility}`.trim()
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
