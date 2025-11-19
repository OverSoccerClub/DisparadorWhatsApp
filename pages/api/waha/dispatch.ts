import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'

import { WahaDispatchService } from '@/lib/waha-dispatch-service'
import { WahaLoadBalancer } from '@/lib/waha-load-balancer'

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
      telefones, 
      clientesMap = {}, // Mapa telefone -> nome do cliente
      mensagem, 
      messageVariations, 
      user_id, 
      useLoadBalancing, 
      selectedSession, 
      enableVariations,
      humanizeConversation = true,
      sessionId,
      timeControl
    } = body

    if (!telefones || !Array.isArray(telefones) || telefones.length === 0) {
      return res.status(400).json({ error: 'Lista de telefones é obrigatória' })
    }

    if (!mensagem || mensagem.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Buscar servidores WAHA do usuário
    const { data: wahaServers, error: serversError } = await supabase
      .from('waha_servers')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)

    if (serversError) {
      console.error('Erro ao buscar servidores WAHA:', serversError)
      return res.status(500).json({ error: 'Erro ao buscar servidores WAHA' })
    }

    if (!wahaServers || wahaServers.length === 0) {
      return res.status(400).json({ error: 'Nenhum servidor WAHA configurado' })
    }

    // Buscar sessões ativas de todos os servidores
    const allSessions: any[] = []
    for (const server of wahaServers) {
      try {
        // Preparar headers de autenticação
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (server.api_key && server.api_key.trim() !== '') {
          // WAHA aceita tanto X-Api-Key quanto Authorization Bearer
          headers['X-Api-Key'] = server.api_key.trim()
          headers['Authorization'] = `Bearer ${server.api_key.trim()}`
        }
        const response = await fetch(`${server.api_url}/api/sessions`, { headers })

        if (response.ok) {
          const sessions = await response.json()
          const workingSessions = sessions.filter((session: any) => {
            const s = String(session.status || '').toUpperCase()
            return s === 'WORKING' || s === 'CONNECTED' || s === 'OPEN' || s === 'READY' || s === 'AUTHENTICATED'
          })

          workingSessions.forEach((session: any) => {
            allSessions.push({
              serverId: server.id,
              serverName: server.nome,
              sessionName: session.name,
              status: session.status,
              apiUrl: server.api_url,
              apiKey: server.api_key,
              phoneNumber: session.phoneNumber || session.phone || (session.me && session.me.id ? String(session.me.id).split(':')[0] : undefined)
            })
          })
        }
      } catch (error) {
        console.error(`Erro ao buscar sessões do servidor ${server.nome}:`, error)
      }
    }

    if (allSessions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma sessão WAHA conectada' })
    }

    // Determinar estratégia de distribuição
    let sessionsToUse: any[] = []
    if (useLoadBalancing) {
      sessionsToUse = allSessions
    } else if (selectedSession) {
      const [serverId, sessionName] = selectedSession.split(':')
      const session = allSessions.find(s => String(s.serverId) === String(serverId) && s.sessionName === sessionName)
      if (session) {
        sessionsToUse = [session]
      } else {
        return res.status(400).json({ error: 'Sessão selecionada não encontrada' })
      }
    } else {
      sessionsToUse = [allSessions[0]] // Usar primeira sessão disponível
    }

    // Preparar mensagens para envio
    // Funções auxiliares para preservação de links (definidas antes do uso)
    const extractLinksHelper = (text: string): string[] => {
      if (!text || typeof text !== 'string') return []
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
      const matches = text.match(urlRegex) || []
      return [...new Set(matches.map(link => link.trim()))]
    }
    const hasLinkHelper = (text: string, link: string): boolean => {
      if (!text || !link) return false
      const textLinks = extractLinksHelper(text)
      return textLinks.some(tl => tl.toLowerCase() === link.toLowerCase())
    }
    
    // Extrair links da mensagem original ANTES de processar (para garantir preservação)
    const originalMessageLinks = extractLinksHelper(mensagem)
    
    const messagesToSend: { phone: string, message: string, variationIndex: number }[] = []
    for (let i = 0; i < telefones.length; i++) {
      const phone = telefones[i]
      let messageText = mensagem

      // Usar variação se disponível
      if (enableVariations && messageVariations && messageVariations[i]) {
        messageText = messageVariations[i]
        
        // GARANTIR que os links originais estejam na variação (obrigatório)
        if (originalMessageLinks.length > 0) {
          const missingLinks = originalMessageLinks.filter(link => !hasLinkHelper(messageText, link))
          if (missingLinks.length > 0) {
            // Adicionar links faltantes na variação
            messageText = `${messageText} ${missingLinks.join(' ')}`.trim()
          }
        }
      }

      messagesToSend.push({
        phone,
        message: messageText, // Garantido ter os links se existirem na original
        variationIndex: enableVariations ? i : 0
      })
    }

    // Criar campanha temporária para tracking (usar supabase server-side autenticado)
    const { data: campaign, error: campaignError } = await supabase
      .from('waha_campaigns')
      .insert({
        user_id: user.id,
        nome: `Disparo Rápido - ${new Date().toLocaleString()}`,
        descricao: 'Disparo realizado via modal',
        mensagem,
        status: 'active',
        delay_min: 1,
        delay_max: 3,
        messages_per_minute: 20,
        enable_variations: enableVariations,
        variation_count: messageVariations?.length || 0,
        load_balancing_strategy: useLoadBalancing ? 'round_robin' : 'round_robin',
        total_contacts: telefones.length,
        sent_messages: 0,
        failed_messages: 0,
        pending_messages: telefones.length
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Erro ao criar campanha WAHA:', campaignError)
      return res.status(500).json({ error: 'Erro ao criar campanha WAHA' })
    }

    // Adicionar contatos à campanha (usar supabase autenticado)
    const contacts = telefones.map((phone: string) => ({ campaign_id: campaign.id, phone_number: phone }))
    const { error: contactsError } = await supabase
      .from('waha_campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      console.error('Erro ao criar contatos da campanha WAHA:', contactsError)
      return res.status(500).json({ error: 'Erro ao adicionar contatos à campanha WAHA' })
    }

    // Funções de progresso (opcional)
    const origin = new URL(request.url).origin
    const postProgress = async (action: string, data?: any) => {
      try {
        if (!sessionId) return
        await fetch(`${origin}/api/disparos/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, action, data })
        })
      } catch {}
    }

    await postProgress('start', { totalMessages: telefones.length })

    // Resultados
    const results = {
      total: telefones.length,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Utilitários de conversa humanizada
    // Delay randomizado entre 1 minuto (60s) e 3 minutos (180s)
    const randomDelay = (minMs: number, maxMs: number) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs))
    const getTimeGreeting = () => {
      const h = new Date().getHours()
      if (h < 12) return 'bom dia'
      if (h < 18) return 'boa tarde'
      return 'boa noite'
    }
    const randomBrazilianName = () => {
      const nomes = ['João','Maria','Pedro','Ana','Lucas','Mariana','Gabriel','Carla','Rafael','Beatriz','Felipe','Camila','Gustavo','Larissa','Bruno','Patrícia','André','Juliana','Thiago','Letícia','Renato','Fernanda','Diego','Amanda','Ricardo','Bruna','Marcelo','Paula','Vinicius','Cristina','Rafaela','Matheus','Luciana','Eduardo','Isabela']
      return nomes[Math.floor(Math.random()*nomes.length)]
    }

    // Função auxiliar para extrair todos os links (URLs) de uma mensagem
    const extractLinks = (text: string): string[] => {
      if (!text || typeof text !== 'string') return []
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
      const matches = text.match(urlRegex) || []
      // Remover duplicatas e normalizar (trim, lowercase para comparação)
      return [...new Set(matches.map(link => link.trim()))]
    }
    
    // Função auxiliar para verificar se uma mensagem contém um link específico
    const hasLink = (text: string, link: string): boolean => {
      if (!text || !link) return false
      const textLinks = extractLinks(text)
      return textLinks.some(tl => tl.toLowerCase() === link.toLowerCase())
    }

    // Função para analisar mensagem com IA e criar apresentação criativa
    // IMPORTANTE: Links da mensagem original são sempre preservados
    const analyzeAndCreateTransition = async (messageContent: string, originalLinks: string[] = []): Promise<string> => {
      try {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
        if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
          // Fallback se IA não estiver configurada - preservar links
          const fallback = createFallbackTransition(messageContent)
          return originalLinks.length > 0 ? `${fallback} ${originalLinks.join(' ')}` : fallback
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiKey)
        // Usar modelo 2.5 (sempre usar 2.5 conforme solicitado)
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        const model = genAI.getGenerativeModel({ model: modelName })

        // Criar mensagem sem links para a IA analisar (mas preservar os links)
        const messageWithoutLinks = messageContent.replace(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi, '[link]')

        const prompt = `Você é uma pessoa brasileira conversando de forma NATURAL e AMIGÁVEL via WhatsApp. 

Analise a mensagem abaixo e crie UMA ÚNICA mensagem curta (máximo 100 caracteres) que:
1. Apresente de forma CRIATIVA e INTERESSANTE o conteúdo/conceito principal da mensagem
2. Seja TOTALMENTE NATURAL, humana, fluida - IMPERCEPTÍVEL como bot
3. Use linguagem DESCONTRAÍDA, educada e simpática (1-2 emojis apenas se fizer sentido)
4. Crie CURIOSIDADE e interesse de forma SUTIL e natural
5. Faça uma transição SUAVE e natural para a mensagem principal que vem depois
6. Seja OBJETIVO mas interessante - não seja muito formal
7. IMPORTANTE: NÃO inclua links na sua resposta - eles serão adicionados automaticamente depois

Mensagem a analisar:
"${messageWithoutLinks}"

REGRAS ABSOLUTAS:
- Responda APENAS com a mensagem criativa (SEM explicações, SEM prefixos, SEM "Mensagem:")
- Use no máximo 100 caracteres
- Tom CONVERSACIONAL brasileiro (como se estivesse falando com um amigo)
- Seja criativo mas natural
- Analise o CONTEÚDO e CONTEXTO da mensagem para criar algo relevante
- NÃO inclua URLs ou links na resposta

Mensagem:`

        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        
        // Limpar a resposta (remover aspas, asteriscos, etc)
        const cleanText = text
          .replace(/^["']|["']$/g, '')
          .replace(/^\*\*|\*\*$/g, '')
          .replace(/^#+\s*/g, '')
          .trim()
        
        // Adicionar links preservados da mensagem original (OBRIGATÓRIO)
        // Verificar se a resposta da IA já contém os links (caso a IA tenha incluído)
        let finalText = cleanText
        if (originalLinks.length > 0) {
          const responseLinks = extractLinks(cleanText)
          const missingLinks = originalLinks.filter(link => !hasLink(cleanText, link))
          // Adicionar apenas os links que estão faltando
          if (missingLinks.length > 0) {
            finalText = `${cleanText} ${missingLinks.join(' ')}`.trim()
          } else {
            finalText = cleanText // Já tem todos os links
          }
        }
        
        if (finalText && finalText.length > 10 && finalText.length < 500) {
          return finalText
        }
        
        // Fallback com links preservados
        const fallback = createFallbackTransition(messageContent)
        return originalLinks.length > 0 ? `${fallback} ${originalLinks.join(' ')}` : fallback
      } catch (error) {
        console.error('Erro ao analisar mensagem com IA:', error)
        // Fallback com links preservados
        const fallback = createFallbackTransition(messageContent)
        return originalLinks.length > 0 ? `${fallback} ${originalLinks.join(' ')}` : fallback
      }
    }

    // Fallback caso IA não esteja disponível
    const createFallbackTransition = (messageContent: string): string => {
      const transitions = [
        'Deixa eu te mostrar algo interessante...',
        'Olha, tenho uma informação legal aqui...',
        'Vou te passar uma novidade que você vai gostar...',
        'Tenho algo interessante para compartilhar...',
        'Deixa eu te contar uma coisa...',
        'Olha só que legal, tenho uma novidade...',
        'Vou te mostrar algo que pode te interessar...'
      ]
      return transitions[Math.floor(Math.random() * transitions.length)]
    }
    
    // Extrair primeiro nome do destinatário ou usar nome genérico
    const getRecipientFirstName = (phone: string): string | null => {
      const nomeCompleto = clientesMap[phone] || ''
      if (nomeCompleto && nomeCompleto.trim()) {
        // Extrair primeiro nome (até o primeiro espaço)
        const primeiroNome = nomeCompleto.split(' ')[0].trim()
        if (primeiroNome) {
          return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
        }
      }
      return null // Não tem nome cadastrado
    }
    
    // Gerar mensagens humanizadas conforme especificado (versão melhorada)
    // IMPORTANTE: Links da mensagem original são sempre preservados
    const buildHumanizedMessages = async (phone: string, variationMessage: string, originalMessage: string) => {
      // Extrair links da mensagem original (obrigatório preservar em todas as variações e mensagens IA)
      const originalLinks = extractLinks(originalMessage)
      
      const destinatarioNome = getRecipientFirstName(phone)
      const emissorNome = randomBrazilianName()
      const saudacao = getTimeGreeting()
      const emojis = ['😊', '👋', '🙂', '😄', '✨', '😃', '👍', '💬']
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      
      // Mensagem 1: Saudação natural e variada
      const saudacoesComNome = [
        `Oi ${destinatarioNome}! ${saudacao}${emoji}`,
        `${destinatarioNome}, ${saudacao}! Tudo bem?${emoji}`,
        `Oi ${destinatarioNome}, ${saudacao}! Como você está?${emoji}`,
        `${destinatarioNome}, ${saudacao}! Espero que esteja tudo certo${emoji}`
      ]
      const saudacoesSemNome = [
        `Oi! ${saudacao}${emoji}`,
        `Oi, ${saudacao}! Tudo bem?${emoji}`,
        `${saudacao}! Como você está?${emoji}`,
        `Oi, ${saudacao}! Espero que esteja tudo certo${emoji}`
      ]
      const msg1 = destinatarioNome 
        ? saudacoesComNome[Math.floor(Math.random() * saudacoesComNome.length)]
        : saudacoesSemNome[Math.floor(Math.random() * saudacoesSemNome.length)]
      
      // Mensagem 2: Cumprimento variado e natural
      const msg2Options = [
        'Tudo bem?',
        'Como vai?',
        'Como você está?',
        'Tudo certo por aí?',
        'Como está?',
        'E aí, como tá?',
        'Tudo tranquilo?',
        'Tudo certo?',
        'Como tem passado?'
      ]
      const msg2 = msg2Options[Math.floor(Math.random() * msg2Options.length)]
      
      // Mensagem 3: Apresentação variada, natural e criativa
      const msg3Options = [
        `Ah, me chamo ${emissorNome}${emoji} Queria te mostrar algo interessante, tem um tempinho?`,
        `Oi! Sou ${emissorNome}, tenho uma novidade que pode te interessar. Tem um minuto?${emoji}`,
        `Meu nome é ${emissorNome}! Tenho algo legal para compartilhar, você está disponível?${emoji}`,
        `Eu sou ${emissorNome}${emoji} Queria te apresentar uma coisa interessante, tem um tempinho agora?`,
        `Oi! Me chamo ${emissorNome}, tenho uma informação bacana para você. Consegue me dar uma atenção?${emoji}`,
        `${emissorNome} aqui${emoji} Tenho uma novidade interessante, você tem um tempinho?`,
        `Oi, sou ${emissorNome}! Queria te mostrar algo que pode te interessar. Você está livre agora?${emoji}`
      ]
      const msg3 = msg3Options[Math.floor(Math.random() * msg3Options.length)]
      
      // Mensagem 4: Transição criativa gerada por IA analisando o conteúdo
      // IMPORTANTE: Links são preservados automaticamente pela função
      const msg4 = await analyzeAndCreateTransition(variationMessage, originalLinks)
      
      // Garantir que a variação final também contenha os links originais
      // OBRIGATÓRIO: Se houver links na mensagem original, eles DEVEM estar na variação final
      let finalVariationMessage = variationMessage
      if (originalLinks.length > 0) {
        // Verificar quais links estão faltando na variação (comparação case-insensitive)
        const missingLinks = originalLinks.filter(link => !hasLink(variationMessage, link))
        if (missingLinks.length > 0) {
          // Adicionar TODOS os links que estão faltando no final da mensagem
          finalVariationMessage = `${variationMessage} ${missingLinks.join(' ')}`.trim()
        }
      }
      
      // Verificar novamente após adicionar (garantir que realmente tem os links)
      if (originalLinks.length > 0) {
        const finalLinks = extractLinks(finalVariationMessage)
        const stillMissing = originalLinks.filter(link => !finalLinks.some(fl => fl.toLowerCase() === link.toLowerCase()))
        if (stillMissing.length > 0) {
          // Se ainda faltam links, adicionar novamente (fallback de segurança)
          finalVariationMessage = `${finalVariationMessage} ${stillMissing.join(' ')}`.trim()
        }
      }
      
      return {
        saudacao: msg1,
        cumprimento: msg2,
        apresentacao: msg3,
        transicao: msg4, // Mensagem criativa sobre o conteúdo (com links preservados)
        mensagem: finalVariationMessage // Variação da mensagem criada (com links preservados)
      }
    }

    // Delay entre destinatários baseado no timeControl (fallback para 4-8s)
    const configuredDelayMs = timeControl ? ((Number(timeControl.delayMinutes||0)*60 + Number(timeControl.delaySeconds||0)) * 1000) : 0
    const perRecipientDelayMs = Math.max(4000, configuredDelayMs || 0)

    // Controle de idempotência global (evitar envios duplicados em todo o disparo)
    const globalSentMessages = new Set<string>()
    
    // Usar balanceamento de carga para distribuir mensagens
    for (let i = 0; i < messagesToSend.length; i++) {
      const { phone, message, variationIndex } = messagesToSend[i]
      
      // Selecionar sessão usando balanceamento
      const selectedSess = WahaLoadBalancer.selectSession(sessionsToUse, 'round_robin')
      
      if (!selectedSess) {
        results.failed++
        results.errors.push(`Nenhuma sessão disponível para ${phone}`)
        continue
      }

      try {
        // Criar registro inicial em 'sending' para este destinatário
        const startTime = Date.now()
        const { data: createdDispatch } = await supabase
          .from('waha_dispatches')
          .insert({
            campaign_id: campaign.id,
            user_id: user.id,
            waha_server_id: selectedSess.serverId,
            session_name: selectedSess.sessionName,
            mensagem: message,
            variation_index: variationIndex,
            status: 'sending'
          })
          .select()
          .single()

        const currentDispatchId = createdDispatch?.id
        
        const sendText = async (text: string): Promise<{ ok: boolean; data?: any }> => {
          // Criar chave única para esta mensagem específica (usar hash da mensagem completa)
          const messageKey = `${phone}_${text}_${selectedSess.sessionName}_${i}`
          
          // Verificar se já tentamos enviar esta mensagem exata (proteção global)
          if (globalSentMessages.has(messageKey)) {
            return { ok: false, data: { error: 'Tentativa duplicada bloqueada' } }
          }
          
          const jid = `${phone.replace(/\D/g, '')}@c.us`
          const base = selectedSess.apiUrl.replace(/\/$/, '')
          const session = encodeURIComponent(selectedSess.sessionName)
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Api-Key': selectedSess.apiKey || ''
          }
          if (selectedSess.apiKey) headers['Authorization'] = `Bearer ${selectedSess.apiKey}`

          // Simular digitação humana antes de enviar
          try {
            const { simulateHumanTyping } = await import('@/lib/waha-typing-simulator')
            await simulateHumanTyping({
              apiUrl: base,
              sessionName: selectedSess.sessionName,
              apiKey: selectedSess.apiKey,
              chatId: jid,
              messageLength: text.length
            })
          } catch (error) {
            // Se falhar, continuar mesmo assim (não bloquear o envio)
            console.log(`[SENDTEXT] Aviso: Não foi possível simular digitação, continuando envio`)
          }

          // Usar APENAS o endpoint padrão (evitar múltiplas tentativas que causam duplicação)
          const primaryAttempt = {
            url: `${base}/api/sendText`,
            body: { session: selectedSess.sessionName, chatId: jid, text }
          }

          // Tentar APENAS UMA vez o endpoint padrão
          try {
            const resp = await fetch(primaryAttempt.url, {
              method: 'POST',
              headers,
              body: JSON.stringify(primaryAttempt.body)
            })

            // Verificar resposta - aceitar 200 (OK) e 201 (Created) como sucesso
            if (resp.ok && (resp.status === 200 || resp.status === 201)) {
              let responseData: any = null
              try {
                responseData = await resp.json()
              } catch {
                // Se não conseguir parsear JSON mas status é 200/201, considerar sucesso
                responseData = { sent: true }
              }

              // Verificar se realmente enviou - aceitar qualquer resposta com status 200/201
              // ou que tenha indicadores de sucesso na resposta
              const isSuccess = responseData?.sent === true ||
                                responseData?.success === true ||
                                responseData?.messageId ||
                                responseData?.id ||
                                responseData?._data?.id || // WAHA retorna _data.id
                                responseData?.body || // Se tem body, provavelmente enviou
                                (responseData === null && (resp.status === 200 || resp.status === 201)) ||
                                resp.status === 200 ||
                                resp.status === 201 // Status 201 (Created) também é sucesso

              if (isSuccess) {
                // SUCESSO! Marcar como enviado AGORA (após confirmação)
                globalSentMessages.add(messageKey)
                return { ok: true, data: responseData }
              }
            }
          } catch (e) {
            // Erro de rede
          }
          
          // Falhou - retornar erro (não tentar outros endpoints para evitar duplicação)
          return { ok: false, data: { error: 'Falha no envio' } }
        }

        let lastOk = false
        if (humanizeConversation) {
          // Gerar mensagens humanizadas conforme especificado (versão melhorada)
          // IMPORTANTE: Passar mensagem ORIGINAL (mensagem) para extrair links, não a variação (message)
          // A variação (message) pode não ter os links se foram removidos durante a geração
          const humanizedMsgs = await buildHumanizedMessages(phone, message, mensagem)
          
          // VERIFICAÇÃO FINAL OBRIGATÓRIA: Garantir que TODOS os links originais estejam na mensagem final
          const originalLinksCheck = extractLinks(mensagem)
          if (originalLinksCheck.length > 0) {
            const finalLinks = extractLinks(humanizedMsgs.mensagem)
            // Comparar se TODOS os links originais estão presentes (case-insensitive, normalizado)
            const normalizedOriginal = originalLinksCheck.map(l => l.toLowerCase().trim())
            const normalizedFinal = finalLinks.map(l => l.toLowerCase().trim())
            const missingLinks = originalLinksCheck.filter((origLink, idx) => {
              const normalized = origLink.toLowerCase().trim()
              return !normalizedFinal.some(final => final === normalized || final.startsWith(normalized) || normalized.startsWith(final))
            })
            
            if (missingLinks.length > 0) {
              // Adicionar TODOS os links faltantes no final da mensagem
              humanizedMsgs.mensagem = `${humanizedMsgs.mensagem} ${missingLinks.join(' ')}`.trim()
            }
          }
          
          // Mensagem 1: Saudação natural e variada
          const delay1 = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000
          const nextMessageAt1 = Date.now() + delay1
          
          // ENVIAR PRIMEIRO, depois atualizar progresso e log
          const step1 = await sendText(humanizedMsgs.saudacao)
          
          if (step1.ok) {
            // Log preciso imediatamente após envio bem-sucedido (com dados exatos)
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message: humanizedMsgs.saudacao, // Mensagem EXATA que foi enviada
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            // Atualizar progresso atual após confirmar envio
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.saudacao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: nextMessageAt1
            })
          } else {
            // Se falhou, ainda atualizar para mostrar erro
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.saudacao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          
          lastOk = step1.ok
          // Delay entre 60s (1 minuto) e 180s (3 minutos) - randomizado
          await randomDelay(60000, 180000)

          // Mensagem 2: Cumprimento variado
          const delay2 = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000
          const nextMessageAt2 = Date.now() + delay2
          
          // ENVIAR PRIMEIRO, depois log
          const step2 = await sendText(humanizedMsgs.cumprimento)
          if (step2.ok) {
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message: humanizedMsgs.cumprimento,
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.cumprimento, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: nextMessageAt2
            })
          } else {
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.cumprimento, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          lastOk = step2.ok && lastOk
          // Delay entre 60s (1 minuto) e 180s (3 minutos) - randomizado
          await randomDelay(60000, 180000)

          // Mensagem 3: Apresentação e pergunta contextual variada
          const delay3 = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000
          const nextMessageAt3 = Date.now() + delay3
          
          const step3 = await sendText(humanizedMsgs.apresentacao)
          if (step3.ok) {
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message: humanizedMsgs.apresentacao,
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.apresentacao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: nextMessageAt3
            })
          } else {
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.apresentacao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          lastOk = step3.ok && lastOk
          // Delay entre 60s (1 minuto) e 180s (3 minutos) - randomizado
          await randomDelay(60000, 180000)

          // Mensagem 4: Transição criativa gerada por IA (apresenta o conteúdo de forma interessante)
          const delay4 = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000
          const nextMessageAt4 = Date.now() + delay4
          
          const step4 = await sendText(humanizedMsgs.transicao)
          if (step4.ok) {
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message: humanizedMsgs.transicao,
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.transicao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: nextMessageAt4
            })
          } else {
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.transicao, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          lastOk = step4.ok && lastOk
          // Delay entre 60s (1 minuto) e 180s (3 minutos) - randomizado
          await randomDelay(60000, 180000)

          // Mensagem 5: Variação da mensagem criada (conteúdo principal)
          const step5 = await sendText(humanizedMsgs.mensagem)
          if (step5.ok) {
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message: humanizedMsgs.mensagem,
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.mensagem, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null // Última mensagem, não há próxima
            })
          } else {
            await postProgress('updateCurrent', { 
              message: humanizedMsgs.mensagem, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          lastOk = step5.ok && lastOk
        } else {
          // Modo não humanizado: enviar apenas a mensagem original
          const single = await sendText(message)
          if (single.ok) {
            const sentTimestamp = Date.now()
            await postProgress('logMessage', {
              phone,
              message, // Mensagem EXATA enviada
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}`,
              status: 'sent',
              timestamp: sentTimestamp
            })
            await postProgress('updateCurrent', { 
              message, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          } else {
            await postProgress('updateCurrent', { 
              message, 
              phone, 
              instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}`,
              nextMessageAt: null
            })
          }
          lastOk = single.ok
        }

        if (lastOk) {
          results.sent++
          await postProgress('markSent')
          
          // Atualizar registro para 'sent'
          if (currentDispatchId) {
            await supabase
              .from('waha_dispatches')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                success: true,
                response_time_ms: Date.now() - startTime
              })
              .eq('id', currentDispatchId)
              .eq('user_id', user.id)
          }

          // Atualizar estatísticas da sessão
          await supabase
            .from('waha_session_stats')
            .upsert({
              waha_server_id: selectedSess.serverId,
              session_name: selectedSess.sessionName,
              user_id: user.id,
              total_sent: 1,
              last_activity: new Date().toISOString()
            })
        } else {
          results.failed++
          results.errors.push(`Erro ao enviar para ${phone}: falha no envio humanizado`)
          await postProgress('markFailed')
          
          // Atualizar registro para 'failed'
          if (currentDispatchId) {
            await supabase
              .from('waha_dispatches')
              .update({
                status: 'failed',
                success: false,
                error_message: 'Falha no envio humanizado',
                response_time_ms: Date.now() - startTime
              })
              .eq('id', currentDispatchId)
              .eq('user_id', user.id)
          }
        }

        // Delay entre destinatários para evitar rate limiting
        if (i < messagesToSend.length - 1) {
          const jitter = Math.floor(Math.random()*1500)
          await new Promise(resolve => setTimeout(resolve, perRecipientDelayMs + jitter))
        }

      } catch (error) {
        results.failed++
        results.errors.push(`Erro de conexão para ${phone}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        await postProgress('markFailed')
        
        // Atualizar último registro 'sending' (se existente) para 'failed'
        await supabase
          .from('waha_dispatches')
          .update({
            status: 'failed',
            success: false,
            error_message: error instanceof Error ? error.message : 'Erro de conexão'
          })
          .eq('campaign_id', campaign.id)
          .eq('user_id', user.id)
          .eq('session_name', selectedSess.sessionName)
          .eq('mensagem', message)
          .eq('variation_index', variationIndex)
          .eq('status', 'sending')
          .order('created_at', { ascending: false })
      }
    }

    // Atualizar estatísticas da campanha
    await supabase
      .from('waha_campaigns')
      .update({
        sent_messages: results.sent,
        failed_messages: results.failed,
        pending_messages: Math.max(0, (telefones.length - results.sent - results.failed)),
        status: 'completed'
      })
      .eq('id', campaign.id)
      .eq('user_id', user.id)

    await postProgress('finish')

    return res.status(200).json({
      success: true,
      results,
      campaign: {
        id: campaign.id,
        nome: campaign.nome
      },
      stats: {
        totalSessions: allSessions.length,
        usedSessions: sessionsToUse.length,
        loadBalancing: useLoadBalancing
      }
    })

  } catch (error) {
    console.error('Erro ao processar disparo WAHA:', error)
    return res.status(200).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
}