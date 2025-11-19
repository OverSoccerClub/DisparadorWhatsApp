import type { NextApiRequest, NextApiResponse } from 'next'
import { ConversationAgentService, ConversationContext } from '@/lib/conversation-agent-service'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

type Session = {
  type: 'waha' | 'evolution' // Tipo de sessão/instância
  serverId?: string // Para WAHA
  serverName: string
  sessionName: string // Nome da sessão (WAHA) ou instância (Evolution)
  status: string
  apiUrl: string
  apiKey: string
  phoneNumber?: string
  name?: string
  userId?: string // Para Evolution API
}

// Store para flags de parada (compartilhado com stop route)
declare global {
  var __maturationStopFlags: Map<string, boolean> | undefined
}
const stopFlags: Map<string, boolean> = global.__maturationStopFlags || new Map()
global.__maturationStopFlags = stopFlags

// Função helper para verificar se deve parar
function shouldStop(maturationId: string): boolean {
  return stopFlags.get(maturationId) === true
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { body } = req
    const { 
      sessions, 
      cadenceSeconds = 30, 
      messageTemplates, 
      numberOfRounds = 1,
      minutesPerRound = 10,
      pauseMinutesBetweenRounds = 5, // Tempo de pausa entre rodadas (padrão: 5 minutos)
      totalMinutes: legacyTotalMinutes, // Manter compatibilidade com versões antigas
      maturationId 
    } = body
    
    // Calcular totalMinutes: rodadas + pausas entre rodadas
    // Se numberOfRounds e minutesPerRound foram fornecidos, usar esses. Senão, usar totalMinutes (legado)
    const totalPauseMinutes = numberOfRounds > 1 ? (numberOfRounds - 1) * (pauseMinutesBetweenRounds || 0) : 0
    const totalMinutes = (numberOfRounds && minutesPerRound) 
      ? (numberOfRounds * minutesPerRound) + totalPauseMinutes
      : (legacyTotalMinutes || 10)
    
    console.log('[MATURACAO] Iniciando maturação:', {
      maturationId,
      sessionsCount: sessions?.length,
      numberOfRounds,
      minutesPerRound,
      pauseMinutesBetweenRounds,
      totalPauseMinutes,
      totalMinutes,
      sessions: sessions,
      cadenceSeconds
    })
    
    if (!Array.isArray(sessions) || sessions.length < 2) {
      console.error('[MATURACAO] Erro: Menos de 2 sessões selecionadas')
      return res.status(400).json({ error: 'Selecione ao menos duas sessões' })
    }

    const origin = new URL(request.url).origin
    console.log('[MATURACAO] Origin:', origin)

    // Processo em background: não bloquear resposta
    ;(async () => {
      try {
        console.log('[MATURACAO] Buscando servidores WAHA e sessões...')
        
        // Buscar servidores WAHA primeiro (para ter apiUrl e apiKey)
        const { createServerClient } = await import('@supabase/ssr')
        const { cookies: getCookies } = await import('next/headers')
        const { getUserWithRetry } = await import('@/lib/utils/rate-limit-handler')
        const cookieStore = getCookies()
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return req.cookies.get(name)?.value
              },
            },
          }
        )
        
        // Usar retry automático para rate limit
        let authResult
        try {
          authResult = await getUserWithRetry(supabase, {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
          })
        } catch (error: any) {
          console.error('[MATURACAO] Erro de autenticação (possível rate limit):', error)
          if (maturationId) {
            await fetch(`${origin}/api/maturacao/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                id: maturationId, 
                update: { 
                  status: 'error', 
                  log: { 
                    type: 'error', 
                    message: error?.status === 429 
                      ? 'Muitas requisições. Aguarde alguns instantes.' 
                      : 'Erro de autenticação'
                  } 
                } 
              })
            })
          }
          return
        }
        
        const user = authResult.data?.user
        if (!user) {
          console.error('[MATURACAO] Usuário não autenticado')
          if (maturationId) {
            await fetch(`${origin}/api/maturacao/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                id: maturationId, 
                update: { 
                  status: 'error', 
                  log: { type: 'error', message: 'Usuário não autenticado' } 
                } 
              })
            })
          }
          return
        }
        
        // Buscar servidores WAHA
        const { data: wahaServers } = await supabase
          .from('waha_servers')
          .select('id, nome, api_url, api_key')
          .eq('user_id', user.id)
          .eq('ativo', true)
        
        console.log('[MATURACAO] Servidores WAHA encontrados:', wahaServers?.length || 0, wahaServers?.map((s: any) => ({ id: s.id, nome: s.nome })))
        
        // Buscar instâncias Evolution API
        const evolutionResult = await EvolutionConfigService.getUserInstances(user.id)
        const evolutionInstances = evolutionResult.success && evolutionResult.data ? evolutionResult.data : []
        console.log('[MATURACAO] Instâncias Evolution encontradas:', evolutionInstances?.length || 0)
        
        // Buscar configuração Evolution para obter api_url e api_key
        const evolutionConfig = await EvolutionConfigService.getConfig(user.id)
        const evolutionApiUrl = evolutionConfig.success && evolutionConfig.data ? evolutionConfig.data.api_url : null
        const evolutionApiKey = evolutionConfig.success && evolutionConfig.data ? evolutionConfig.data.global_api_key : null
        
        if ((!wahaServers || wahaServers.length === 0) && (!evolutionInstances || evolutionInstances.length === 0)) {
          console.error('[MATURACAO] Nenhum servidor WAHA ou instância Evolution encontrada')
          if (maturationId) {
            await fetch(`${origin}/api/maturacao/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                id: maturationId, 
                update: { 
                  status: 'error', 
                  log: { type: 'error', message: 'Nenhum servidor WAHA ou instância Evolution configurada', direction: 'SYSTEM' } 
                } 
              })
            })
          }
          return
        }
        
        // Buscar sessões WAHA e instâncias Evolution
        console.log('[MATURACAO] Buscando sessões WAHA e instâncias Evolution...')
        const fetchWithTimeout = async (url: string, options: any, timeoutMs = 8000) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), timeoutMs)
          try {
            const res = await fetch(url, { ...options, signal: controller.signal })
            return res
          } finally {
            clearTimeout(timeout)
          }
        }
        
        // Buscar sessões WAHA
        const wahaSessionResults = await Promise.allSettled(
          (wahaServers || []).map(async (server: any) => {
            console.log(`[MATURACAO] Buscando sessões WAHA no servidor: ${server.nome} (${server.api_url})`)
            try {
              const res = await fetchWithTimeout(`${server.api_url}/api/sessions`, {
                method: 'GET',
                headers: server.api_key ? { 'X-Api-Key': server.api_key, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
              })
              if (!res.ok) {
                console.log(`[MATURACAO] ❌ Erro no servidor WAHA ${server.nome}: ${res.status}`)
                return []
              }
              const list = await res.json()
              if (!Array.isArray(list)) {
                console.log(`[MATURACAO] ⚠️ Resposta inválida do servidor WAHA ${server.nome}`)
                return []
              }
              console.log(`[MATURACAO] ✅ Servidor WAHA ${server.nome}: ${list.length} sessões encontradas`)
              
              // Mapear sessões WAHA com informações do servidor
              return list.map((s: any) => ({
                type: 'waha' as const,
                name: s.name,
                sessionName: s.name,
                status: s.status,
                config: s.config,
                me: s.me,
                serverId: server.id,
                serverName: server.nome,
                apiUrl: server.api_url,
                apiKey: server.api_key,
                phoneNumber: s.me?.id ? s.me.id.replace('@c.us', '') : null,
              }))
            } catch (error) {
              console.error(`[MATURACAO] Erro ao buscar sessões WAHA do servidor ${server.nome}:`, error)
              return []
            }
          })
        )
        
        // Buscar instâncias Evolution API (apenas conectadas)
        const evolutionSessionResults: any[] = []
        if (evolutionInstances && evolutionInstances.length > 0 && evolutionApiUrl && evolutionApiKey) {
          console.log('[MATURACAO] Verificando status das instâncias Evolution...')
          for (const instance of evolutionInstances) {
            try {
              // Verificar se a instância está conectada
              const statusRes = await fetchWithTimeout(`${evolutionApiUrl}/instance/connectionState/${instance.instance_name}`, {
                method: 'GET',
                headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
              })
              
              if (statusRes.ok) {
                const statusData = await statusRes.json()
                const connected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
                const status = statusData.instance?.state || statusData.instance?.connectionStatus || 'disconnected'
                
                if (connected) {
                  // Buscar informações do perfil
                  let phoneNumber: string | undefined = undefined
                  try {
                    const profileRes = await fetchWithTimeout(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instance.instance_name}`, {
                      method: 'GET',
                      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
                    })
                    
                    if (profileRes.ok) {
                      const profileData = await profileRes.json()
                      const instances = profileData.data || profileData
                      if (Array.isArray(instances)) {
                        const instData = instances.find((inst: any) => inst.name === instance.instance_name) || instances[0]
                        if (instData?.ownerJid) {
                          phoneNumber = instData.ownerJid.split('@')[0]
                        }
                      }
                    }
                  } catch (e) {
                    console.log(`[MATURACAO] Erro ao buscar perfil da instância ${instance.instance_name}:`, e)
                  }
                  
                  evolutionSessionResults.push({
                    type: 'evolution' as const,
                    name: instance.instance_name,
                    sessionName: instance.instance_name,
                    status: status,
                    serverId: undefined,
                    serverName: 'Evolution API',
                    apiUrl: evolutionApiUrl,
                    apiKey: evolutionApiKey,
                    phoneNumber: phoneNumber,
                    userId: user.id,
                  })
                  console.log(`[MATURACAO] ✅ Instância Evolution ${instance.instance_name} adicionada (conectada)`)
                } else {
                  console.log(`[MATURACAO] ⚠️ Instância Evolution ${instance.instance_name} não está conectada (status: ${status})`)
                }
              }
            } catch (error) {
              console.error(`[MATURACAO] Erro ao verificar instância Evolution ${instance.instance_name}:`, error)
            }
          }
        }
        
        const allWaha: any[] = wahaSessionResults.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        const allEvolution: any[] = evolutionSessionResults
        const all: any[] = [...allWaha, ...allEvolution]
        console.log('[MATURACAO] Total encontrado:', { waha: allWaha.length, evolution: allEvolution.length, total: all.length })

        // Montar mapa por key: "waha:serverId:name" ou "evolution:name"
        const keyOf = (s: any) => {
          if (s.type === 'evolution') {
            return `evolution:${s.name || s.sessionName || 'unknown'}`
          }
          return `waha:${s.serverId}:${s.name || s.sessionName || 'unknown'}`
        }
        console.log('[MATURACAO] Sessões/instâncias solicitadas pelo usuário:', sessions)
        console.log('[MATURACAO] Todas as sessões/instâncias disponíveis:', all.map(s => ({
          key: keyOf(s),
          type: s.type,
          name: s.name,
          sessionName: s.sessionName,
          status: s.status,
          serverName: s.serverName,
          serverId: s.serverId
        })))
        
        const selected: Session[] = all
          .filter(s => {
            const key = keyOf(s)
            const included = sessions.includes(key)
            if (included) {
              console.log('[MATURACAO] ✓ Sessão/instância selecionada:', {
                key,
                type: s.type,
                name: s.name || s.sessionName,
                status: s.status,
                serverName: s.serverName
              })
            } else {
              console.log('[MATURACAO] ✗ Sessão/instância não está na lista solicitada:', key)
            }
            return included
          })
          .map(s => {
            const sessionName = s.name || s.sessionName
            console.log('[MATURACAO] Mapeando sessão/instância:', {
              type: s.type,
              rawData: s,
              originalName: s.name,
              originalSessionName: s.sessionName,
              finalSessionName: sessionName,
              serverId: s.serverId,
              serverName: s.serverName,
              hasApiUrl: !!s.apiUrl,
              hasApiKey: !!s.apiKey
            })
            
            const mappedSession: Session = {
              type: s.type,
              serverId: s.serverId,
              serverName: s.serverName || (s.type === 'evolution' ? 'Evolution API' : `Servidor ${s.serverId}`),
              sessionName: sessionName,
              status: s.status,
              apiUrl: s.apiUrl,
              apiKey: s.apiKey,
              phoneNumber: s.phoneNumber || (s.me && s.me.id ? String(s.me.id).replace('@c.us', '').split(':')[0] : undefined),
              userId: s.userId || user.id
            }
            
            console.log('[MATURACAO] Sessão/instância mapeada final:', {
              type: mappedSession.type,
              sessionName: mappedSession.sessionName,
              serverName: mappedSession.serverName,
              hasApiUrl: !!mappedSession.apiUrl,
              hasApiKey: !!mappedSession.apiKey,
              hasPhoneNumber: !!mappedSession.phoneNumber
            })
            
            if (!mappedSession.apiUrl) {
              console.error('[MATURACAO] ⚠️ Sessão/instância sem apiUrl!', {
                type: s.type,
                serverId: s.serverId,
                rawSession: s
              })
            }
            
            if (!mappedSession.sessionName || mappedSession.sessionName === 'default' || mappedSession.sessionName === 'unknown') {
              console.error('[MATURACAO] ⚠️ Nome de sessão/instância inválido!', {
                type: s.type,
                sessionName: mappedSession.sessionName,
                rawData: s
              })
            }
            
            return mappedSession
          })
          .filter(s => {
            const statusUpper = String(s.status || '').toUpperCase()
            // Para WAHA: WORKING, CONNECTED, READY, OPEN, AUTHENTICATED
            // Para Evolution: open (já filtrado acima, mas garantir)
            const valid = s.type === 'evolution' 
              ? statusUpper === 'OPEN' 
              : ['WORKING','CONNECTED','READY','OPEN','AUTHENTICATED'].includes(statusUpper)
            if (!valid) {
              console.log('[MATURACAO] Sessão/instância filtrada (status inválido):', s.sessionName, 'Status:', s.status, 'Tipo:', s.type)
            }
            return valid
          })

        console.log('[MATURACAO] Sessões selecionadas e válidas:', selected.length, selected.map(s => ({
          name: s.sessionName,
          status: s.status,
          phoneNumber: s.phoneNumber ? 'SIM' : 'NÃO',
          hasApiUrl: !!s.apiUrl,
          hasApiKey: !!s.apiKey
        })))

        if (selected.length < 2) {
          console.error('[MATURACAO] Erro: Menos de 2 sessões válidas após filtro:', selected.length)
          const errorMsg = `Apenas ${selected.length} sessão(ões) válida(s) encontrada(s). É necessário pelo menos 2 sessões.`
          if (maturationId) {
            try {
              await fetch(`${origin}/api/maturacao/progress`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  id: maturationId, 
                  update: { 
                    status: 'no_sessions', 
                    log: { 
                      type: 'error', 
                      message: errorMsg,
                      direction: 'SYSTEM'
                    } 
                  } 
                })
              })
            } catch (e) {
              console.error('[MATURACAO] Erro ao postar erro:', e)
            }
          }
          return
        }
        
        // Validar se todas as sessões têm apiUrl e apiKey
        const sessionsWithoutApi = selected.filter(s => !s.apiUrl || !s.apiKey)
        if (sessionsWithoutApi.length > 0) {
          console.error('[MATURACAO] Erro: Sessões sem apiUrl ou apiKey:', sessionsWithoutApi.map(s => ({
            sessionName: s.sessionName,
            serverName: s.serverName,
            hasApiUrl: !!s.apiUrl,
            hasApiKey: !!s.apiKey
          })))
          const errorMsg = `${sessionsWithoutApi.length} sessão(ões) sem configuração de API (apiUrl/apiKey). Verifique as configurações dos servidores WAHA. Sessões: ${sessionsWithoutApi.map(s => s.sessionName).join(', ')}`
          if (maturationId) {
            try {
              await fetch(`${origin}/api/maturacao/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: maturationId,
                  update: {
                    status: 'error',
                    log: {
                      type: 'error',
                      message: errorMsg,
                      direction: 'SYSTEM'
                    }
                  }
                })
              })
            } catch (e) {
              console.error('[MATURACAO] Erro ao postar erro:', e)
            }
          }
          return
        }
        
        console.log('[MATURACAO] ✓ Todas as sessões têm apiUrl e apiKey configurados')

        // Função para verificar status da sessão WAHA antes de enviar e reiniciar se necessário
        const checkSessionStatus = async (sess: Session): Promise<boolean> => {
          // Apenas para WAHA
          if (sess.type === 'evolution') {
            return true // Evolution não precisa verificar status aqui (já foi verificado antes)
          }
          try {
            const sessionName = sess.sessionName || sess.name || 'default'
            const base = sess.apiUrl.replace(/\/$/, '')
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'X-Api-Key': sess.apiKey || ''
            }
            if (sess.apiKey) {
              headers['Authorization'] = `Bearer ${sess.apiKey}`
            }
            
            // Tentar buscar status da sessão
            const statusUrl = `${base}/api/sessions/${encodeURIComponent(sessionName)}`
            const statusRes = await fetch(statusUrl, { headers })
            
            if (statusRes.ok) {
              const sessionData = await statusRes.json().catch(() => null)
              if (sessionData) {
                const status = String(sessionData.status || '').toUpperCase()
                
                // Se está em estado válido, retornar true
                if (status === 'WORKING' || status === 'CONNECTED' || status === 'OPEN' || status === 'READY' || status === 'AUTHENTICATED') {
                  return true
                }
                
                // Se está FAILED ou STOPPED, tentar reiniciar automaticamente
                if (status === 'FAILED' || status === 'STOPPED') {
                  console.warn(`[SENDTEXT] Sessão ${sessionName} está com status ${status}, tentando reiniciar...`)
                  
                  try {
                    const restartUrl = `${base}/api/${encodeURIComponent(sessionName)}/restart`
                    const restartRes = await fetch(restartUrl, {
                      method: 'POST',
                      headers
                    })
                    
                    if (restartRes.ok) {
                      console.log(`[SENDTEXT] ✅ Sessão ${sessionName} reiniciada com sucesso, aguardando inicialização...`)
                      // Aguardar 5 segundos para a sessão inicializar
                      await new Promise(resolve => setTimeout(resolve, 5000))
                      
                      // Verificar novamente o status após reiniciar
                      const statusRes2 = await fetch(statusUrl, { headers })
                      if (statusRes2.ok) {
                        const sessionData2 = await statusRes2.json().catch(() => null)
                        if (sessionData2) {
                          const status2 = String(sessionData2.status || '').toUpperCase()
                          if (status2 === 'WORKING' || status2 === 'CONNECTED' || status2 === 'OPEN' || status2 === 'READY' || status2 === 'AUTHENTICATED') {
                            console.log(`[SENDTEXT] ✅ Sessão ${sessionName} está funcionando após reinício`)
                            return true
                          }
                        }
                      }
                    } else {
                      const restartError = await restartRes.json().catch(() => ({ error: 'Erro desconhecido' }))
                      console.error(`[SENDTEXT] ❌ Falha ao reiniciar sessão ${sessionName}:`, restartError)
                    }
                  } catch (restartError) {
                    console.error(`[SENDTEXT] ❌ Erro ao tentar reiniciar sessão ${sessionName}:`, restartError)
                  }
                  
                  // Se chegou aqui, reinício falhou ou não funcionou
                  return false
                }
                
                // Outros status (STARTING, SCAN_QR_CODE, etc)
                console.warn(`[SENDTEXT] Sessão ${sessionName} está com status ${status}, não é WORKING`)
                return false
              }
            }
            // Se não conseguir verificar, assumir que está OK
            return true
          } catch (error) {
            // Se falhar ao verificar, assumir que está OK e tentar enviar mesmo assim
            console.warn(`[SENDTEXT] Erro ao verificar status da sessão:`, error)
            return true
          }
        }
        
        // Utilitário de envio robusto (suporta WAHA e Evolution API)
        const sendText = async (sess: Session, toPhone: string, text: string) => {
          // Validações críticas antes de tentar enviar
          if (!sess.apiUrl) {
            console.error(`[SENDTEXT] ⚠️ Sessão/instância ${sess.sessionName || sess.name || 'unknown'} não tem apiUrl`)
            return false
          }
          if (!toPhone || !toPhone.replace(/\D/g, '')) {
            console.error(`[SENDTEXT] ⚠️ Número de telefone inválido: ${toPhone}`)
            return false
          }
          
          // Limpar número do telefone
          const phoneClean = toPhone.replace(/\D/g, '')
          
          // Enviar via Evolution API
          if (sess.type === 'evolution') {
            try {
              console.log(`[SENDTEXT] Enviando via Evolution API: ${sess.sessionName} -> ${phoneClean}`)
              
              const base = sess.apiUrl.replace(/\/$/, '')
              const response = await fetch(`${base}/message/sendText/${sess.sessionName}`, {
                method: 'POST',
                headers: {
                  'apikey': sess.apiKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  number: phoneClean,
                  text: text,
                  delay: 1200,
                  linkPreview: true
                })
              })
              
              const data = await response.json()
              
              if (response.ok) {
                console.log(`[SENDTEXT] ✅ Mensagem enviada via Evolution API`)
                return true
              } else {
                console.error(`[SENDTEXT] ✗ Falha ao enviar via Evolution API:`, {
                  status: response.status,
                  error: data.message || data.error
                })
                return false
              }
            } catch (e) {
              console.error(`[SENDTEXT] ✗ Exceção ao enviar via Evolution API:`, e)
              return false
            }
          }
          
          // Enviar via WAHA (código original)
          // Verificar status da sessão antes de tentar enviar (apenas para WAHA)
          const isSessionWorking = await checkSessionStatus(sess as any)
          if (!isSessionWorking) {
            console.error(`[SENDTEXT] ⚠️ Sessão WAHA não está em estado válido para envio`)
            return false
          }
          
          // Aceitar "default" como nome válido se não houver outro nome (apenas para WAHA)
          // Usar sessionName mesmo se for "default" (alguns servidores WAHA usam isso)
          let sessionName = sess.sessionName || sess.name
          
          // Se não tem nome válido E não tem phoneNumber, então realmente não dá para enviar
          if (!sessionName && !sess.phoneNumber) {
            console.error(`[SENDTEXT] ⚠️ Sessão sem nome válido e sem telefone:`, { sessionName, name: sess.name, phoneNumber: sess.phoneNumber })
            return false
          }
          
          // Se sessionName é "default" ou "unknown", mas temos um name válido, usar o name
          if ((sessionName === 'default' || sessionName === 'unknown') && sess.name && sess.name !== 'default' && sess.name !== 'unknown') {
            sessionName = sess.name
          }
          
          // Se ainda é "default" mas temos phoneNumber, usar o phoneNumber como identificador (mas manter "default" para o endpoint)
          // Muitos servidores WAHA usam "default" como nome padrão válido
          if (sessionName === 'default' || !sessionName) {
            sessionName = 'default' // Aceitar "default" como nome válido
            console.log(`[SENDTEXT] Usando "default" como nome da sessão (comum em servidores WAHA)`)
          }
          
          const jid = `${phoneClean}@c.us`
          const base = sess.apiUrl.replace(/\/$/, '')
          const session = encodeURIComponent(sessionName)
          
          console.log(`[SENDTEXT] Tentando enviar mensagem via WAHA:`, {
            from: `${sess.serverName || 'Servidor'} • ${sessionName}`,
            to: phoneClean,
            jid: jid,
            session: sessionName,
            apiUrl: base,
            messageLength: text.length,
            hasApiKey: !!sess.apiKey
          })
          
          // Simular digitação humana antes de enviar
          try {
            const { simulateHumanTyping } = await import('@/lib/waha-typing-simulator')
            await simulateHumanTyping({
              apiUrl: base,
              sessionName,
              apiKey: sess.apiKey,
              chatId: jid,
              messageLength: text.length
            })
          } catch (error) {
            // Se falhar, continuar mesmo assim (não bloquear o envio)
            console.log(`[SENDTEXT] Aviso: Não foi possível simular digitação, continuando envio`)
          }
          
          // Usar APENAS o endpoint padrão que funciona (mesma lógica do waha/dispatch/route.ts)
          const headers: Record<string,string> = { 
            'Content-Type': 'application/json',
            'X-Api-Key': sess.apiKey || '' 
          }
          if (sess.apiKey) {
            headers['Authorization'] = `Bearer ${sess.apiKey}`
          }
          
          // Endpoint padrão que funciona no WAHA
          const primaryAttempt = {
            url: `${base}/api/sendText`,
            body: { session: sessionName, chatId: jid, text }
          }
          
          // Tentar APENAS UMA vez o endpoint padrão
          try {
            console.log(`[SENDTEXT] Tentando: ${primaryAttempt.url}`, { bodyKeys: Object.keys(primaryAttempt.body) })
            
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
                return true
              }
            }
            
            // Se chegou aqui, falhou - tentar ler resposta para debug
            let errorData: any = null
            try {
              const text = await resp.text()
              if (text) {
                try {
                  errorData = JSON.parse(text)
                } catch {
                  errorData = { rawResponse: text }
                }
              }
            } catch (e) {
              // Ignorar erro ao ler resposta
            }
            
            console.error(`[SENDTEXT] ✗ Falha ao enviar mensagem:`, {
              url: primaryAttempt.url,
              status: resp.status,
              statusText: resp.statusText,
              data: errorData
            })
          } catch (e) {
            console.error(`[SENDTEXT] ✗ Exceção ao enviar mensagem:`, e)
          }
          
          return false
        }

        // Sistema de rastreamento de mensagens usadas por par (evita repetições)
        // Estrutura: Map<"sessionA:sessionB:type", Set<mensagem>>
        const usedMessages = new Map<string, Set<string>>()
        
        // Função auxiliar para obter chave única do par
        const getPairKey = (from: string, to: string, type: string) => {
          // Ordenar para garantir mesma chave independente da ordem
          const pair = [from, to].sort().join(':')
          return `${pair}:${type}`
        }
        
        // Função para selecionar mensagem não utilizada (evita repetições)
        const selectUniqueMessage = (
          messages: string[], 
          pairKey: string, 
          normalizeFn?: (msg: string) => string
        ): string => {
          let usedSet = usedMessages.get(pairKey)
          if (!usedSet) {
            usedSet = new Set()
            usedMessages.set(pairKey, usedSet)
          }
          
          // Normalizar mensagens (remover nome para comparação se necessário)
          const normalized = normalizeFn 
            ? messages.map(normalizeFn)
            : messages
          
          // Filtrar mensagens não utilizadas
          const available = messages.filter((msg, idx) => {
            const normMsg = normalizeFn ? normalizeFn(msg) : msg
            return !usedSet!.has(normMsg)
          })
          
          let selected: string
          if (available.length > 0) {
            // Usar mensagem ainda não utilizada
            selected = available[Math.floor(Math.random() * available.length)]
          } else {
            // Todas foram usadas, resetar e escolher nova
            usedSet.clear()
            selected = messages[Math.floor(Math.random() * messages.length)]
          }
          
          // Marcar como usada
          const selectedNorm = normalizeFn ? normalizeFn(selected) : selected
          usedSet.add(selectedNorm)
          
          return selected
        }
        
        // Armazenar histórico de mensagens por par para contexto do agente de IA
        const conversationHistoryByPair = new Map<string, string[]>()
        
        // Função para obter histórico de mensagens de um par
        const getPairHistory = (from: string, to: string): string[] => {
          const pairKey = [from, to].sort().join(':')
          return conversationHistoryByPair.get(pairKey) || []
        }
        
        // Função para adicionar mensagem ao histórico
        const addToHistory = (from: string, to: string, message: string) => {
          const pairKey = [from, to].sort().join(':')
          const history = conversationHistoryByPair.get(pairKey) || []
          history.push(message)
          // Manter apenas últimas 5 mensagens para não sobrecarregar o contexto
          conversationHistoryByPair.set(pairKey, history.slice(-5))
          // Também atualizar no contexto global
          conversationContext.conversationHistory.push({
            from,
            to,
            message,
            timestamp: Date.now()
          })
          // Limitar histórico global também
          if (conversationContext.conversationHistory.length > 50) {
            conversationContext.conversationHistory = conversationContext.conversationHistory.slice(-50)
          }
        }
        
        // Função de saudação usando agente de IA (contextualizada pelo tópico)
        const greet = async (name: string, pairKey: string, from: string, to: string) => {
          try {
            const history = getPairHistory(from, to)
            const message = await ConversationAgentService.generateContextualMessage({
              context: conversationContext,
              from,
              to,
              messageType: 'greeting',
              previousMessages: history
            })
            addToHistory(from, to, message)
            return message
          } catch (error: any) {
            console.error('[MATURACAO] Erro ao gerar saudação com IA:', error)
            // Fallback mais variado baseado no contexto
            const fallbacks = [
              `Oi ${name}!`,
              `Olá ${name}!`,
              `E aí ${name}!`,
              `Fala ${name}!`,
              `Oi ${name}, tudo bem?`
            ]
            const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]
            console.log(`[MATURACAO] Usando fallback para saudação: "${fallback}"`)
            addToHistory(from, to, fallback)
            return fallback
          }
        }
        
        // Funções para mensagens intermediárias usando agente de IA
        const getIntermediateMessage = async (pairKey: string, from: string, to: string) => {
          try {
            const history = getPairHistory(from, to)
            const message = await ConversationAgentService.generateContextualMessage({
              context: conversationContext,
              from,
              to,
              messageType: 'intermediate',
              previousMessages: history
            })
            addToHistory(from, to, message)
            return message
          } catch (error: any) {
            console.error('[MATURACAO] Erro ao gerar mensagem intermediária com IA:', error)
            // Fallback variado
            const fallbacks = [
              'Como você está?',
              'Tudo bem?',
              'E aí, como vai?',
              'Tudo certo?',
              'Como está?'
            ]
            const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]
            console.log(`[MATURACAO] Usando fallback para mensagem intermediária: "${fallback}"`)
            addToHistory(from, to, fallback)
            return fallback
          }
        }
        
        // Função para mensagens de resposta (B -> A) usando agente de IA
        const getResponseMessage = async (pairKey: string, from: string, to: string) => {
          try {
            const history = getPairHistory(from, to)
            const message = await ConversationAgentService.generateContextualMessage({
              context: conversationContext,
              from,
              to,
              messageType: 'response',
              previousMessages: history
            })
            addToHistory(from, to, message)
            return message
          } catch (error) {
            console.error('[MATURACAO] Erro ao gerar resposta com IA:', error)
            // Fallback simples
            return 'Tudo certo!'
          }
        }

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
        // Delay randomizado entre 1 minuto (mínimo) e 3 minutos (máximo) entre QUALQUER mensagem do MESMO NÚMERO
        // Cada número de telefone só pode enviar mensagens com intervalo aleatório entre 1-3 minutos
        const MIN_DELAY_BETWEEN_MESSAGES = 60000 // 1 minuto em milissegundos
        const MAX_DELAY_BETWEEN_MESSAGES = 180000 // 3 minutos em milissegundos
        const effectiveCadence = Math.max(MIN_DELAY_BETWEEN_MESSAGES, cadenceSeconds * 1000)
        const deadline = Date.now() + Math.max(1, totalMinutes) * 60 * 1000
        
        // Rastreamento de última mensagem enviada POR NÚMERO DE TELEFONE
        // Map<phoneNumber, timestamp> - armazena quando cada número enviou sua última mensagem
        const lastMessageTimeByPhone = new Map<string, number>()
        
        // Função para gerar delay aleatório entre mínimo e máximo
        const getRandomDelay = () => {
          // Gerar número aleatório entre MIN_DELAY e MAX_DELAY (em milissegundos)
          return MIN_DELAY_BETWEEN_MESSAGES + Math.floor(Math.random() * (MAX_DELAY_BETWEEN_MESSAGES - MIN_DELAY_BETWEEN_MESSAGES))
        }
        
        // Função para aguardar até que seja seguro enviar mensagem do número
        const waitForPhoneDelay = async (phoneNumber: string) => {
          const lastTime = lastMessageTimeByPhone.get(phoneNumber) || 0
          const now = Date.now()
          const timeSinceLastMessage = now - lastTime
          
          // Gerar delay aleatório entre 1-3 minutos para esta mensagem
          const randomDelay = getRandomDelay()
          
          if (timeSinceLastMessage < randomDelay) {
            // Ainda não passou o tempo aleatório escolhido, aguardar o que falta
            const waitTime = randomDelay - timeSinceLastMessage
            
            console.log(`[MATURACAO] ⏱️ Número ${phoneNumber} enviou mensagem há ${Math.ceil(timeSinceLastMessage/1000)}s. Aguardando ${Math.ceil(waitTime/1000)}s (delay aleatório: ${Math.ceil(randomDelay/1000)}s entre ${Math.ceil(MIN_DELAY_BETWEEN_MESSAGES/1000)}-${Math.ceil(MAX_DELAY_BETWEEN_MESSAGES/1000)}s) antes de permitir próxima mensagem...`)
            await delay(waitTime)
          } else {
            // Já passou mais tempo que o mínimo aleatório, mas garantir que não ultrapasse o máximo
            // Neste caso, podemos aguardar um pouco mais ou prosseguir (mas nunca menos que o mínimo já passado)
            const extraWait = Math.floor(Math.random() * 30000) // 0-30 segundos de wait extra para humanização
            if (extraWait > 0) {
              console.log(`[MATURACAO] Tempo mínimo já passou (${Math.ceil(timeSinceLastMessage/1000)}s > ${Math.ceil(randomDelay/1000)}s), mas aguardando ${Math.ceil(extraWait/1000)}s extras para humanização...`)
              await delay(extraWait)
            } else {
              console.log(`[MATURACAO] Tempo mínimo já passou (${Math.ceil(timeSinceLastMessage/1000)}s), prosseguindo...`)
            }
          }
          
          // Atualizar timestamp da última mensagem deste número
          lastMessageTimeByPhone.set(phoneNumber, Date.now())
        }
        
        console.log('[MATURACAO] Configuração de delays:', {
          cadenceSecondsRequested: cadenceSeconds,
          cadenceSecondsEffective: Math.ceil(effectiveCadence / 1000),
          minDelayMs: MIN_DELAY_BETWEEN_MESSAGES,
          maxDelayMs: MAX_DELAY_BETWEEN_MESSAGES,
          minDelaySeconds: Math.ceil(MIN_DELAY_BETWEEN_MESSAGES / 1000),
          maxDelaySeconds: Math.ceil(MAX_DELAY_BETWEEN_MESSAGES / 1000),
          deadlineMinutes: totalMinutes,
          note: 'Delay randomizado POR NÚMERO DE TELEFONE (1-3 minutos aleatórios entre qualquer mensagem do mesmo número)'
        })

        // Estatísticas para rastreamento
        let stats = {
          totalMessages: 0,
          activePairs: 0,
          conversationsCompleted: 0
        }

        const postProgress = async (update: any) => {
          if (!maturationId) return
          try {
            const progressUpdate = {
              ...update,
              stats: { ...stats, ...update.stats },
              totalMinutes
            }
            await fetch(`${origin}/api/maturacao/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: maturationId, update: progressUpdate })
            })
          } catch {}
        }

        // Tentar completar phoneNumber para sessões ausentes (apenas WAHA, Evolution já vem com número)
        const ensurePhoneNumber = async (sess: Session) => {
          if (sess.phoneNumber) return sess
          
          // Evolution API já vem com número do mapeamento inicial, não precisa buscar
          if (sess.type === 'evolution') {
            return sess
          }
          
          // Apenas para WAHA
          const base = sess.apiUrl.replace(/\/$/, '')
          const session = encodeURIComponent(sess.sessionName)
          const headers: Record<string,string> = { 'Content-Type': 'application/json', 'X-Api-Key': sess.apiKey || '' }
          if (sess.apiKey) headers['Authorization'] = `Bearer ${sess.apiKey}`
          const urls = [
            `${base}/api/me?session=${session}`,
            `${base}/api/${session}/me`,
            `${base}/api/session/${session}/me`
          ]
          for (const url of urls) {
            try {
              const r = await fetch(url, { headers })
              const d:any = await r.json().catch(() => null)
              const raw = d?.id || d?.me?.id || d?.wid || ''
              if (raw) {
                const onlyDigits = String(raw).replace(/[^0-9]/g, '')
                if (onlyDigits) {
                  sess.phoneNumber = onlyDigits
                  break
                }
              }
            } catch {}
          }
          return sess
        }

        console.log('[MATURACAO] Obtendo números de telefone das sessões...')
        for (let i=0; i<selected.length; i++) {
          const before = selected[i].phoneNumber
          selected[i] = await ensurePhoneNumber(selected[i])
          const after = selected[i].phoneNumber
          if (!before && after) {
            console.log('[MATURACAO] Número obtido para:', selected[i].sessionName, ':', after)
          } else if (!before && !after) {
            console.warn('[MATURACAO] Não foi possível obter número para:', selected[i].sessionName)
          }
        }

        const withPhones = selected.filter(s => !!s.phoneNumber)
        console.log('[MATURACAO] Sessões com números válidos:', withPhones.length, 'de', selected.length)
        
        if (withPhones.length < 2) {
          console.error('[MATURACAO] Erro: Menos de 2 sessões com números válidos:', withPhones.length)
          await postProgress({ 
            status: 'no_numbers', 
            log: { type: 'error', message: `Apenas ${withPhones.length} sessão(ões) com número válido encontrada(s)` } 
          })
          return
        }
        // Substitui por versão com números garantidos
        const sessionsReady = withPhones
        console.log('[MATURACAO] Sessões prontas para maturação:', sessionsReady.map(s => ({
          name: s.sessionName,
          phone: s.phoneNumber,
          server: s.serverName
        })))

        // Limpar flag de parada anterior (se houver)
        stopFlags.set(maturationId, false)
        
        // GERAR TÓPICO ALEATÓRIO PARA TODAS AS CONVERSAS (Agente de IA)
        const topic = ConversationAgentService.generateRandomTopic()
        const conversationContext: ConversationContext = {
          topic: topic.name,
          topicDescription: topic.description,
          conversationHistory: []
        }
        
        console.log('[MATURACAO] Tópico gerado para as conversas:', {
          topic: topic.name,
          description: topic.description.substring(0, 100) + '...'
        })
        
        await postProgress({ 
          status: 'started', 
          remainingMs: Math.max(0, deadline - Date.now()), 
          stats,
          log: { 
            type: 'info', 
            message: `Tópico da conversa: ${topic.name}. Todas as conversas serão sobre ${topic.name.toLowerCase()}.`, 
            direction: 'SYSTEM' 
          } 
        })
        
        // Atualizar estatísticas iniciais
        stats.activePairs = sessionsReady.length * (sessionsReady.length - 1) // Todas conversam entre si
        const totalPairsPossible = stats.activePairs
        console.log('[MATURACAO] Maturação iniciada:', {
          sessionsReady: sessionsReady.length,
          totalPairsPossible,
          totalMinutes,
          topic: topic.name,
          deadline: new Date(deadline).toISOString()
        })
        
        await postProgress({ 
          status: 'started', 
          remainingMs: Math.max(0, deadline - Date.now()), 
          stats,
          log: { 
            type: 'info', 
            message: `Maturação iniciada com ${sessionsReady.length} sessões. Todas conversarão sobre ${topic.name.toLowerCase()} (${stats.activePairs} pares possíveis)`, 
            direction: 'SYSTEM' 
          } 
        })
        
        console.log('[MATURACAO] Progresso inicial postado, aguardando 1s...')
        // Pequeno delay para garantir que o progresso seja atualizado
        await delay(1000)

        // Função para embaralhar array (Fisher-Yates)
        const shuffleArray = <T>(array: T[]): T[] => {
          const shuffled = [...array]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          return shuffled
        }

        // Função para gerar pares únicos entre todas as sessões (todas conversam entre si)
        const generateConversationPairs = (sessions: Session[]): Array<{from: Session, to: Session}> => {
          const pairs: Array<{from: Session, to: Session}> = []
          
          // Criar matriz de todas as combinações possíveis (sem repetir o mesmo par)
          for (let i = 0; i < sessions.length; i++) {
            for (let j = 0; j < sessions.length; j++) {
              if (i !== j) { // Não conversar consigo mesmo
                pairs.push({ from: sessions[i], to: sessions[j] })
              }
            }
          }
          
          // Embaralhar para variar as conversas
          return shuffleArray(pairs)
        }

        // Loop de múltiplas rodadas
        const totalPauseMinutes = numberOfRounds > 1 ? (numberOfRounds - 1) * (pauseMinutesBetweenRounds || 0) : 0
        console.log('[MATURACAO] Configuração de rodadas:', {
          numberOfRounds,
          minutesPerRound,
          pauseMinutesBetweenRounds,
          totalPauseMinutes,
          totalMinutes,
          totalRounds: numberOfRounds
        })
        
        await postProgress({ 
          status: 'started', 
          remainingMs: Math.max(0, deadline - Date.now()), 
          stats,
          log: { 
            type: 'info', 
            message: `Maturação configurada com ${numberOfRounds} rodada${numberOfRounds !== 1 ? 's' : ''} de ${minutesPerRound} minuto${minutesPerRound !== 1 ? 's' : ''} cada${totalPauseMinutes > 0 ? ` com ${pauseMinutesBetweenRounds} minuto${pauseMinutesBetweenRounds !== 1 ? 's' : ''} de pausa entre rodadas` : ''} (total: ${totalMinutes} minutos)`, 
            direction: 'SYSTEM' 
          } 
        })
        
        // Loop principal: processar cada rodada
        for (let roundNumber = 0; roundNumber < numberOfRounds; roundNumber++) {
          // Verificar se foi solicitado para parar antes de iniciar a próxima rodada
          if (shouldStop(maturationId)) {
            console.log('[MATURACAO] Parada solicitada pelo usuário antes da rodada', roundNumber + 1)
            await postProgress({ 
              status: 'stopped', 
              remainingMs: Math.max(0, deadline - Date.now()),
              stats,
              log: { type: 'info', message: `Maturação interrompida pelo usuário. Rodada ${roundNumber + 1}/${numberOfRounds} não iniciada.`, direction: 'SYSTEM' } 
            })
            break
          }
          
          // Calcular deadline para esta rodada específica
          const roundStartTime = Date.now()
          const roundDeadline = roundStartTime + (minutesPerRound * 60 * 1000)
          
          console.log(`[MATURACAO] ============================================`)
          console.log(`[MATURACAO] Iniciando RODADA ${roundNumber + 1}/${numberOfRounds}`)
          console.log(`[MATURACAO] Tempo por rodada: ${minutesPerRound} minutos`)
          console.log(`[MATURACAO] Deadline desta rodada: ${new Date(roundDeadline).toISOString()}`)
          console.log(`[MATURACAO] ============================================`)
          
          await postProgress({ 
            status: 'sending', 
            remainingMs: Math.max(0, deadline - Date.now()),
            stats,
            log: { 
              type: 'info', 
              message: `🔄 Iniciando rodada ${roundNumber + 1}/${numberOfRounds} (${minutesPerRound} minuto${minutesPerRound !== 1 ? 's' : ''})`, 
              direction: 'SYSTEM' 
            } 
          })
          
          // Loop de maturação controlado por tempo para esta rodada específica
          let conversationRound = 0
          console.log(`[MATURACAO] Entrando no loop da rodada ${roundNumber + 1}...`)
          
          while (Date.now() < roundDeadline) {
            const now = Date.now()
            const remainingRound = roundDeadline - now
            const remainingTotal = deadline - now
            console.log(`[MATURACAO] Rodada ${roundNumber + 1}, Ciclo ${conversationRound}, Tempo restante nesta rodada: ${Math.ceil(remainingRound/1000)}s, Tempo total restante: ${Math.ceil(remainingTotal/1000)}s`)
            
            // Verificar se foi solicitado para parar
            if (shouldStop(maturationId)) {
              console.log(`[MATURACAO] Parada solicitada pelo usuário na rodada ${roundNumber + 1}`)
              await postProgress({ 
                status: 'stopped', 
                remainingMs: Math.max(0, deadline - Date.now()),
                stats,
                log: { type: 'info', message: `Maturação interrompida pelo usuário na rodada ${roundNumber + 1}`, direction: 'SYSTEM' } 
              })
              break
            }

            // Verificar se o deadline desta rodada foi atingido
            if (Date.now() >= roundDeadline) {
              console.log(`[MATURACAO] Deadline da rodada ${roundNumber + 1} atingido, finalizando ciclo`)
              break
            }
            if (Date.now() >= deadline) {
              console.log(`[MATURACAO] Deadline total atingido, finalizando todas as rodadas`)
              break
            }

            // Gerar todos os pares possíveis para este ciclo (todas conversam entre si)
            const conversationPairs = generateConversationPairs(sessionsReady)
            stats.activePairs = conversationPairs.length
            console.log(`[MATURACAO] Rodada ${roundNumber + 1}, Ciclo ${conversationRound}: ${conversationPairs.length} pares gerados`)
            
            // Log informativo no primeiro ciclo de cada rodada
            if (conversationRound === 0) {
              console.log(`[MATURACAO] Primeiro ciclo da rodada ${roundNumber + 1}, postando log inicial...`)
              await postProgress({ 
                status: 'sending', 
                remainingMs: Math.max(0, deadline - Date.now()),
                stats,
                log: { 
                  type: 'info', 
                  message: `Rodada ${roundNumber + 1}: Iniciando ${conversationPairs.length} conversas entre ${sessionsReady.length} sessões (todas conversam entre si)`, 
                  direction: 'SYSTEM' 
                } 
              })
            }
            
            // Processar cada par de conversação (evitar duplicações)
            let pairIndex = 0
            const processedPairs = new Set<string>() // Rastrear pares já processados neste ciclo
          
          for (const pair of conversationPairs) {
            // Usar identificadores únicos (phoneNumber ou sessionName/name) para criar chave do par
            const idA = pair.from.phoneNumber || pair.from.sessionName || pair.from.name || pair.from.serverId
            const idB = pair.to.phoneNumber || pair.to.sessionName || pair.to.name || pair.to.serverId
            
            // Criar chave única para o par (ordenada para evitar A->B e B->A serem considerados diferentes)
            const pairKey = [idA, idB].sort().join(':')
            
            // Se já processamos este par nesta rodada, pular
            if (processedPairs.has(pairKey)) {
              console.log(`[MATURACAO] Par ${pairKey} já processado nesta rodada, pulando...`)
              continue
            }
            
            // Marcar como processado
            processedPairs.add(pairKey)
            pairIndex++
            console.log(`[MATURACAO] Processando par ${pairIndex}/${conversationPairs.length}: ${pair.from.sessionName} → ${pair.to.sessionName}`)
            // Verificar novamente se deve parar
            if (shouldStop(maturationId)) {
              await postProgress({ 
                status: 'stopped', 
                remainingMs: Math.max(0, deadline - Date.now()),
                stats,
                log: { type: 'info', message: 'Maturação interrompida pelo usuário', direction: 'SYSTEM' } 
              })
              break
            }

            // Verificar deadline desta rodada e total
            if (Date.now() >= roundDeadline) {
              console.log(`[MATURACAO] Deadline da rodada ${roundNumber + 1} atingido, finalizando ciclo`)
              break
            }
            if (Date.now() >= deadline) {
              console.log(`[MATURACAO] Deadline total atingido, finalizando todas as rodadas`)
              break
            }

            const a = pair.from
            const b = pair.to
            if (!a.phoneNumber || !b.phoneNumber) {
              console.warn(`[MATURACAO] ⚠️ Par ignorado: ${a.sessionName} ou ${b.sessionName} sem número de telefone`)
              continue
            }
            
            // Usar telefone como identificador visual se disponível, senão usar nome da sessão
            // Formatar telefone: +55 41 92000-0574
            const formatPhone = (phone?: string) => {
              if (!phone) return null
              const digits = phone.replace(/\D/g, '')
              if (digits.length < 10) return phone
              
              // Formato brasileiro: +55 (41) 92000-0574
              if (digits.length === 13 && digits.startsWith('55')) {
                const country = digits.substring(0, 2)
                const area = digits.substring(2, 4)
                const first = digits.substring(4, 9)
                const last = digits.substring(9)
                return `+${country} (${area}) ${first}-${last}`
              }
              // Formato curto: (41) 92000-0574
              if (digits.length === 11) {
                const area = digits.substring(0, 2)
                const first = digits.substring(2, 7)
                const last = digits.substring(7)
                return `(${area}) ${first}-${last}`
              }
              return phone
            }
            
            // Identificador visual: usar telefone formatado se disponível, senão usar nome
            const displayNameA = a.phoneNumber ? formatPhone(a.phoneNumber) || a.sessionName || a.name || 'Sessão'
              : (a.sessionName && a.sessionName !== 'default' && a.sessionName !== 'unknown' ? a.sessionName : a.name || `Sessão-${a.serverId}`)
            const displayNameB = b.phoneNumber ? formatPhone(b.phoneNumber) || b.sessionName || b.name || 'Sessão'
              : (b.sessionName && b.sessionName !== 'default' && b.sessionName !== 'unknown' ? b.sessionName : b.name || `Sessão-${b.serverId}`)
            
            // Nomes internos para histórico e chaves (podem ser diferentes do display)
            const nameA = a.sessionName && a.sessionName !== 'default' && a.sessionName !== 'unknown' 
              ? a.sessionName 
              : a.name || a.phoneNumber || `Sessão-${a.serverId}`
            const nameB = b.sessionName && b.sessionName !== 'default' && b.sessionName !== 'unknown'
              ? b.sessionName 
              : b.name || b.phoneNumber || `Sessão-${b.serverId}`
            
            console.log(`[MATURACAO] Processando conversa:`, {
              from: { displayName: displayNameA, internalName: nameA, server: a.serverName, phone: a.phoneNumber },
              to: { displayName: displayNameB, internalName: nameB, server: b.serverName, phone: b.phoneNumber }
            })
            
            // Chaves únicas para cada tipo de mensagem por par e direção (A->B e B->A)
            // Cada direção mantém seu próprio histórico de mensagens
            const pairKeyABGreeting = getPairKey(nameA, nameB, 'greeting:A->B')
            const pairKeyABMsg = getPairKey(nameA, nameB, 'intermediate:A->B')
            const pairKeyABTemplate = getPairKey(nameA, nameB, 'template:A->B')
            const pairKeyBAGreeting = getPairKey(nameA, nameB, 'greeting:B->A')
            const pairKeyBAResponse = getPairKey(nameA, nameB, 'response:B->A')

            // ============================================
            // FLUXO DE CONVERSA HUMANIZADO (Alternando A <-> B)
            // ============================================
            // Simula conversa real: A envia mensagem, B responde, A continua, B responde, etc.
            
            // 1. A -> B: Saudação inicial (primeira mensagem da conversa)
            await waitForPhoneDelay(a.phoneNumber)
            console.log(`[MATURACAO] [1] A envia saudação: ${nameA} → ${nameB}`)
            const greetingAB = await greet(nameB, pairKeyABGreeting, nameA, nameB)
            console.log(`[MATURACAO] Saudação gerada pelo agente de IA: "${greetingAB}"`)
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: null, // Limpar quando mensagem é enviada
              stats,
              log: { direction: 'A→B', from: displayNameA, to: displayNameB, type: 'greeting', text: greetingAB } 
            })
            const sent1 = await sendText(a, b.phoneNumber, greetingAB)
            console.log(`[MATURACAO] Saudação enviada:`, sent1 ? 'SUCESSO' : 'FALHA')
            if (!sent1) {
              console.error(`[MATURACAO] ✗ Falha ao enviar saudação de ${nameA} para ${nameB}`)
              await postProgress({
                status: 'sending',
                pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` },
                remainingMs: Math.max(0, deadline - Date.now()),
                stats,
                log: {
                  type: 'error',
                  message: `Falha ao enviar saudação de ${displayNameA} para ${displayNameB}. Verifique logs do servidor.`,
                  direction: 'A→B'
                }
              })
              continue // Pular para próximo par se falhar a primeira mensagem
            }
            stats.totalMessages++
            
            // Delay humanizado: simular tempo de leitura e preparação da resposta (30-90 segundos)
            const readingDelaySeconds = Math.floor(Math.random() * 60) + 30 // 30-90 segundos
            const nextMessageAt = Date.now() + (readingDelaySeconds * 1000)
            console.log(`[MATURACAO] ⏱️ Aguardando ${readingDelaySeconds}s (simulando leitura e preparação de resposta de B)...`)
            // Atualizar progresso com próximo tempo de mensagem
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt,
              stats
            })
            await delay(readingDelaySeconds * 1000)
            
            // 2. B -> A: Resposta à saudação (primeira resposta de B)
            await waitForPhoneDelay(b.phoneNumber)
            console.log(`[MATURACAO] [2] B responde à saudação: ${nameB} → ${nameA}`)
            const greetingBA = await greet(nameA, pairKeyBAGreeting, nameB, nameA)
            console.log(`[MATURACAO] Resposta saudação gerada pelo agente de IA: "${greetingBA}"`)
            await postProgress({ 
              status: 'replying', 
              pair: { from: `${b.serverName} • ${displayNameB}`, to: `${a.serverName} • ${displayNameA}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: null, // Limpar quando mensagem é enviada
              stats,
              log: { direction: 'B→A', from: displayNameB, to: displayNameA, type: 'greeting', text: greetingBA } 
            })
            const sent2 = await sendText(b, a.phoneNumber, greetingBA)
            console.log(`[MATURACAO] Resposta saudação enviada:`, sent2 ? 'SUCESSO' : 'FALHA')
            if (!sent2) {
              console.error(`[MATURACAO] ✗ Falha ao enviar resposta saudação de ${nameB} para ${nameA}`)
            } else {
              stats.totalMessages++
            }
            
            // Delay humanizado: simular tempo de leitura e preparação da próxima mensagem (30-90 segundos)
            const readingDelaySeconds2 = Math.floor(Math.random() * 60) + 30 // 30-90 segundos
            const nextMessageAt2 = Date.now() + (readingDelaySeconds2 * 1000)
            console.log(`[MATURACAO] ⏱️ Aguardando ${readingDelaySeconds2}s (simulando leitura e preparação de mensagem de A)...`)
            // Atualizar progresso com próximo tempo de mensagem
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${b.serverName} • ${displayNameB}`, to: `${a.serverName} • ${displayNameA}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: nextMessageAt2,
              stats
            })
            await delay(readingDelaySeconds2 * 1000)
            
            // 3. A -> B: Mensagem intermediária (continuação da conversa)
            await waitForPhoneDelay(a.phoneNumber)
            console.log(`[MATURACAO] [3] A continua conversa: ${nameA} → ${nameB}`)
            const intermediateAB = await getIntermediateMessage(pairKeyABMsg, nameA, nameB)
            console.log(`[MATURACAO] Mensagem intermediária gerada pelo agente de IA: "${intermediateAB}"`)
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: null, // Limpar quando mensagem é enviada
              stats,
              log: { direction: 'A→B', from: displayNameA, to: displayNameB, type: 'message', text: intermediateAB } 
            })
            const sent3 = await sendText(a, b.phoneNumber, intermediateAB)
            console.log(`[MATURACAO] Mensagem intermediária enviada:`, sent3 ? 'SUCESSO' : 'FALHA')
            if (!sent3) {
              console.error(`[MATURACAO] ✗ Falha ao enviar mensagem intermediária de ${nameA} para ${nameB}`)
            } else {
              stats.totalMessages++
            }
            
            // Delay humanizado: simular tempo de leitura e preparação da resposta (30-90 segundos)
            const readingDelaySeconds3 = Math.floor(Math.random() * 60) + 30 // 30-90 segundos
            const nextMessageAt3 = Date.now() + (readingDelaySeconds3 * 1000)
            console.log(`[MATURACAO] ⏱️ Aguardando ${readingDelaySeconds3}s (simulando leitura e preparação de resposta de B)...`)
            // Atualizar progresso com próximo tempo de mensagem
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: nextMessageAt3,
              stats
            })
            await delay(readingDelaySeconds3 * 1000)
            
            // 4. B -> A: Resposta à mensagem intermediária
            await waitForPhoneDelay(b.phoneNumber)
            console.log(`[MATURACAO] [4] B responde: ${nameB} → ${nameA}`)
            const responseBA = await getResponseMessage(pairKeyBAResponse, nameB, nameA)
            console.log(`[MATURACAO] Resposta mensagem gerada pelo agente de IA: "${responseBA}"`)
            await postProgress({ 
              status: 'replying', 
              pair: { from: `${b.serverName} • ${displayNameB}`, to: `${a.serverName} • ${displayNameA}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: null, // Limpar quando mensagem é enviada
              stats,
              log: { direction: 'B→A', from: displayNameB, to: displayNameA, type: 'message', text: responseBA } 
            })
            const sent4 = await sendText(b, a.phoneNumber, responseBA)
            console.log(`[MATURACAO] Resposta mensagem enviada:`, sent4 ? 'SUCESSO' : 'FALHA')
            if (!sent4) {
              console.error(`[MATURACAO] ✗ Falha ao enviar resposta mensagem de ${nameB} para ${nameA}`)
            } else {
              stats.totalMessages++
            }
            
            // Delay humanizado: simular tempo de leitura e preparação da próxima mensagem (30-90 segundos)
            const readingDelaySeconds4 = Math.floor(Math.random() * 60) + 30 // 30-90 segundos
            const nextMessageAt4 = Date.now() + (readingDelaySeconds4 * 1000)
            console.log(`[MATURACAO] ⏱️ Aguardando ${readingDelaySeconds4}s (simulando leitura e preparação de mensagem de A)...`)
            // Atualizar progresso com próximo tempo de mensagem
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${b.serverName} • ${displayNameB}`, to: `${a.serverName} • ${displayNameA}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: nextMessageAt4,
              stats
            })
            await delay(readingDelaySeconds4 * 1000)
            
            // 5. A -> B: Mensagem adicional sobre o tópico (opcional, encerrando conversa)
            await waitForPhoneDelay(a.phoneNumber)
            console.log(`[MATURACAO] [5] A finaliza conversa: ${nameA} → ${nameB}`)
            const additionalMsg = await getIntermediateMessage(pairKeyABMsg + ':additional', nameA, nameB)
            console.log(`[MATURACAO] Mensagem adicional gerada pelo agente de IA: "${additionalMsg}"`)
            await postProgress({ 
              status: 'sending', 
              pair: { from: `${a.serverName} • ${displayNameA}`, to: `${b.serverName} • ${displayNameB}` }, 
              remainingMs: Math.max(0, deadline - Date.now()),
              nextMessageAt: null, // Limpar quando mensagem é enviada
              stats,
              log: { direction: 'A→B', from: displayNameA, to: displayNameB, type: 'message', text: additionalMsg } 
            })
            const sent5 = await sendText(a, b.phoneNumber, additionalMsg)
            console.log(`[MATURACAO] Mensagem adicional enviada:`, sent5 ? 'SUCESSO' : 'FALHA')
            if (!sent5) {
              console.error(`[MATURACAO] ✗ Falha ao enviar mensagem adicional de ${nameA} para ${nameB}`)
            } else {
              stats.totalMessages++
            }
            console.log(`[MATURACAO] Par ${pairIndex}/${conversationPairs.length} concluído`)
            
            stats.conversationsCompleted++
          }
          
            conversationRound++
            
            console.log(`[MATURACAO] Rodada ${roundNumber + 1}, Ciclo ${conversationRound} concluído. Total de mensagens: ${stats.totalMessages}, Conversas: ${stats.conversationsCompleted}`)
            
            // Heartbeat com estatísticas atualizadas
            await postProgress({ 
              status: 'running', 
              remainingMs: Math.max(0, deadline - Date.now()),
              stats,
              log: { 
                type: 'info', 
                message: `Rodada ${roundNumber + 1}, Ciclo ${conversationRound}: ${conversationPairs.length} conversas realizadas entre todas as sessões`, 
                direction: 'SYSTEM' 
              } 
            })
            
            // Pequeno delay entre ciclos dentro da mesma rodada (se ainda houver tempo)
            if (Date.now() < roundDeadline) {
              const cycleDelay = Math.floor(Math.random() * 15000) + 5000 // 5-20 segundos
              const remainingRound = roundDeadline - Date.now()
              const actualDelay = Math.min(cycleDelay, remainingRound - 1000) // Não ultrapassar deadline
              
              if (actualDelay > 1000) {
                console.log(`[MATURACAO] Aguardando ${Math.ceil(actualDelay/1000)}s antes do próximo ciclo da rodada ${roundNumber + 1}...`)
                await delay(actualDelay)
              }
            }
          }
          
          // Rodada concluída
          const roundEndTime = Date.now()
          const roundDuration = Math.ceil((roundEndTime - roundStartTime) / 1000 / 60)
          console.log(`[MATURACAO] ============================================`)
          console.log(`[MATURACAO] Rodada ${roundNumber + 1}/${numberOfRounds} CONCLUÍDA`)
          console.log(`[MATURACAO] Duração: ${roundDuration} minuto${roundDuration !== 1 ? 's' : ''}`)
          console.log(`[MATURACAO] Mensagens enviadas nesta rodada: ${stats.totalMessages}`)
          console.log(`[MATURACAO] ============================================`)
          
          await postProgress({ 
            status: roundNumber < numberOfRounds - 1 ? 'running' : 'finished', 
            remainingMs: Math.max(0, deadline - Date.now()),
            stats,
            log: { 
              type: 'info', 
              message: `✅ Rodada ${roundNumber + 1}/${numberOfRounds} concluída (${roundDuration} minuto${roundDuration !== 1 ? 's' : ''})${roundNumber < numberOfRounds - 1 ? `. Aguardando ${pauseMinutesBetweenRounds} minuto${pauseMinutesBetweenRounds !== 1 ? 's' : ''} antes da próxima rodada...` : '. Todas as rodadas foram concluídas!'}`, 
              direction: 'SYSTEM' 
            } 
          })
          
          // Pausa configurável entre rodadas (se não for a última)
          if (roundNumber < numberOfRounds - 1 && pauseMinutesBetweenRounds > 0) {
            const pauseDelayMs = pauseMinutesBetweenRounds * 60 * 1000 // Converter minutos para milissegundos
            const pauseDelayMinutes = pauseMinutesBetweenRounds
            const pauseDelaySeconds = Math.floor(pauseDelayMs / 1000)
            
            console.log(`[MATURACAO] ============================================`)
            console.log(`[MATURACAO] PAUSA ENTRE RODADAS`)
            console.log(`[MATURACAO] Aguardando ${pauseDelayMinutes} minuto${pauseDelayMinutes !== 1 ? 's' : ''} (${pauseDelaySeconds} segundos) antes da rodada ${roundNumber + 2}/${numberOfRounds}...`)
            console.log(`[MATURACAO] ============================================`)
            
            await postProgress({ 
              status: 'running', 
              remainingMs: Math.max(0, deadline - Date.now()),
              stats,
              log: { 
                type: 'info', 
                message: `⏸️ Pausa de ${pauseDelayMinutes} minuto${pauseDelayMinutes !== 1 ? 's' : ''} entre rodadas. Retomando em breve...`, 
                direction: 'SYSTEM' 
              } 
            })
            
            // Aguardar pausa configurável (com verificação periódica de parada)
            const pauseStartTime = Date.now()
            const pauseEndTime = pauseStartTime + pauseDelayMs
            
            while (Date.now() < pauseEndTime) {
              // Verificar se foi solicitado para parar durante a pausa
              if (shouldStop(maturationId)) {
                console.log('[MATURACAO] Parada solicitada pelo usuário durante a pausa entre rodadas')
                await postProgress({ 
                  status: 'stopped', 
                  remainingMs: Math.max(0, deadline - Date.now()),
                  stats,
                  log: { type: 'info', message: `Maturação interrompida pelo usuário durante a pausa entre rodadas.`, direction: 'SYSTEM' } 
                })
                return // Sair completamente do processo
              }
              
              // Aguardar em pequenos intervalos (5 segundos) para permitir verificação de parada
              const remainingPauseMs = pauseEndTime - Date.now()
              const waitInterval = Math.min(5000, remainingPauseMs) // Máximo 5 segundos por intervalo
              
              if (waitInterval > 100) {
                await delay(waitInterval)
              } else {
                break
              }
            }
            
            const actualPauseDuration = Math.ceil((Date.now() - pauseStartTime) / 1000 / 60)
            console.log(`[MATURACAO] Pausa concluída (${actualPauseDuration} minuto${actualPauseDuration !== 1 ? 's' : ''}). Iniciando rodada ${roundNumber + 2}/${numberOfRounds}...`)
            
            await postProgress({ 
              status: 'running', 
              remainingMs: Math.max(0, deadline - Date.now()),
              stats,
              log: { 
                type: 'info', 
                message: `▶️ Pausa concluída. Iniciando rodada ${roundNumber + 2}/${numberOfRounds}...`, 
                direction: 'SYSTEM' 
              } 
            })
          }
        }
        
        // Todas as rodadas concluídas
        console.log(`[MATURACAO] ============================================`)
        console.log(`[MATURACAO] TODAS AS ${numberOfRounds} RODADAS CONCLUÍDAS`)
        console.log(`[MATURACAO] Total de mensagens enviadas: ${stats.totalMessages}`)
        console.log(`[MATURACAO] Total de conversas completadas: ${stats.conversationsCompleted}`)
        console.log(`[MATURACAO] ============================================`)
        
        await postProgress({ 
          status: 'finished', 
          remainingMs: 0,
          stats,
          log: { 
            type: 'info', 
            message: `🎉 Maturação completa! ${numberOfRounds} rodada${numberOfRounds !== 1 ? 's' : ''} concluída${numberOfRounds !== 1 ? 's' : ''}. Total: ${stats.totalMessages} mensagens enviadas, ${stats.conversationsCompleted} conversas completadas.`, 
            direction: 'SYSTEM' 
          } 
        })
        
        // Se a maturação foi iniciada a partir de um agendamento, atualizar status do agendamento
        if (maturationId && maturationId.startsWith('scheduled_')) {
          try {
            // Extrair scheduleId do maturationId (formato: scheduled_{scheduleId}_{timestamp})
            // scheduleId é um UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            // O formato completo é: scheduled_{uuid}_{timestamp}
            const scheduleIdMatch = maturationId.match(/^scheduled_(.+?)_(\d+)$/)
            if (scheduleIdMatch && scheduleIdMatch[1]) {
              const scheduleId = scheduleIdMatch[1]
              
              // Atualizar status do agendamento para 'concluido'
              const { createServerClient } = await import('@supabase/ssr')
              const { cookies: getCookies } = await import('next/headers')
              const cookieStore = getCookies()
              const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  cookies: {
                    get(name: string) {
                      return req.cookies.get(name)?.value
                    },
                  },
                }
              )
              
              // Primeiro, tentar atualizar pelo ID do agendamento e maturation_id (mais seguro)
              // Isso funciona mesmo se os cookies não estiverem disponíveis
              const { data: updatedSchedule, error: updateError } = await supabase
                .from('maturacao_schedules')
                .update({
                  status: 'concluido',
                  updated_at: new Date().toISOString()
                })
                .eq('id', scheduleId)
                .eq('maturation_id', maturationId) // Verificação extra: só atualiza se o maturation_id corresponder
                .select()
                .single()
              
              if (updateError) {
                // Se falhou, tentar sem a verificação do maturation_id (para compatibilidade)
                const { data: updatedSchedule2, error: updateError2 } = await supabase
                  .from('maturacao_schedules')
                  .update({
                    status: 'concluido',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', scheduleId)
                  .select()
                  .single()
                
                if (updateError2) {
                  console.error('[MATURACAO] Erro ao atualizar status do agendamento:', updateError2)
                } else if (updatedSchedule2) {
                  console.log('[MATURACAO] Status do agendamento atualizado para "concluido":', scheduleId)
                }
              } else if (updatedSchedule) {
                console.log('[MATURACAO] Status do agendamento atualizado para "concluido":', scheduleId)
              }
            }
          } catch (updateError) {
            // Logar erro para debug, mas não interromper o processo
            console.error('[MATURACAO] Erro ao atualizar agendamento após conclusão:', updateError)
          }
        }
      } catch (err) {
        console.error('[MATURACAO] Erro crítico no processo background:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        const errorStack = err instanceof Error ? err.stack : 'N/A'
        console.error('[MATURACAO] Stack trace:', errorStack)
        
        if (maturationId) {
          try {
            await fetch(`${origin}/api/maturacao/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                id: maturationId, 
                update: { 
                  status: 'error', 
                  log: { 
                    type: 'error', 
                    message: `Erro: ${errorMessage}`,
                    direction: 'SYSTEM',
                    details: errorStack ? errorStack.substring(0, 200) : errorMessage // Primeiros 200 chars do stack
                  } 
                } 
              })
            })
          } catch (e) {
            console.error('[MATURACAO] Erro ao postar erro de progresso:', e)
          }
        }
      }
    })()

    console.log('[MATURACAO] Resposta HTTP enviada: success=true')
    return res.status(200).json({ success: true, started: true })
  } catch (e) {
    console.error('[MATURACAO] Erro na função POST principal:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    console.error('[MATURACAO] Stack trace:', e instanceof Error ? e.stack : 'N/A')
    return res.status(200).json({ 
      error: 'Erro ao iniciar maturação',
      details: errorMessage 
    }, { status: 500 })
  }
}
}