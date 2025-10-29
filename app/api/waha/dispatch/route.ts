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
      enableVariations 
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
    const allSessions = []
    for (const server of wahaServers) {
      try {
        const response = await fetch(`${server.api_url}/api/sessions`, {
          headers: {
            'Authorization': `Bearer ${server.api_key}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const sessions = await response.json()
          const workingSessions = sessions.filter((session: any) => 
            session.status === 'WORKING' || session.status === 'CONNECTED'
          )

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
    let sessionsToUse = []
    if (useLoadBalancing) {
      sessionsToUse = allSessions
    } else if (selectedSession) {
      const [serverId, sessionName] = selectedSession.split(':')
      const session = allSessions.find(s => s.serverId === serverId && s.sessionName === sessionName)
      if (session) {
        sessionsToUse = [session]
      } else {
        return NextResponse.json({ error: 'Sessão selecionada não encontrada' }, { status: 400 })
      }
    } else {
      sessionsToUse = [allSessions[0]] // Usar primeira sessão disponível
    }

    // Preparar mensagens para envio
    const messagesToSend = []
    for (let i = 0; i < telefones.length; i++) {
      const phone = telefones[i]
      let message = mensagem

      // Usar variação se disponível
      if (enableVariations && messageVariations && messageVariations[i]) {
        message = messageVariations[i]
      }

      messagesToSend.push({
        phone,
        message,
        variationIndex: enableVariations ? i : 0
      })
    }

    // Criar campanha temporária para tracking
    const campaign = await WahaDispatchService.createCampaign({
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
      total_contacts: telefones.length
    })

    // Adicionar contatos à campanha
    const contacts = telefones.map(phone => ({ phone_number: phone }))
    await WahaDispatchService.addContactsToCampaign(campaign.id, contacts)

    // Processar envios
    const results = {
      total: telefones.length,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Usar balanceamento de carga para distribuir mensagens
    for (let i = 0; i < messagesToSend.length; i++) {
      const { phone, message, variationIndex } = messagesToSend[i]
      
      // Selecionar sessão usando balanceamento
      const selectedSession = WahaLoadBalancer.selectSession(sessionsToUse, 'round_robin')
      
      if (!selectedSession) {
        results.failed++
        results.errors.push(`Nenhuma sessão disponível para ${phone}`)
        continue
      }

      try {
        // Enviar mensagem via WAHA
        const response = await fetch(`${selectedSession.apiUrl}/api/${selectedSession.sessionName}/sendText`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${selectedSession.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatId: `${phone}@c.us`,
            text: message
          })
        })

        const responseData = await response.json()

        if (response.ok && responseData.sent) {
          results.sent++
          
          // Registrar disparo no banco
          await WahaDispatchService.createDispatch({
            campaign_id: campaign.id,
            user_id: user.id,
            waha_server_id: selectedSession.serverId,
            session_name: selectedSession.sessionName,
            mensagem: message,
            variation_index: variationIndex,
            status: 'sent',
            sent_at: new Date().toISOString(),
            success: true,
            whatsapp_message_id: responseData.id
          })

          // Atualizar estatísticas da sessão
          await WahaDispatchService.updateSessionStats(
            selectedSession.serverId,
            selectedSession.sessionName,
            user.id,
            { total_sent: 1 }
          )
        } else {
          results.failed++
          results.errors.push(`Erro ao enviar para ${phone}: ${responseData.message || 'Erro desconhecido'}`)
          
          // Registrar falha no banco
          await WahaDispatchService.createDispatch({
            campaign_id: campaign.id,
            user_id: user.id,
            waha_server_id: selectedSession.serverId,
            session_name: selectedSession.sessionName,
            mensagem: message,
            variation_index: variationIndex,
            status: 'failed',
            success: false,
            error_message: responseData.message || 'Erro desconhecido'
          })
        }

        // Delay entre mensagens para evitar rate limiting
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
          waha_server_id: selectedSession.serverId,
          session_name: selectedSession.sessionName,
          mensagem: message,
          variation_index: variationIndex,
          status: 'failed',
          success: false,
          error_message: error instanceof Error ? error.message : 'Erro de conexão'
        })
      }
    }

    // Atualizar estatísticas da campanha
    await WahaDispatchService.updateCampaign(campaign.id, {
      sent_messages: results.sent,
      failed_messages: results.failed,
      status: results.failed === 0 ? 'completed' : 'completed'
    }, user.id)

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
