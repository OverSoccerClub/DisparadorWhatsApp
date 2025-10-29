import { NextRequest, NextResponse } from 'next/server'

// Cache para armazenar configurações de monitoramento por usuário
const monitoringConfigs = new Map()

// Cache para armazenar intervalos de monitoramento
const monitoringIntervals = new Map()

// Configuração padrão de monitoramento
const defaultConfig = {
  intervalSeconds: 30,
  autoReconnect: true,
  isActive: false
}

// Interface para configuração de monitoramento
interface MonitoringConfig {
  intervalSeconds: number
  autoReconnect: boolean
  isActive: boolean
}

// Interface para status de instância
interface InstanceStatus {
  instanceName: string
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  phoneNumber?: string
  profileName?: string
  lastSeen?: string
  error?: string
}

// GET - Obter status do monitoramento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    console.log(`🔍 GET request - userId: ${userId}, action: ${action}`)

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    if (action === 'get_status') {
      const config = monitoringConfigs.get(userId) || defaultConfig
      const isActive = monitoringIntervals.has(userId)
      
      console.log(`📊 Status do monitoramento - isActive: ${isActive}`)
      
      return NextResponse.json({
        success: true,
        isActive,
        config: {
          intervalSeconds: config.intervalSeconds,
          autoReconnect: config.autoReconnect
        }
      })
    }

    console.log(`🔍 Buscando configuração para usuário ${userId}`)

    // Buscar configuração da Evolution API usando fetch direto
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 Config response status: ${configResponse.status}`)

    if (!configResponse.ok) {
      console.log(`❌ Erro ao buscar configuração: ${configResponse.status}`)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar configuração da Evolution API' 
      }, { status: 500 })
    }

    const configData = await configResponse.json()
    console.log(`📊 Config data: ${JSON.stringify(configData)}`)
    
    if (!configData || configData.length === 0) {
      console.log(`❌ Configuração não encontrada para usuário ${userId}`)
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração da Evolution API não encontrada' 
      }, { status: 404 })
    }

    const { api_url, global_api_key } = configData[0]
    console.log(`🔧 Usando configuração: { apiUrl: '${api_url}', globalApiKey: '***' }`)

    // Listar instâncias
    const instancesResponse = await fetch(`${api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': global_api_key,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 Instances response status: ${instancesResponse.status}`)

    if (!instancesResponse.ok) {
      console.log(`❌ Erro ao conectar com Evolution API: ${instancesResponse.status}`)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com Evolution API' 
      }, { status: 500 })
    }

    const instancesData = await instancesResponse.json()
    console.log(`📊 Instances data: ${JSON.stringify(instancesData)}`)
    
    if (!instancesData || !Array.isArray(instancesData)) {
      console.log(`❌ Dados de instâncias inválidos`)
      return NextResponse.json({ 
        success: false, 
        error: 'Dados de instâncias inválidos' 
      }, { status: 500 })
    }

    // Processar status das instâncias
    const instances: InstanceStatus[] = instancesData.map((instance: any) => {
      console.log(`📡 Status da instância: ${instance.instanceName} conectada: ${instance.connectionStatus}`)
      return {
        instanceName: instance.instanceName,
        connectionStatus: instance.connectionStatus || 'disconnected',
        phoneNumber: instance.phoneNumber,
        profileName: instance.profileName,
        lastSeen: instance.lastSeen,
        error: instance.error
      }
    })

    const connectedCount = instances.filter(i => i.connectionStatus === 'connected').length
    const disconnectedCount = instances.filter(i => i.connectionStatus === 'disconnected').length

    console.log(`📊 Status para usuário ${userId}: ${connectedCount} conectadas, ${disconnectedCount} desconectadas`)

    return NextResponse.json({
      success: true,
      instances,
      summary: {
        total: instances.length,
        connected: connectedCount,
        disconnected: disconnectedCount
      }
    })

  } catch (error) {
    console.error('❌ Erro no monitoramento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Controlar monitoramento
export async function POST(request: NextRequest) {
  try {
    const { userId, action, config } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    console.log(`🔄 Ação de background: ${action} para usuário ${userId}`)

    switch (action) {
      case 'start_monitoring':
        return await startMonitoring(userId, config)
      
      case 'stop_monitoring':
        return await stopMonitoring(userId)
      
      case 'get_status':
        return await getMonitoringStatus(userId)
      
      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erro no controle de monitoramento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Iniciar monitoramento
async function startMonitoring(userId: string, config?: Partial<MonitoringConfig>) {
  try {
    // Parar monitoramento existente se houver
    await stopMonitoring(userId)

    const monitoringConfig: MonitoringConfig = {
      ...defaultConfig,
      ...config,
      isActive: true
    }

    monitoringConfigs.set(userId, monitoringConfig)

    console.log(`🚀 Iniciando monitoramento em background para usuário ${userId}`)
    console.log(`⏰ Intervalo: ${monitoringConfig.intervalSeconds}s`)
    console.log(`🔄 Reconexão automática: ${monitoringConfig.autoReconnect ? 'Ativada' : 'Desativada'}`)

    // Iniciar intervalo de monitoramento
    const interval = setInterval(async () => {
      try {
        console.log(`⏰ Executando monitoramento agendado para usuário ${userId}`)
        await monitorInstancesBackground(userId)
      } catch (error) {
        console.error(`❌ Erro no monitoramento de background para usuário ${userId}:`, error)
      }
    }, monitoringConfig.intervalSeconds * 1000)

    monitoringIntervals.set(userId, interval)

    // Executar monitoramento imediatamente
    console.log(`🚀 Executando primeiro monitoramento imediato para usuário ${userId}`)
    try {
      await monitorInstancesBackground(userId)
    } catch (error) {
      console.error(`❌ Erro no monitoramento imediato para usuário ${userId}:`, error)
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoramento iniciado com sucesso',
      config: monitoringConfig
    })

  } catch (error) {
    console.error('❌ Erro ao iniciar monitoramento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar monitoramento'
    }, { status: 500 })
  }
}

// Parar monitoramento
async function stopMonitoring(userId: string) {
  try {
    const interval = monitoringIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      monitoringIntervals.delete(userId)
    }

    const config = monitoringConfigs.get(userId)
    if (config) {
      config.isActive = false
      monitoringConfigs.set(userId, config)
    }

    console.log(`🛑 Parando monitoramento em background para usuário ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Monitoramento parado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao parar monitoramento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar monitoramento'
    }, { status: 500 })
  }
}

// Obter status do monitoramento
async function getMonitoringStatus(userId: string) {
  try {
    const config = monitoringConfigs.get(userId) || defaultConfig
    const isActive = monitoringIntervals.has(userId)
    
    // Buscar instâncias do usuário para mostrar no status
    let instances: InstanceStatus[] = []
    let summary = { total: 0, connected: 0, disconnected: 0 }
    
    if (isActive) {
      try {
        // Buscar configuração da Evolution API
        const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          }
        })

        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData && configData.length > 0) {
            const { api_url, global_api_key } = configData[0]
            
            // Buscar instâncias do usuário no Supabase
            const userInstancesResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_instances?user_id=eq.${userId}&select=*`, {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              }
            })

            if (userInstancesResponse.ok) {
              const userInstancesData = await userInstancesResponse.json()
              
              if (userInstancesData && Array.isArray(userInstancesData)) {
                // Verificar status de cada instância
                for (const userInstance of userInstancesData) {
                  try {
                    const statusResponse = await fetch(`${api_url}/instance/connectionState/${userInstance.instance_name}`, {
                      method: 'GET',
                      headers: {
                        'apikey': global_api_key,
                        'Content-Type': 'application/json'
                      }
                    })

                    if (statusResponse.ok) {
                      const statusData = await statusResponse.json()
                      const isConnected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
                      
                      instances.push({
                        instanceName: userInstance.instance_name,
                        connectionStatus: isConnected ? 'connected' : 'disconnected',
                        phoneNumber: statusData.instance?.phoneNumber || userInstance.phone_number,
                        profileName: statusData.instance?.profileName || userInstance.profile_name,
                        lastSeen: statusData.instance?.lastSeen || userInstance.last_seen,
                        error: statusData.instance?.error || userInstance.error_message
                      })
                    }
                  } catch (error) {
                    // Ignorar erros individuais
                  }
                }
                
                const connectedCount = instances.filter(i => i.connectionStatus === 'connected').length
                const disconnectedCount = instances.filter(i => i.connectionStatus === 'disconnected').length
                
                summary = {
                  total: instances.length,
                  connected: connectedCount,
                  disconnected: disconnectedCount
                }
              }
            }
          }
        }
      } catch (error) {
        // Ignorar erros na busca de instâncias
      }
    }
    
    return NextResponse.json({
      success: true,
      isActive,
      config: {
        intervalSeconds: config.intervalSeconds,
        autoReconnect: config.autoReconnect
      },
      instances,
      summary
    })

  } catch (error) {
    console.error('❌ Erro ao obter status:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter status'
    }, { status: 500 })
  }
}

// Monitorar instâncias em background usando fetch direto
async function monitorInstancesBackground(userId: string) {
  try {
    console.log(`🔍 [BACKGROUND] Iniciando monitoramento para usuário ${userId}`)
    
    const config = monitoringConfigs.get(userId)
    console.log(`📊 [BACKGROUND] Config encontrada: ${JSON.stringify(config)}`)
    
    if (!config || !config.isActive) {
      console.log(`⚠️ [BACKGROUND] Configuração não encontrada ou inativa para usuário ${userId}`)
      console.log(`⚠️ [BACKGROUND] Config: ${config ? 'existe' : 'não existe'}`)
      console.log(`⚠️ [BACKGROUND] isActive: ${config?.isActive ? 'true' : 'false'}`)
      return
    }

    console.log(`🔍 [BACKGROUND] Monitoramento em background para usuário ${userId}`)

    // Buscar configuração da Evolution API usando fetch direto
    console.log(`🔍 [BACKGROUND] Buscando configuração para usuário ${userId}`)
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 [BACKGROUND] Config response status: ${configResponse.status}`)

    if (!configResponse.ok) {
      console.log(`❌ [BACKGROUND] Erro ao buscar configuração para usuário ${userId}: ${configResponse.status}`)
      return
    }

    const configData = await configResponse.json()
    console.log(`📊 [BACKGROUND] Config data: ${JSON.stringify(configData)}`)
    
    if (!configData || configData.length === 0) {
      console.log(`❌ [BACKGROUND] Configuração não encontrada para usuário ${userId}`)
      return
    }

    const { api_url, global_api_key } = configData[0]
    console.log(`🔧 [BACKGROUND] Usando configuração: { apiUrl: '${api_url}', globalApiKey: '***' }`)

    // Buscar instâncias do usuário no Supabase
    console.log(`🔍 [BACKGROUND] Buscando instâncias do usuário ${userId} no Supabase...`)
    const userInstancesResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_instances?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 [BACKGROUND] User instances response status: ${userInstancesResponse.status}`)

    if (!userInstancesResponse.ok) {
      console.log(`❌ [BACKGROUND] Erro ao buscar instâncias do usuário ${userId}: ${userInstancesResponse.status}`)
      return
    }

    const userInstancesData = await userInstancesResponse.json()
    console.log(`📊 [BACKGROUND] User instances data: ${JSON.stringify(userInstancesData)}`)
    
    if (!userInstancesData || !Array.isArray(userInstancesData) || userInstancesData.length === 0) {
      console.log(`❌ [BACKGROUND] Nenhuma instância encontrada para o usuário ${userId}`)
      return
    }

    // Buscar status de cada instância do usuário na Evolution API
    const instances: InstanceStatus[] = []
    
    for (const userInstance of userInstancesData) {
      try {
        console.log(`🔍 [BACKGROUND] Verificando status da instância ${userInstance.instance_name}...`)
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${userInstance.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const isConnected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
          
          console.log(`📡 [BACKGROUND] Status da instância: ${userInstance.instance_name} conectada: ${isConnected ? 'sim' : 'não'} (${statusData.instance?.state || statusData.instance?.connectionStatus || 'unknown'})`)
          
          instances.push({
            instanceName: userInstance.instance_name,
            connectionStatus: isConnected ? 'connected' : 'disconnected',
            phoneNumber: statusData.instance?.phoneNumber || userInstance.phone_number,
            profileName: statusData.instance?.profileName || userInstance.profile_name,
            lastSeen: statusData.instance?.lastSeen || userInstance.last_seen,
            error: statusData.instance?.error || userInstance.error_message
          })
        } else if (statusResponse.status === 404) {
          // Instância não existe mais na Evolution API - remover do Supabase
          console.log(`🗑️ [BACKGROUND] Instância ${userInstance.instance_name} não existe mais na Evolution API (404) - removendo do Supabase`)
          
          try {
            const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_instances?instance_name=eq.${userInstance.instance_name}&user_id=eq.${userId}`, {
              method: 'DELETE',
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (deleteResponse.ok) {
              console.log(`✅ [BACKGROUND] Instância ${userInstance.instance_name} removida do Supabase com sucesso`)
            } else {
              console.log(`❌ [BACKGROUND] Erro ao remover instância ${userInstance.instance_name} do Supabase: ${deleteResponse.status}`)
            }
          } catch (deleteError) {
            console.log(`❌ [BACKGROUND] Erro ao remover instância ${userInstance.instance_name} do Supabase:`, deleteError)
          }
        } else {
          console.log(`⚠️ [BACKGROUND] Erro ao verificar status da instância ${userInstance.instance_name}: ${statusResponse.status}`)
          instances.push({
            instanceName: userInstance.instance_name,
            connectionStatus: 'disconnected',
            phoneNumber: userInstance.phone_number,
            profileName: userInstance.profile_name,
            lastSeen: userInstance.last_seen,
            error: `Erro ao verificar status: ${statusResponse.status}`
          })
        }
      } catch (error) {
        console.log(`❌ [BACKGROUND] Erro ao verificar instância ${userInstance.instance_name}:`, error)
        instances.push({
          instanceName: userInstance.instance_name,
          connectionStatus: 'disconnected',
          phoneNumber: userInstance.phone_number,
          profileName: userInstance.profile_name,
          lastSeen: userInstance.last_seen,
          error: `Erro: ${error}`
        })
      }
    }

    const connectedCount = instances.filter(i => i.connectionStatus === 'connected').length
    const disconnectedCount = instances.filter(i => i.connectionStatus === 'disconnected').length
    const removedCount = userInstancesData.length - instances.length

    console.log(`📊 [BACKGROUND] Status para usuário ${userId}: ${connectedCount} conectadas, ${disconnectedCount} desconectadas`)
    if (removedCount > 0) {
      console.log(`🗑️ [BACKGROUND] ${removedCount} instâncias removidas do Supabase (não existem mais na Evolution API)`)
    }

    // Se reconexão automática estiver ativada, tentar reconectar instâncias desconectadas
    if (config.autoReconnect && disconnectedCount > 0) {
      console.log(`🔄 Tentando reconectar ${disconnectedCount} instâncias desconectadas...`)
      
      for (const instance of instances.filter(i => i.connectionStatus === 'disconnected')) {
        try {
          await reconnectInstance(api_url, global_api_key, instance.instanceName)
        } catch (error) {
          console.log(`❌ Erro ao reconectar ${instance.instanceName}:`, error)
        }
      }
    }

    console.log(`✅ [BACKGROUND] Monitoramento concluído para usuário ${userId}`)

  } catch (error) {
    console.error(`❌ [BACKGROUND] Erro no monitoramento de background para usuário ${userId}:`, error)
  }
}

// Reconectar instância
async function reconnectInstance(apiUrl: string, apiKey: string, instanceName: string) {
  try {
    console.log(`🔄 Tentando reconectar instância ${instanceName}...`)

    // Tentar restart da instância
    const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (restartResponse.ok) {
      console.log(`✅ Instância ${instanceName} reiniciada com sucesso`)
    } else {
      console.log(`❌ Falha ao reiniciar instância ${instanceName}`)
    }

  } catch (error) {
    console.log(`❌ Erro ao reconectar instância ${instanceName}:`, error)
  }
}
