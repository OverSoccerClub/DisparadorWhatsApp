import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { WahaDispatchService } from '@/lib/waha-dispatch-service'
import { WahaLoadBalancer } from '@/lib/waha-load-balancer'

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
      telefones, 
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
      return NextResponse.json({ error: 'Lista de telefones é obrigatória' }, { status: 400 })
    }

    if (!mensagem || mensagem.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Buscar servidores WAHA do usuário
    const { data: wahaServers, error: serversError } = await supabase
      .from('waha_servers')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)

    if (serversError) {
      console.error('Erro ao buscar servidores WAHA:', serversError)
      return NextResponse.json({ error: 'Erro ao buscar servidores WAHA' }, { status: 500 })
    }

    if (!wahaServers || wahaServers.length === 0) {
      return NextResponse.json({ error: 'Nenhum servidor WAHA configurado' }, { status: 400 })
    }

    // Buscar sessões ativas de todos os servidores
    const allSessions: any[] = []
    for (const server of wahaServers) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (server.api_key) {
          // Preferido pelo restante do sistema
          headers['X-Api-Key'] = server.api_key
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
      return NextResponse.json({ error: 'Nenhuma sessão WAHA conectada' }, { status: 400 })
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
        return NextResponse.json({ error: 'Sessão selecionada não encontrada' }, { status: 400 })
      }
    } else {
      sessionsToUse = [allSessions[0]] // Usar primeira sessão disponível
    }

    // Preparar mensagens para envio
    const messagesToSend: { phone: string, message: string, variationIndex: number }[] = []
    for (let i = 0; i < telefones.length; i++) {
      const phone = telefones[i]
      let messageText = mensagem

      // Usar variação se disponível
      if (enableVariations && messageVariations && messageVariations[i]) {
        messageText = messageVariations[i]
      }

      messagesToSend.push({
        phone,
        message: messageText,
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
      return NextResponse.json({ error: 'Erro ao criar campanha WAHA' }, { status: 500 })
    }

    // Adicionar contatos à campanha (usar supabase autenticado)
    const contacts = telefones.map((phone: string) => ({ campaign_id: campaign.id, phone_number: phone }))
    const { error: contactsError } = await supabase
      .from('waha_campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      console.error('Erro ao criar contatos da campanha WAHA:', contactsError)
      return NextResponse.json({ error: 'Erro ao adicionar contatos à campanha WAHA' }, { status: 500 })
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
    const randomDelay = (minMs: number, maxMs: number) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs))
    const getTimeGreeting = () => {
      const h = new Date().getHours()
      if (h < 12) return 'Bom dia'
      if (h < 18) return 'Boa tarde'
      return 'Boa noite'
    }
    const randomBrazilianName = () => {
      const nomes = ['João','Maria','Pedro','Ana','Lucas','Mariana','Gabriel','Carla','Rafael','Beatriz','Felipe','Camila','Gustavo','Larissa','Bruno','Patrícia','André','Juliana','Thiago','Letícia']
      return nomes[Math.floor(Math.random()*nomes.length)]
    }
    const buildGreeting = () => {
      const nome = randomBrazilianName()
      const period = getTimeGreeting()
      const patterns = [
        `${period}, ${nome}!`,
        `${period} ${nome}!`,
        `Olá, ${nome}! ${period.toLowerCase()}!`,
        `Oi ${nome}, ${period.toLowerCase()}!`,
        `${period}! Tudo bem, ${nome}?`,
        `E aí, ${nome}? ${period.toLowerCase()}!`
      ]
      return patterns[Math.floor(Math.random()*patterns.length)]
    }

    // Delay entre destinatários baseado no timeControl (fallback para 4-8s)
    const configuredDelayMs = timeControl ? ((Number(timeControl.delayMinutes||0)*60 + Number(timeControl.delaySeconds||0)) * 1000) : 0
    const perRecipientDelayMs = Math.max(4000, configuredDelayMs || 0)

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

        const sendText = async (text: string) => {
          const jid = `${phone.replace(/\D/g, '')}@c.us`
          const base = selectedSess.apiUrl.replace(/\/$/, '')
          const session = encodeURIComponent(selectedSess.sessionName)
          const endpoints = [
            // Padrão da doc: corpo inclui session
            `${base}/api/sendText`,
            `${base}/api/${session}/sendText`,
            `${base}/api/${session}/chat/sendText`,
            `${base}/api/${session}/messages/sendText`
          ]
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Api-Key': selectedSess.apiKey || ''
          }
          if (selectedSess.apiKey) headers['Authorization'] = `Bearer ${selectedSess.apiKey}`

          const bodies = [
            // Doc oficial: { session, chatId, text }
            { session: selectedSess.sessionName, chatId: jid, text },
            { chatId: jid, text },
            { chatId: jid, message: text },
            { jid, text }
          ]

          let lastResp: Response | null = null
          let lastData: any = null
          for (const url of endpoints) {
            for (const body of bodies) {
              try {
                const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
                lastResp = resp
                try { lastData = await resp.json() } catch { lastData = null }
                if (resp.ok && (lastData?.sent === true || lastData?.success === true)) {
                  return { ok: true, data: lastData }
                }
              } catch (e) {
                lastData = { error: e instanceof Error ? e.message : 'network_error' }
              }
            }
          }
          // Log detalhado para diagnóstico
          console.error('WAHA sendText falhou', {
            apiUrl: base,
            session: selectedSess.sessionName,
            phone: jid,
            lastStatus: lastResp ? lastResp.status : 'no_response',
            lastData
          })
          return { ok: false, data: lastData }
        }

        let lastOk = false
        if (humanizeConversation) {
          const saudacao = buildGreeting()
          const cumprimento = 'Como vai?'
          const optout = 'Se não deseja mais receber este tipo de mensagem, escreva: NÃO'

          await postProgress('updateCurrent', { message: saudacao, phone, instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}` })
          const step1 = await sendText(saudacao)
          lastOk = step1.ok
          await randomDelay(2500, 6000)

          await postProgress('updateCurrent', { message: cumprimento, phone, instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}` })
          const step2 = await sendText(cumprimento)
          lastOk = step2.ok && lastOk
          await randomDelay(3000, 7000)

          await postProgress('updateCurrent', { message, phone, instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}` })
          const step3 = await sendText(message)
          lastOk = step3.ok && lastOk
          await randomDelay(3000, 7000)

          await postProgress('updateCurrent', { message: optout, phone, instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}` })
          const step4 = await sendText(optout)
          lastOk = step4.ok && lastOk
        } else {
          await postProgress('updateCurrent', { message, phone, instance: `${selectedSess.serverName} • ${selectedSess.sessionName}${selectedSess.phoneNumber ? ' • ' + selectedSess.phoneNumber : ''}` })
          const single = await sendText(message)
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

    return NextResponse.json({
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
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
