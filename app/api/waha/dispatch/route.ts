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
      humanizeConversation = true
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
              apiKey: server.api_key
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
        const sendText = async (text: string) => {
          const resp = await fetch(`${selectedSess.apiUrl}/api/${encodeURIComponent(selectedSess.sessionName)}/sendText`, {
            method: 'POST',
            headers: {
              'X-Api-Key': selectedSess.apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatId: `${phone}@c.us`, text })
          })
          let data: any = null
          try { data = await resp.json() } catch {}
          return { ok: resp.ok && (data?.sent === true || data?.success === true), data }
        }

        let lastOk = false
        if (humanizeConversation) {
          const nome = randomBrazilianName()
          const saudacao = `${getTimeGreeting()} ${nome}!`
          const cumprimento = 'Como vai?'
          const optout = 'Se não deseja mais receber este tipo de mensagem, escreva: NÃO'

          const step1 = await sendText(saudacao)
          lastOk = step1.ok
          await randomDelay(1200, 3500)

          const step2 = await sendText(cumprimento)
          lastOk = step2.ok && lastOk
          await randomDelay(1500, 4000)

          const step3 = await sendText(message)
          lastOk = step3.ok && lastOk
          await randomDelay(1500, 4000)

          const step4 = await sendText(optout)
          lastOk = step4.ok && lastOk
        } else {
          const single = await sendText(message)
          lastOk = single.ok
        }

        if (lastOk) {
          results.sent++
          
          // Registrar disparo no banco
          await supabase
            .from('waha_dispatches')
            .insert({
              campaign_id: campaign.id,
              user_id: user.id,
              waha_server_id: selectedSess.serverId,
              session_name: selectedSess.sessionName,
              mensagem: message,
              variation_index: variationIndex,
              status: 'sent',
              sent_at: new Date().toISOString(),
              success: true,
            })

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
          
          // Registrar falha no banco
          await WahaDispatchService.createDispatch({
            campaign_id: campaign.id,
            user_id: user.id,
            waha_server_id: selectedSess.serverId,
            session_name: selectedSess.sessionName,
            mensagem: message,
            variation_index: variationIndex,
            status: 'failed',
            success: false,
            error_message: 'Falha no envio humanizado'
          })
        }

        // Delay entre destinatários para evitar rate limiting
        if (i < messagesToSend.length - 1) {
          const delay = WahaLoadBalancer.calculateDelay(1, 3) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        results.failed++
        results.errors.push(`Erro de conexão para ${phone}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        
        // Registrar erro no banco
        await WahaDispatchService.createDispatch({
          campaign_id: campaign.id,
          user_id: user.id,
          waha_server_id: selectedSess.serverId,
          session_name: selectedSess.sessionName,
          mensagem: message,
          variation_index: variationIndex,
          status: 'failed',
          success: false,
          error_message: error instanceof Error ? error.message : 'Erro de conexão'
        })
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
