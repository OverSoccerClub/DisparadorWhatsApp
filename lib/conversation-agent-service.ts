import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ConversationContext {
  topic: string
  topicDescription: string
  conversationHistory: Array<{
    from: string
    to: string
    message: string
    timestamp: number
  }>
}

export interface ConversationMessageRequest {
  context: ConversationContext
  from: string
  to: string
  messageType: 'greeting' | 'intermediate' | 'response' | 'closing'
  previousMessages?: string[]
}

const TOPICS = [
  {
    name: 'Futebol',
    description: 'Conversas sobre futebol, times, jogos, campeonatos, jogadores, transferências e eventos esportivos. Fale sobre times brasileiros e internacionais, campeonatos, gols históricos, técnicas de jogo e paixão pelo esporte.'
  },
  {
    name: 'Tecnologia',
    description: 'Conversas sobre tecnologia, gadgets, smartphones, computadores, inteligência artificial, inovação, apps, redes sociais e tendências tecnológicas. Fale sobre novidades, produtos lançados e como a tecnologia impacta nosso dia a dia.'
  },
  {
    name: 'Viagens',
    description: 'Conversas sobre viagens, destinos turísticos, experiências de viagem, lugares para conhecer, hotéis, restaurantes, dicas de viagem e histórias interessantes. Fale sobre praias, cidades, países e culturas diferentes.'
  },
  {
    name: 'Música',
    description: 'Conversas sobre música, artistas, shows, festivais, estilos musicais, álbuns, playlists e experiências musicais. Fale sobre música brasileira, internacional, rock, pop, sertanejo, funk e outros gêneros.'
  },
  {
    name: 'Comida e Culinária',
    description: 'Conversas sobre comida, receitas, restaurantes, culinária, pratos favoritos, experiências gastronômicas e dicas culinárias. Fale sobre comidas típicas, pratos regionais e experiências gastronômicas.'
  },
  {
    name: 'Cinema e Séries',
    description: 'Conversas sobre filmes, séries, atores, diretores, estreias, avaliações e recomendações. Fale sobre filmes e séries populares, críticas, teorias e momentos memoráveis.'
  },
  {
    name: 'Esportes em Geral',
    description: 'Conversas sobre diversos esportes, atletas, competições, Olimpíadas, modalidades esportivas e eventos. Fale sobre basquete, vôlei, tênis, natação e outros esportes além do futebol.'
  },
  {
    name: 'Negócios e Empreendedorismo',
    description: 'Conversas sobre negócios, empreendedorismo, startups, investimentos, mercado financeiro e oportunidades de negócio. Fale sobre ideias inovadoras, cases de sucesso e dicas de empreendedorismo.'
  }
]

export class ConversationAgentService {
  private static genAI: GoogleGenerativeAI | null = null

  private static initializeAI() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!this.genAI && apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
    return this.genAI
  }

  /**
   * Gera um tópico aleatório para a conversa
   */
  static generateRandomTopic(): { name: string; description: string } {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
    return {
      name: topic.name,
      description: topic.description
    }
  }

  /**
   * Gera uma mensagem contextualizada baseada no tópico da conversa
   */
  static async generateContextualMessage(request: ConversationMessageRequest): Promise<string> {
    const ai = this.initializeAI()
    
    if (!ai) {
      // Fallback para mensagens simples se Gemini não estiver disponível
      return this.getFallbackMessage(request.messageType, request.to)
    }

    const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    let model = ai.getGenerativeModel({ model: preferredModel })

    const { context, from, to, messageType, previousMessages = [] } = request

    // Construir histórico da conversa recente para contexto
    const recentHistory = previousMessages.slice(-3).map((msg, idx) => 
      `Mensagem ${idx + 1}: ${msg}`
    ).join('\n')

    let prompt = ''
    
    switch (messageType) {
      case 'greeting':
        prompt = `Você está iniciando uma conversa de WhatsApp sobre "${context.topic}".

Contexto do tópico: ${context.topicDescription}

Gere uma mensagem de saudação NATURAL e CASUAL em português brasileiro, como se você estivesse conversando com um amigo sobre ${context.topic.toLowerCase()}. A mensagem deve:
- Ser breve (máximo 60 palavras)
- Ser amigável e descontraída
- Mencionar ou relacionar-se ao tópico ${context.topic.toLowerCase()} de forma natural
- Usar linguagem informal de WhatsApp (pode usar "Oi", "E aí", "Fala", etc.)
- NÃO incluir emojis excessivos (máximo 2)
- NÃO mencionar que é uma conversa ou teste

Exemplo de tom: "Oi! Vi que você também curte ${context.topic.toLowerCase()}? Qual seu time favorito?"

Gere APENAS a mensagem, sem explicações ou comentários adicionais.`
        break

      case 'intermediate':
        prompt = `Você está conversando no WhatsApp sobre "${context.topic}".

Contexto do tópico: ${context.topicDescription}
${recentHistory ? `\nHistórico recente:\n${recentHistory}` : ''}

Gere uma mensagem INTERMEDIÁRIA NATURAL sobre ${context.topic.toLowerCase()} que continue a conversa de forma orgânica. A mensagem deve:
- Ser breve (máximo 80 palavras)
- Continuar o assunto sobre ${context.topic.toLowerCase()} de forma natural
- Fazer uma pergunta ou comentário relevante ao tópico
- Ser descontraída e amigável
- Usar linguagem informal de WhatsApp
- NÃO repetir informações já mencionadas
- NÃO incluir emojis excessivos (máximo 2)

Gere APENAS a mensagem, sem explicações ou comentários adicionais.`
        break

      case 'response':
        prompt = `Você está respondendo uma mensagem no WhatsApp sobre "${context.topic}".

Contexto do tópico: ${context.topicDescription}
${recentHistory ? `\nHistórico recente:\n${recentHistory}` : ''}

Gere uma RESPOSTA NATURAL que responda à última mensagem e continue o assunto sobre ${context.topic.toLowerCase()}. A mensagem deve:
- Ser breve (máximo 80 palavras)
- Responder de forma relevante ao contexto da conversa
- Continuar o assunto sobre ${context.topic.toLowerCase()}
- Ser descontraída e amigável
- Usar linguagem informal de WhatsApp
- NÃO repetir informações já mencionadas
- NÃO incluir emojis excessivos (máximo 2)

Gere APENAS a mensagem, sem explicações ou comentários adicionais.`
        break

      case 'closing':
        prompt = `Você está encerrando uma conversa no WhatsApp sobre "${context.topic}".

Contexto do tópico: ${context.topicDescription}
${recentHistory ? `\nHistórico recente:\n${recentHistory}` : ''}

Gere uma mensagem de ENCERRAMENTO NATURAL para uma conversa sobre ${context.topic.toLowerCase()}. A mensagem deve:
- Ser breve (máximo 50 palavras)
- Fazer uma observação final ou desejar algo relacionado ao tópico
- Ser amigável e descontraída
- Usar linguagem informal de WhatsApp
- NÃO parecer forçada ou robótica
- NÃO incluir emojis excessivos (máximo 2)

Exemplo: "Valeu pela conversa! Bora continuar falando sobre ${context.topic.toLowerCase()} depois!"

Gere APENAS a mensagem, sem explicações ou comentários adicionais.`
        break
    }

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text().trim()

      // Limpar a resposta removendo citações, explicações ou metadados
      text = text
        .split('\n')[0] // Pegar apenas a primeira linha (mensagem principal)
        .replace(/^["']|["']$/g, '') // Remover aspas no início/fim
        .replace(/^(mensagem|resposta|saudação):\s*/i, '') // Remover prefixos
        .trim()

      // Fallback se a mensagem estiver vazia ou muito curta
      if (!text || text.length < 5) {
        return this.getFallbackMessage(messageType, to)
      }

      return text
    } catch (error) {
      console.error('[ConversationAgent] Erro ao gerar mensagem contextual:', error)
      // Fallback para mensagem simples
      return this.getFallbackMessage(messageType, to)
    }
  }

  /**
   * Mensagens de fallback caso Gemini falhe
   */
  private static getFallbackMessage(messageType: ConversationMessageRequest['messageType'], to: string): string {
    const greetings = [
      `Oi! Tudo bem?`,
      `E aí, ${to}! Como você está?`,
      `Olá! Como vai?`,
      `Oi ${to}!`,
      `Fala, ${to}!`
    ]

    const intermediates = [
      `E você, o que acha?`,
      `Interessante, né?`,
      `Você já passou por isso?`,
      `Legal! E aí, o que você pensa sobre isso?`,
      `Verdade!`
    ]

    const responses = [
      `Concordo!`,
      `Sim, verdade!`,
      `Interessante essa visão!`,
      `Legal mesmo!`,
      `Entendi!`
    ]

    const closings = [
      `Valeu pela conversa!`,
      `Legal! Até depois!`,
      `Beleza! Falou!`,
      `Tchau! Até!`,
      `Valeu!`
    ]

    switch (messageType) {
      case 'greeting':
        return greetings[Math.floor(Math.random() * greetings.length)]
      case 'intermediate':
        return intermediates[Math.floor(Math.random() * intermediates.length)]
      case 'response':
        return responses[Math.floor(Math.random() * responses.length)]
      case 'closing':
        return closings[Math.floor(Math.random() * closings.length)]
      default:
        return 'Oi!'
    }
  }
}

