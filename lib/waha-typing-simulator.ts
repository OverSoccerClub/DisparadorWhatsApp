/**
 * Simulador de digitação humana para WAHA
 * Simula o indicador "digitando..." antes de enviar mensagens
 */

export interface TypingSimulatorOptions {
  apiUrl: string
  sessionName: string
  apiKey?: string
  chatId: string
  messageLength: number
}

/**
 * Calcula o tempo de digitação baseado no tamanho da mensagem
 * Simula velocidade humana de digitação (30-50 caracteres por minuto)
 */
function calculateTypingTime(messageLength: number): number {
  // Velocidade média: 40 caracteres por minuto = ~1.5 caracteres por segundo
  // Adicionar variação aleatória para parecer mais humano (0.8x a 1.2x)
  const baseTime = (messageLength / 1.5) * 1000 // em milissegundos
  const variation = 0.8 + Math.random() * 0.4 // 0.8 a 1.2
  const typedTime = baseTime * variation
  
  // Mínimo de 1 segundo, máximo de 10 segundos (para não ficar muito longo)
  return Math.max(1000, Math.min(typedTime, 10000))
}

/**
 * Tenta enviar o indicador de digitação via WAHA API
 * Retorna true se conseguiu, false caso contrário
 */
async function sendTypingIndicator(options: TypingSimulatorOptions): Promise<boolean> {
  const { apiUrl, sessionName, apiKey, chatId } = options
  const base = apiUrl.replace(/\/$/, '')
  const session = encodeURIComponent(sessionName)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['X-Api-Key'] = apiKey
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  
  // Tentar diferentes endpoints possíveis para typing indicator
  const endpoints = [
    `${base}/api/${session}/chat/presence`,
    `${base}/api/${session}/presence`,
    `${base}/api/${session}/typing`,
    `${base}/api/presence`,
    `${base}/api/typing`,
  ]
  
  const bodies = [
    { chatId, presence: 'composing' },
    { chatId, typing: true },
    { chatId, isTyping: true },
    { to: chatId, presence: 'composing' },
    { jid: chatId, presence: 'composing' },
  ]
  
  for (const url of endpoints) {
    for (const body of bodies) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        })
        
        // Se retornou 200/201/204, consideramos sucesso
        if (response.ok || response.status === 200 || response.status === 201 || response.status === 204) {
          console.log(`[TYPING] ✓ Indicador de digitação enviado via ${url}`)
          return true
        }
      } catch (error) {
        // Continuar tentando outros endpoints
        continue
      }
    }
  }
  
  return false
}

/**
 * Simula digitação humana antes de enviar mensagem
 * 1. Tenta enviar indicador de digitação via API (se disponível)
 * 2. Aguarda tempo proporcional ao tamanho da mensagem
 * 3. Retorna após simular o tempo de digitação
 */
export async function simulateHumanTyping(options: TypingSimulatorOptions): Promise<void> {
  const { messageLength } = options
  
  // Calcular tempo de digitação baseado no tamanho da mensagem
  const typingTime = calculateTypingTime(messageLength)
  
  console.log(`[TYPING] Simulando digitação de ${messageLength} caracteres (${Math.round(typingTime / 1000)}s)`)
  
  // Tentar enviar indicador de digitação via API (opcional, não bloqueia se falhar)
  try {
    await Promise.race([
      sendTypingIndicator(options),
      new Promise(resolve => setTimeout(resolve, 1000)) // Timeout de 1s para não bloquear
    ])
  } catch (error) {
    // Ignorar erros - a simulação de tempo continua mesmo se o indicador falhar
    console.log(`[TYPING] Indicador de digitação não disponível, usando apenas delay temporal`)
  }
  
  // Aguardar tempo calculado para simular digitação
  await new Promise(resolve => setTimeout(resolve, typingTime))
  
  console.log(`[TYPING] ✓ Simulação de digitação concluída`)
}

