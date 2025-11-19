import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
          },
          remove(name: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const { body } = req
    const { 
      chatIds, 
      mensagem, 
      messageVariations, 
      user_id, 
      useLoadBalancing, 
      selectedBot, 
      enableVariations,
      humanizeConversation = true,
      sessionId,
      timeControl
    } = body

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'Lista de Chat IDs é obrigatória' })
    }

    if (!mensagem || mensagem.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Buscar bots do Telegram do usuário
    const { data: telegramBots, error: botsError } = await supabase
      .from('telegram_bots')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (botsError) {
      console.error('Erro ao buscar bots do Telegram:', botsError)
      return res.status(500).json({ error: 'Erro ao buscar bots do Telegram' })
    }

    if (!telegramBots || telegramBots.length === 0) {
      return res.status(400).json({ error: 'Nenhum bot do Telegram ativo configurado' })
    }

    // Determinar estratégia de distribuição
    let botsToUse: any[] = []
    if (useLoadBalancing) {
      botsToUse = telegramBots
    } else if (selectedBot) {
      const bot = telegramBots.find(b => b.id === selectedBot)
      if (bot) {
        botsToUse = [bot]
      } else {
        return res.status(400).json({ error: 'Bot selecionado não encontrado' })
      }
    } else {
      botsToUse = [telegramBots[0]] // Usar primeiro bot disponível
    }

    // Preparar mensagens para envio
    const messagesToSend: { chatId: string, message: string, variationIndex: number }[] = []
    for (let i = 0; i < chatIds.length; i++) {
      let chatId = String(chatIds[i])
      
      // Se o chatId contém apenas dígitos, usar diretamente
      // Se não, pode ser um telefone que precisa ser convertido
      if (!/^-?\d+$/.test(chatId)) {
        // Tentar extrair números (pode ser telefone formatado)
        chatId = chatId.replace(/\D/g, '')
      }
      
      // Validar que é um número válido (Telegram aceita números negativos para grupos)
      if (!chatId || chatId.length === 0) {
        console.warn(`Chat ID inválido ignorado na posição ${i}: ${chatIds[i]}`)
        continue
      }

      let messageText = mensagem

      // Usar variação se disponível
      if (enableVariations && messageVariations && Array.isArray(messageVariations) && messageVariations[i]) {
        messageText = messageVariations[i]
      }

      messagesToSend.push({
        chatId: chatId,
        message: messageText,
        variationIndex: enableVariations ? i : 0
      })
    }

    if (messagesToSend.length === 0) {
      return res.status(400).json({ error: 'Nenhum Chat ID válido encontrado' })
    }

    const origin = new URL(request.url).origin
    const totalMessages = messagesToSend.length
    let sentMessages = 0
    let failedMessages = 0

    // Função para enviar mensagem via Telegram Bot API
    const sendTelegramMessage = async (botToken: string, chatId: string, text: string): Promise<boolean> => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML' // Permitir HTML básico na mensagem
          })
        })

        const data = await response.json()

        if (response.ok && data.ok) {
          return true
        } else {
          console.error(`Erro ao enviar mensagem Telegram para ${chatId}:`, data)
          return false
        }
      } catch (error) {
        console.error(`Erro ao enviar mensagem Telegram para ${chatId}:`, error)
        return false
      }
    }

    // Função para atualizar progresso
    const updateProgress = async (update: any) => {
      if (!sessionId) return
      try {
        await fetch(`${origin}/api/disparos/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ...update })
        })
      } catch (error) {
        console.error('Erro ao atualizar progresso:', error)
      }
    }

    // Inicializar progresso
    await updateProgress({
      totalMessages,
      sentMessages: 0,
      failedMessages: 0,
      progress: 0,
      status: 'sending'
    })

    // Processar envio com humanização se habilitada
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
    const baseDelay = timeControl ? 
      (timeControl.delayMinutes * 60 * 1000) + (timeControl.delaySeconds * 1000) :
      60000 // 1 minuto padrão

    // Função para gerar saudação variada
    const buildGreeting = () => {
      const greetings = [
        'Olá',
        'Oi',
        'Olá, tudo bem?',
        'Oi, como vai?',
        'Bom dia',
        'Boa tarde',
        'Boa noite'
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // Função para gerar mensagem intermediária
    const buildIntermediate = () => {
      const messages = [
        'Como você está?',
        'Tudo bem?',
        'Espero que esteja tudo certo',
        'Espero que esteja bem'
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }

    // Loop de envio
    for (let i = 0; i < messagesToSend.length; i++) {
      const { chatId, message: originalMessage } = messagesToSend[i]
      
      // Selecionar bot (round-robin se load balancing)
      const botIndex = useLoadBalancing ? (i % botsToUse.length) : 0
      const selectedBot = botsToUse[botIndex]
      const botToken = selectedBot.bot_token

      // Atualizar progresso
      await updateProgress({
        currentPhone: chatId,
        currentInstance: selectedBot.nome,
        currentMessage: 'Enviando mensagem...',
        progress: Math.round(((i + 1) / totalMessages) * 100)
      })

      if (humanizeConversation) {
        // Enviar saudação
        const greeting = buildGreeting()
        const greetingSent = await sendTelegramMessage(botToken, chatId, greeting)
        await delay(2000 + Math.random() * 5000) // 2-7s entre etapas

        // Enviar mensagem intermediária
        const intermediate = buildIntermediate()
        const intermediateSent = await sendTelegramMessage(botToken, chatId, intermediate)
        await delay(2000 + Math.random() * 5000) // 2-7s entre etapas

        // Enviar mensagem principal
        const mainSent = await sendTelegramMessage(botToken, chatId, originalMessage)
        
        if (mainSent && greetingSent && intermediateSent) {
          sentMessages++
        } else {
          failedMessages++
        }

        // Delay entre destinatários (usando timeControl se disponível)
        if (i < messagesToSend.length - 1) {
          const delayTime = baseDelay + Math.floor(Math.random() * 5000) // Jitter adicional
          await delay(delayTime)
        }
      } else {
        // Envio simples sem humanização
        const success = await sendTelegramMessage(botToken, chatId, originalMessage)
        
        if (success) {
          sentMessages++
        } else {
          failedMessages++
        }

        // Delay entre destinatários
        if (i < messagesToSend.length - 1) {
          await delay(baseDelay + Math.floor(Math.random() * 5000))
        }
      }

      // Atualizar progresso
      await updateProgress({
        sentMessages,
        failedMessages,
        progress: Math.round(((i + 1) / totalMessages) * 100)
      })
    }

    // Salvar registros de disparo no banco (similar a waha_dispatches)
    try {
      const dispatchRecord = {
        user_id: user.id,
        bot_id: selectedBot.id,
        bot_nome: selectedBot.nome,
        total_messages: totalMessages,
        sent_messages: sentMessages,
        failed_messages: failedMessages,
        status: failedMessages === 0 ? 'sent' : (sentMessages > 0 ? 'partial' : 'failed'),
        created_at: new Date().toISOString()
      }

      // Criar tabela telegram_dispatches se não existir (executar manualmente no Supabase)
      // Por enquanto, vamos apenas logar
      console.log('📊 Disparo Telegram concluído:', dispatchRecord)
    } catch (error) {
      console.error('Erro ao salvar registro de disparo:', error)
    }

    // Finalizar progresso
    await updateProgress({
      status: sentMessages === totalMessages ? 'completed' : 'partial',
      progress: 100
    })

    return res.status(200).json({ 
      success: true, 
      totalMessages, 
      sentMessages, 
      failedMessages,
      message: `${sentMessages} mensagem(ns) enviada(s) com sucesso`
    })

  } catch (error) {
    console.error('Erro ao processar disparo Telegram:', error)
    return res.status(500).json({ error: 'Erro interno ao processar disparo' })
  }
}
}