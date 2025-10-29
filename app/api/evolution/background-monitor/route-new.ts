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

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    if (action === 'get_status') {
      const config = monitoringConfigs.get(userId) || defaultConfig
      const isActive = monitoringIntervals.has(userId)
      
      return NextResponse.json({
        success: true,
        isActive,
        config: {
          intervalSeconds: config.intervalSeconds,
          autoReconnect: config.autoReconnect
        }
      })
    }

    // Buscar configuração da Evolution API usando fetch direto
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    if (!configResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar configuração da Evolution API' 
      }, { status: 500 })
    }

    const configData = await configResponse.json()
    
    if (!configData || configData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração da Evolution API não encontrada' 
      }, { status: 404 })
    }

    const { api_url, global_api_key } = configData[0]

    // Listar instâncias
    const instancesResponse = await fetch(`${api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': global_api_key,
        'Content-Type': 'application/json'
      }
    })

    if (!instancesResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com Evolution API' 
      }, { status: 500 })
    }

    const instancesData = await instancesResponse.json()
    
    if (!instancesData || !Array.isArray(instancesData)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados de instâncias inválidos' 
      }, { status: 500 })
    }

    // Processar status das instâncias
    const instances: InstanceStatus[] = instancesData.map((instance: any) => ({
      instanceName: instance.instanceName,
      connectionStatus: instance.connectionStatus || 'disconnected',
      phoneNumber: instance.phoneNumber,
      profileName: instance.profileName,
      lastSeen: instance.lastSeen,
      error: instance.error
    }))

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
        await monitorInstancesBackground(userId)
      } catch (error) {
        console.error(`❌ Erro no monitoramento de background para usuário ${userId}:`, error)
      }
    }, monitoringConfig.intervalSeconds * 1000)

    monitoringIntervals.set(userId, interval)

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

    return NextResponse.json({
      success: true,
      isActive,
      config: {
        intervalSeconds: config.intervalSeconds,
        autoReconnect: config.autoReconnect
      }
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
    const config = monitoringConfigs.get(userId)
    if (!config || !config.isActive) {
      return
    }

    console.log(`🔍 Monitoramento em background para usuário ${userId}`)

    // Buscar configuração da Evolution API usando fetch direto
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evolution_configs?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })

    if (!configResponse.ok) {
      console.log(`❌ Erro ao buscar configuração para usuário ${userId}`)
      return
    }

    const configData = await configResponse.json()
    
    if (!configData || configData.length === 0) {
      console.log(`❌ Configuração não encontrada para usuário ${userId}`)
      return
    }

    const { api_url, global_api_key } = configData[0]

    // Listar instâncias
    const instancesResponse = await fetch(`${api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': global_api_key,
        'Content-Type': 'application/json'
      }
    })

    if (!instancesResponse.ok) {
      console.log(`❌ Erro ao conectar com Evolution API para usuário ${userId}`)
      return
    }

    const instancesData = await instancesResponse.json()
    
    if (!instancesData || !Array.isArray(instancesData)) {
      console.log(`❌ Dados de instâncias inválidos para usuário ${userId}`)
      return
    }

    // Processar status das instâncias
    const instances: InstanceStatus[] = instancesData.map((instance: any) => ({
      instanceName: instance.instanceName,
      connectionStatus: instance.connectionStatus || 'disconnected',
      phoneNumber: instance.phoneNumber,
      profileName: instance.profileName,
      lastSeen: instance.lastSeen,
      error: instance.error
    }))

    const connectedCount = instances.filter(i => i.connectionStatus === 'connected').length
    const disconnectedCount = instances.filter(i => i.connectionStatus === 'disconnected').length

    console.log(`📊 Status para usuário ${userId}: ${connectedCount} conectadas, ${disconnectedCount} desconectadas`)

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

  } catch (error) {
    console.error(`❌ Erro no monitoramento de background para usuário ${userId}:`, error)
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
