import { GoogleGenerativeAI } from '@google/generative-ai'

export interface VariationRequest {
  originalMessage: string
  prompt?: string
  count: number
  language?: string
  tone?: string
  maxLength?: number
}

export interface VariationResult {
  variations: string[]
  originalMessage: string
  generatedAt: string
  prompt: string
}

export class WahaVariationService {
  private static genAI: GoogleGenerativeAI | null = null

  private static initializeAI() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!this.genAI && apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
    return this.genAI
  }

  static async generateVariations(request: VariationRequest): Promise<VariationResult> {
    const ai = this.initializeAI()
    
    if (!ai) {
      throw new Error('Chave da API Gemini não configurada')
    }

    // Seleciona modelo com fallback para versões suportadas
    const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    let model = ai.getGenerativeModel({ model: preferredModel })

    // Prompt padrão se não fornecido
    const defaultPrompt = request.prompt || 
      `Crie ${request.count} variações da seguinte mensagem para WhatsApp, mantendo o mesmo significado e objetivo, mas com palavras e estruturas diferentes. 
      As variações devem ser naturais e adequadas para comunicação comercial.
      Idioma: ${request.language || 'português brasileiro'}
      Tom: ${request.tone || 'profissional e amigável'}
      Máximo de caracteres por variação: ${request.maxLength || 500}

      Mensagem original: "${request.originalMessage}"`

    try {
      let result = await model.generateContent(defaultPrompt)
      const response = await result.response
      const text = response.text()

      // Processa a resposta para extrair as variações
      const variations = this.parseVariations(text, request.count)

      return {
        variations,
        originalMessage: request.originalMessage,
        generatedAt: new Date().toISOString(),
        prompt: defaultPrompt
      }
    } catch (error) {
      // Tentar fallbacks de modelo
      try {
        // 1º fallback: 2.5-pro
        const fb25 = ai.getGenerativeModel({ model: 'gemini-2.5-pro' })
        const result = await fb25.generateContent(defaultPrompt)
        const response = await result.response
        const text = response.text()
        const variations = this.parseVariations(text, request.count)
        return {
          variations,
          originalMessage: request.originalMessage,
          generatedAt: new Date().toISOString(),
          prompt: defaultPrompt
        }
      } catch (fallbackError) {
        try {
          // 2º fallback: 1.5-pro
          const fb15 = ai.getGenerativeModel({ model: 'gemini-1.5-pro' })
          const result = await fb15.generateContent(defaultPrompt)
          const response = await result.response
          const text = response.text()
          const variations = this.parseVariations(text, request.count)
          return {
            variations,
            originalMessage: request.originalMessage,
            generatedAt: new Date().toISOString(),
            prompt: defaultPrompt
          }
        } catch (fb2Error) {
          console.error('Erro ao gerar variações com Gemini (fallbacks):', fb2Error)
          throw new Error(`Falha ao gerar variações: ${fb2Error instanceof Error ? fb2Error.message : 'Erro desconhecido'}`)
        }
      }
    }
  }

  private static parseVariations(text: string, expectedCount: number): string[] {
    // Remove numeração e quebras de linha desnecessárias
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const variations: string[] = []
    
    for (const line of lines) {
      // Remove numeração (1., 2., - , etc.)
      const cleaned = line.replace(/^[\d\.\-\s]+/, '').trim()
      
      if (cleaned.length > 10 && cleaned.length < 1000) { // Filtra linhas muito curtas ou muito longas
        variations.push(cleaned)
      }
    }

    // Se não encontrou variações suficientes, tenta dividir por pontos
    if (variations.length < expectedCount) {
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)
      variations.push(...sentences.slice(0, expectedCount - variations.length))
    }

    // Remove duplicatas e limita ao número esperado
    const uniqueVariations = [...new Set(variations)].slice(0, expectedCount)

    // Se ainda não tem variações suficientes, cria variações simples
    if (uniqueVariations.length < expectedCount) {
      const baseMessage = variations[0] || text
      for (let i = uniqueVariations.length; i < expectedCount; i++) {
        uniqueVariations.push(`${baseMessage} (Variação ${i + 1})`)
      }
    }

    return uniqueVariations
  }

  // Validação de mensagem para variações
  static validateMessageForVariations(message: string): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    if (!message || message.trim().length === 0) {
      issues.push('Mensagem vazia')
      return { isValid: false, issues, suggestions }
    }

    if (message.length < 10) {
      issues.push('Mensagem muito curta')
      suggestions.push('Mensagens muito curtas podem gerar variações limitadas')
    }

    if (message.length > 1000) {
      issues.push('Mensagem muito longa')
      suggestions.push('Considere dividir em mensagens menores')
    }

    // Verifica se tem conteúdo suficiente para variação
    const words = message.split(/\s+/).length
    if (words < 5) {
      issues.push('Poucas palavras para gerar variações')
      suggestions.push('Mensagens com mais palavras geram melhores variações')
    }

    // Verifica caracteres especiais excessivos
    const specialChars = (message.match(/[^\w\s]/g) || []).length
    if (specialChars > message.length * 0.3) {
      issues.push('Muitos caracteres especiais')
      suggestions.push('Reduza emojis e símbolos especiais para melhores variações')
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }

  // Geração de prompt personalizado
  static generateCustomPrompt(options: {
    industry?: string
    targetAudience?: string
    callToAction?: string
    urgency?: boolean
    personalization?: boolean
  }): string {
    let prompt = 'Crie variações da mensagem para WhatsApp com as seguintes características:\n\n'

    if (options.industry) {
      prompt += `- Setor: ${options.industry}\n`
    }

    if (options.targetAudience) {
      prompt += `- Público-alvo: ${options.targetAudience}\n`
    }

    if (options.callToAction) {
      prompt += `- Chamada para ação: ${options.callToAction}\n`
    }

    if (options.urgency) {
      prompt += '- Tom de urgência moderado\n'
    }

    if (options.personalization) {
      prompt += '- Linguagem personalizada e próxima\n'
    }

    prompt += '\nAs variações devem manter o mesmo objetivo da mensagem original, mas com abordagens diferentes e naturais.'

    return prompt
  }

  // Teste de conectividade com Gemini
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const ai = this.initializeAI()
      
      if (!ai) {
        return { success: false, message: 'Chave da API Gemini não configurada' }
      }

      const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      const model = ai.getGenerativeModel({ model: preferredModel })
      const result = await model.generateContent('Teste de conectividade')
      await result.response

      return { success: true, message: `Conexão com Gemini OK (${preferredModel})` }
    } catch (error) {
      return { 
        success: false, 
        message: `Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }
}
