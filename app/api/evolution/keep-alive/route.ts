import { NextRequest, NextResponse } from 'next/server'

// Sistema de Keep-Alive para manter instâncias conectadas
// Evita desconexões por inatividade e tokens expirados

interface KeepAliveConfig {
  userId: string
  interval: number // em milissegundos
  enabled: boolean
}

interface InstanceKeepAlive {
  instanceName: string
  lastPing: string
  status: 'active' | 'inactive' | 'error'
  errorCount: number
}

// Armazenar configurações de keep-alive por usuário
const keepAliveConfigs = new Map<string, KeepAliveConfig>()
const keepAliveIntervals = new Map<string, NodeJS.Timeout>()
const instanceStatus = new Map<string, InstanceKeepAlive>()

// GET - Obter status do keep-alive
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    const config = keepAliveConfigs.get(userId)
    const isActive = keepAliveIntervals.has(userId)
    const instances = Array.from(instanceStatus.entries())
      .filter(([key]) => key.startsWith(`${userId}_`))
      .map(([key, status]) => ({
        instanceName: key.replace(`${userId}_`, ''),
        status: status
      }))

    return NextResponse.json({
      success: true,
      isActive,
      config: config || null,
      instances,
      summary: {
        total: instances.length,
        active: instances.filter(i => i.status?.status === 'active').length,
        inactive: instances.filter(i => i.status?.status === 'inactive').length,
        errors: instances.filter(i => i.status?.status === 'error').length
      }
    })

  } catch (error) {
    console.error('❌ Erro no GET keep-alive:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Controlar keep-alive
export async function POST(request: NextRequest) {
  try {
    const { userId, action, config } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    console.log(`🔄 Ação de keep-alive: ${action} para usuário ${userId}`)

    switch (action) {
      case 'start_keepalive':
        return await startKeepAlive(userId, config)
      
      case 'stop_keepalive':
        return await stopKeepAlive(userId)
      
      case 'get_status':
        return await getKeepAliveStatus(userId)
      
      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erro no controle de keep-alive:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Iniciar keep-alive
async function startKeepAlive(userId: string, customConfig?: Partial<KeepAliveConfig>) {
  try {
    // Parar keep-alive existente se houver
    await stopKeepAlive(userId)

    const keepAliveConfig: KeepAliveConfig = {
      userId,
      interval: customConfig?.interval || 30000, // 30 segundos por padrão
      enabled: customConfig?.enabled !== false
    }

    keepAliveConfigs.set(userId, keepAliveConfig)

    // Iniciar intervalo de keep-alive
    const interval = setInterval(async () => {
      await performKeepAlive(userId)
    }, keepAliveConfig.interval)

    keepAliveIntervals.set(userId, interval)

    console.log(`✅ Keep-alive iniciado para usuário ${userId} com intervalo de ${keepAliveConfig.interval}ms`)

    // Executar keep-alive imediatamente
    await performKeepAlive(userId)

    return NextResponse.json({
      success: true,
      message: 'Keep-alive iniciado com sucesso',
      config: keepAliveConfig
    })

  } catch (error) {
    console.error('❌ Erro ao iniciar keep-alive:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar keep-alive'
    }, { status: 500 })
  }
}

// Parar keep-alive
async function stopKeepAlive(userId: string) {
  try {
    const interval = keepAliveIntervals.get(userId)
    
    if (interval) {
      clearInterval(interval)
      keepAliveIntervals.delete(userId)
    }

    keepAliveConfigs.delete(userId)

    // Limpar status das instâncias do usuário
    const userInstances = Array.from(instanceStatus.keys())
      .filter(key => key.startsWith(`${userId}_`))
    
    userInstances.forEach(key => instanceStatus.delete(key))

    console.log(`✅ Keep-alive parado para usuário ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Keep-alive parado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao parar keep-alive:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar keep-alive'
    }, { status: 500 })
  }
}

// Obter status do keep-alive
async function getKeepAliveStatus(userId: string) {
  try {
    const config = keepAliveConfigs.get(userId)
    const isActive = keepAliveIntervals.has(userId)
    
    return NextResponse.json({
      success: true,
      isActive,
      config: config || null
    })

  } catch (error) {
    console.error('❌ Erro ao obter status:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter status'
    }, { status: 500 })
  }
}

// Executar keep-alive para todas as instâncias do usuário
async function performKeepAlive(userId: string) {
  try {
    console.log(`💓 [KEEP-ALIVE] Executando keep-alive para usuário ${userId}`)

    // Buscar configuração da Evolution API
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    if (!configResponse.ok) {
      console.log(`❌ [KEEP-ALIVE] Erro ao buscar configuração: ${configResponse.status}`)
      return
    }

    const configData = await configResponse.json()
    
    if (!configData || configData.length === 0) {
      console.log(`❌ [KEEP-ALIVE] Configuração não encontrada para usuário ${userId}`)
      return
    }

    const { api_url, global_api_key } = configData[0]

    // Buscar instâncias do usuário no Supabase
    const userInstancesResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_instances?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userInstancesResponse.ok) {
      console.log(`❌ [KEEP-ALIVE] Erro ao buscar instâncias: ${userInstancesResponse.status}`)
      return
    }

    const userInstancesData = await userInstancesResponse.json()
    
    if (!userInstancesData || !Array.isArray(userInstancesData)) {
      console.log(`❌ [KEEP-ALIVE] Dados de instâncias inválidos`)
      return
    }

    // Executar keep-alive para cada instância
    for (const userInstance of userInstancesData) {
      await performInstanceKeepAlive(userId, userInstance.instance_name, api_url, global_api_key)
    }

    console.log(`✅ [KEEP-ALIVE] Keep-alive concluído para usuário ${userId}`)

  } catch (error) {
    console.error(`❌ [KEEP-ALIVE] Erro no keep-alive para usuário ${userId}:`, error)
  }
}

// Executar keep-alive para uma instância específica
async function performInstanceKeepAlive(userId: string, instanceName: string, apiUrl: string, apiKey: string) {
  const instanceKey = `${userId}_${instanceName}`
  
  try {
    console.log(`💓 [KEEP-ALIVE] Enviando ping para instância ${instanceName}`)

    // Enviar ping para manter a instância ativa
    const pingResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (pingResponse.ok) {
      const statusData = await pingResponse.json()
      const isConnected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
      
      instanceStatus.set(instanceKey, {
        instanceName,
        lastPing: new Date().toISOString(),
        status: isConnected ? 'active' : 'inactive',
        errorCount: 0
      })

      console.log(`✅ [KEEP-ALIVE] Ping enviado para ${instanceName} - Status: ${isConnected ? 'conectada' : 'desconectada'}`)

      // Se a instância estiver desconectada, tentar reconectar
      if (!isConnected) {
        console.log(`🔄 [KEEP-ALIVE] Tentando reconectar instância ${instanceName}`)
        await attemptReconnection(instanceName, apiUrl, apiKey)
      }
    } else {
      // Incrementar contador de erros
      const currentStatus = instanceStatus.get(instanceKey)
      const errorCount = (currentStatus?.errorCount || 0) + 1
      
      instanceStatus.set(instanceKey, {
        instanceName,
        lastPing: new Date().toISOString(),
        status: 'error',
        errorCount
      })

      console.log(`❌ [KEEP-ALIVE] Erro ao enviar ping para ${instanceName}: ${pingResponse.status} (${errorCount} tentativas)`)

      // Se muitos erros, tentar reconectar
      if (errorCount >= 3) {
        console.log(`🔄 [KEEP-ALIVE] Muitos erros, tentando reconectar ${instanceName}`)
        await attemptReconnection(instanceName, apiUrl, apiKey)
        
        // Resetar contador de erros após tentativa de reconexão
        instanceStatus.set(instanceKey, {
          instanceName,
          lastPing: new Date().toISOString(),
          status: 'active',
          errorCount: 0
        })
      }
    }

  } catch (error) {
    console.log(`❌ [KEEP-ALIVE] Erro ao executar keep-alive para ${instanceName}:`, error)
    
    const currentStatus = instanceStatus.get(instanceKey)
    const errorCount = (currentStatus?.errorCount || 0) + 1
    
    instanceStatus.set(instanceKey, {
      instanceName,
      lastPing: new Date().toISOString(),
      status: 'error',
      errorCount
    })
  }
}

// Tentar reconectar uma instância usando múltiplas estratégias
async function attemptReconnection(instanceName: string, apiUrl: string, apiKey: string) {
  try {
    console.log(`🔄 [KEEP-ALIVE] Tentando reconectar instância ${instanceName} com estratégias múltiplas`)

    // Estratégia 1: Tentar refresh de sessão
    console.log(`🔄 [KEEP-ALIVE] Estratégia 1: Refresh de sessão para ${instanceName}`)
    try {
      const refreshResponse = await fetch(`${apiUrl}/instance/refresh/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (refreshResponse.ok) {
        console.log(`✅ [KEEP-ALIVE] Refresh executado para ${instanceName}`)
        
        // Aguardar e verificar
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log(`✅ [KEEP-ALIVE] Reconexão por refresh bem-sucedida para ${instanceName}`)
            return true
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [KEEP-ALIVE] Erro no refresh para ${instanceName}:`, error instanceof Error ? error.message : String(error))
    }

    // Estratégia 2: Tentar reconnect forçado
    console.log(`🔄 [KEEP-ALIVE] Estratégia 2: Reconnect forçado para ${instanceName}`)
    try {
      const reconnectResponse = await fetch(`${apiUrl}/instance/reconnect/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (reconnectResponse.ok) {
        console.log(`✅ [KEEP-ALIVE] Reconnect forçado executado para ${instanceName}`)
        
        // Aguardar e verificar
        await new Promise(resolve => setTimeout(resolve, 4000))
        
        const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log(`✅ [KEEP-ALIVE] Reconexão forçada bem-sucedida para ${instanceName}`)
            return true
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [KEEP-ALIVE] Erro no reconnect forçado para ${instanceName}:`, error instanceof Error ? error.message : String(error))
    }

    // Estratégia 3: Tentar restart da instância
    console.log(`🔄 [KEEP-ALIVE] Estratégia 3: Restart para ${instanceName}`)
    try {
      const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (restartResponse.ok) {
        console.log(`✅ [KEEP-ALIVE] Restart executado para ${instanceName}`)
        
        // Aguardar mais tempo para o restart
        await new Promise(resolve => setTimeout(resolve, 8000))
        
        const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log(`✅ [KEEP-ALIVE] Reconexão por restart bem-sucedida para ${instanceName}`)
            return true
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [KEEP-ALIVE] Erro no restart para ${instanceName}:`, error instanceof Error ? error.message : String(error))
    }

    // Estratégia 4: Tentar logout/login automático
    console.log(`🔄 [KEEP-ALIVE] Estratégia 4: Logout/login automático para ${instanceName}`)
    try {
      // Logout
      const logoutResponse = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (logoutResponse.ok) {
        console.log(`✅ [KEEP-ALIVE] Logout executado para ${instanceName}`)
        
        // Aguardar logout
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Tentar conectar novamente
        const connectResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        })

        if (connectResponse.ok) {
          console.log(`✅ [KEEP-ALIVE] Tentativa de reconexão automática para ${instanceName}`)
          
          // Aguardar e verificar
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          })

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.instance?.state === 'open') {
              console.log(`✅ [KEEP-ALIVE] Reconexão automática bem-sucedida para ${instanceName}`)
              return true
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [KEEP-ALIVE] Erro no logout/login para ${instanceName}:`, error instanceof Error ? error.message : String(error))
    }

    console.log(`❌ [KEEP-ALIVE] Todas as estratégias falharam para ${instanceName}`)
    return false

  } catch (error) {
    console.log(`❌ [KEEP-ALIVE] Erro geral na reconexão para ${instanceName}:`, error)
    return false
  }
}
