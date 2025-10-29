import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase diretamente aqui para evitar problemas de cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    console.log(`🔍 Monitorando instâncias para usuário: ${userId}`)

    // Buscar configuração da Evolution API
    const { data: configData, error: configError } = await supabase
      .from('evolution_configs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !configData) {
      console.log('❌ Configuração não encontrada para o usuário')
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração da Evolution API não encontrada' 
      }, { status: 404 })
    }

    const { api_url, global_api_key } = configData

    // Listar instâncias da Evolution API
    const response = await fetch(`${api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': global_api_key,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar instâncias da Evolution API:', response.status)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com Evolution API' 
      }, { status: 500 })
    }

    const data = await response.json()
    console.log('📊 Instâncias encontradas na Evolution API:', data.length)

    // Processar instâncias
    const instances = data.map((instance: any) => ({
      instanceName: instance.name,
      connectionStatus: instance.connectionStatus,
      phoneNumber: instance.ownerJid ? instance.ownerJid.split('@')[0] : null,
      lastSeen: instance.updatedAt,
      profileName: instance.profileName,
      createdAt: instance.createdAt,
      state: instance.state
    }))

    // Verificar status detalhado de cada instância
    const instancesWithStatus = await Promise.all(
      instances.map(async (instance: any) => {
        try {
          const statusResponse = await fetch(`${api_url}/instance/connectionState/${instance.instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': global_api_key,
              'Content-Type': 'application/json'
            }
          })

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            return {
              ...instance,
              connectionStatus: statusData.instance?.state || instance.connectionStatus,
              phoneNumber: statusData.instance?.ownerJid ? statusData.instance.ownerJid.split('@')[0] : instance.phoneNumber,
              lastSeen: statusData.instance?.lastSeen || instance.lastSeen,
              profileName: statusData.instance?.profileName || instance.profileName,
              isConnected: statusData.instance?.state === 'open'
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar status da instância ${instance.instanceName}:`, error)
        }

        return {
          ...instance,
          isConnected: false
        }
      })
    )

    // Filtrar instâncias do usuário (baseado no prefixo)
    const userPrefix = `user_${userId.split('_')[1] || userId}`
    const userInstances = instancesWithStatus.filter(instance => 
      instance.instanceName.startsWith(userPrefix)
    )

    console.log(`📊 Instâncias do usuário ${userId}:`, userInstances.length)
    console.log(`📊 Instâncias conectadas:`, userInstances.filter(i => i.isConnected).length)

    return NextResponse.json({
      success: true,
      instances: userInstances,
      totalInstances: userInstances.length,
      connectedInstances: userInstances.filter(i => i.isConnected).length,
      disconnectedInstances: userInstances.filter(i => !i.isConnected).length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no monitoramento de instâncias:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { instanceName, userId, action } = await request.json()

    if (!instanceName || !userId) {
      return NextResponse.json({ error: 'Instance name e User ID são obrigatórios' }, { status: 400 })
    }

    console.log(`🔄 Ação ${action} na instância ${instanceName} para usuário ${userId}`)

    // Buscar configuração da Evolution API
    const { data: configData, error: configError } = await supabase
      .from('evolution_configs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !configData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração da Evolution API não encontrada' 
      }, { status: 404 })
    }

    const { api_url, global_api_key } = configData

    let response
    let endpoint

    switch (action) {
      case 'reconnect':
        endpoint = `${api_url}/instance/connect/${instanceName}`
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': global_api_key
          }
        })
        break

      case 'disconnect':
        endpoint = `${api_url}/instance/logout/${instanceName}`
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'apikey': global_api_key
          }
        })
        break

      case 'restart':
        endpoint = `${api_url}/instance/restart/${instanceName}`
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': global_api_key
          }
        })
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Ação não suportada' 
        }, { status: 400 })
    }

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ Ação ${action} executada com sucesso na instância ${instanceName}`)
      return NextResponse.json({
        success: true,
        message: `Ação ${action} executada com sucesso`,
        data
      })
    } else {
      console.log(`❌ Falha na ação ${action} na instância ${instanceName}:`, data)
      return NextResponse.json({
        success: false,
        error: data.message || `Falha na ação ${action}`,
        data
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erro na ação de monitoramento:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
