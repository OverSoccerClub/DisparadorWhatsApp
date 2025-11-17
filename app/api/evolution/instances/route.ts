import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Usar autenticação Supabase
    const cookieStore = await cookies()
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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('🔍 Buscando instâncias para usuário:', userId)
    
    // Buscar instâncias do usuário no Supabase
    const result = await EvolutionConfigService.getUserInstances(userId)
    console.log('📊 Resultado do Supabase:', result)
    
    if (result.success && result.data && result.data.length > 0) {
      console.log('✅ Instâncias encontradas:', result.data.length)
      
      // Processar instâncias e verificar status
      const instancesWithStatus = await Promise.all(
        result.data.map(async (instance) => {
          console.log('🔄 Processando instância:', instance.instance_name)
          
          // Buscar configuração do usuário para verificar status
          try {
            const configResult = await EvolutionConfigService.getConfig(userId)
            console.log('🔧 Configuração encontrada:', configResult)
            
            if (configResult.success && configResult.data) {
              const { api_url: apiUrl, global_api_key: globalApiKey } = configResult.data
              console.log('🔧 Usando configuração:', { apiUrl, globalApiKey: globalApiKey ? '***' : 'null' })
              
              // Verificar status da instância na Evolution API
              const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instance.instance_name}`, {
                method: 'GET',
                headers: {
                  'apikey': globalApiKey
                }
              })
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                const connected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
                const status = statusData.instance?.state || statusData.instance?.connectionStatus || 'disconnected'
                
                console.log('📡 Status da instância:', instance.instance_name, 'conectada:', connected)
                
                // Se conectado, buscar informações do perfil
                let profileData = null
                if (connected) {
                  try {
                    // Tentar buscar perfil usando o endpoint correto
                    const profileResponse = await fetch(`${apiUrl}/instance/fetchInstances?instanceName=${instance.instance_name}`, {
                      method: 'GET',
                      headers: {
                        'apikey': globalApiKey
                      }
                    })
                    
                    if (profileResponse.ok) {
                      const profileResult = await profileResponse.json()
                      const instances = profileResult.data || profileResult
                      
                      if (Array.isArray(instances)) {
                        const instanceData = instances.find(inst => 
                          inst.name === instance.instance_name
                        ) || instances[0]
                        
                        if (instanceData) {
                          profileData = {
                            userName: instanceData.profileName,
                            userPhone: instanceData.ownerJid?.split('@')[0],
                            userAvatar: instanceData.profilePicUrl,
                            userStatus: instanceData.profileStatus
                          }
                          console.log('👤 Perfil encontrado:', profileData.userName)
                        }
                      }
                    }
                  } catch (profileError) {
                    console.log('⚠️ Erro ao buscar perfil:', profileError)
                  }
                }
                
                return {
                  instanceName: instance.instance_name,
                  connectionStatus: connected ? 'connected' : 'disconnected',
                  phoneNumber: statusData.instance?.phoneNumber || instance.phone_number,
                  lastSeen: statusData.instance?.lastSeen || instance.last_seen,
                  createdAt: instance.created_at,
                  profile: profileData
                }
              }
            }
          } catch (error) {
            console.log('⚠️ Erro ao verificar status da instância:', error)
          }
          
          // Retornar dados básicos se não conseguir verificar status
          return {
            instanceName: instance.instance_name,
            connectionStatus: instance.connection_status === 'open' ? 'connected' : 'disconnected',
            phoneNumber: instance.phone_number,
            lastSeen: instance.last_seen,
            createdAt: instance.created_at,
            profile: null
          }
        })
      )
      
      console.log('✅ Retornando instâncias processadas:', instancesWithStatus.length)
      return NextResponse.json({
        success: true,
        message: 'Instâncias carregadas com sucesso',
        data: instancesWithStatus
      })
    } else {
      console.log('⚠️ Nenhuma instância encontrada para o usuário:', userId)
      return NextResponse.json({
        success: true,
        message: 'Nenhuma instância encontrada',
        data: []
      })
    }
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar instâncias',
      data: []
    }, { status: 500 })
  }
}