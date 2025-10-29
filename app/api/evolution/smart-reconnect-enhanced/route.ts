import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase diretamente aqui para evitar problemas de cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const { instanceName, userId } = await request.json()

    if (!instanceName || !userId) {
      return NextResponse.json({ error: 'Instance name e User ID são obrigatórios' }, { status: 400 })
    }

    console.log(`🔄 Iniciando reconexão inteligente aprimorada para instância ${instanceName}`)

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

    // Estratégia 1: Verificar se já está conectada
    console.log('🔍 Estratégia 1: Verificando status atual...')
    try {
      const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        }
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log(`📊 Status atual da instância:`, statusData.instance?.state)
        
        if (statusData.instance?.state === 'open') {
          console.log('✅ Instância já está conectada!')
          return NextResponse.json({
            success: true,
            message: 'Instância já está conectada',
            strategy: 'already_connected',
            status: 'open',
            phoneNumber: statusData.instance?.phoneNumber
          })
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar status:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 2: Tentar refresh de token/sessão
    console.log('🔄 Estratégia 2: Tentando refresh de sessão...')
    try {
      const refreshResponse = await fetch(`${api_url}/instance/refresh/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        }
      })

      if (refreshResponse.ok) {
        console.log('✅ Refresh de sessão executado')
        
        // Aguardar e verificar se conectou
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log('✅ Reconexão por refresh bem-sucedida!')
            return NextResponse.json({
              success: true,
              message: 'Reconexão por refresh bem-sucedida',
              strategy: 'refresh_success',
              status: 'open',
              phoneNumber: statusData.instance?.phoneNumber
            })
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro no refresh:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 3: Tentar reconnect forçado
    console.log('🔄 Estratégia 3: Tentando reconnect forçado...')
    try {
      const reconnectResponse = await fetch(`${api_url}/instance/reconnect/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        }
      })

      if (reconnectResponse.ok) {
        console.log('✅ Reconnect forçado executado')
        
        // Aguardar e verificar se conectou
        await new Promise(resolve => setTimeout(resolve, 4000))
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log('✅ Reconexão forçada bem-sucedida!')
            return NextResponse.json({
              success: true,
              message: 'Reconexão forçada bem-sucedida',
              strategy: 'forced_reconnect_success',
              status: 'open',
              phoneNumber: statusData.instance?.phoneNumber
            })
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro no reconnect forçado:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 4: Tentar restart da instância
    console.log('🔄 Estratégia 4: Tentando restart da instância...')
    try {
      const restartResponse = await fetch(`${api_url}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        }
      })

      if (restartResponse.ok) {
        console.log('✅ Restart executado com sucesso')
        
        // Aguardar mais tempo para o restart
        await new Promise(resolve => setTimeout(resolve, 8000))
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log('✅ Reconexão por restart bem-sucedida!')
            return NextResponse.json({
              success: true,
              message: 'Reconexão por restart bem-sucedida',
              strategy: 'restart_success',
              status: 'open',
              phoneNumber: statusData.instance?.phoneNumber
            })
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro no restart:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 5: Tentar logout/login automático
    console.log('🔄 Estratégia 5: Tentando logout/login automático...')
    try {
      // Primeiro fazer logout
      const logoutResponse = await fetch(`${api_url}/instance/logout/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        }
      })

      if (logoutResponse.ok) {
        console.log('✅ Logout executado')
        
        // Aguardar logout
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Tentar conectar novamente
        const connectResponse = await fetch(`${api_url}/instance/connect/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (connectResponse.ok) {
          console.log('✅ Tentativa de reconexão automática')
          
          // Aguardar e verificar se conectou automaticamente
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': global_api_key,
              'Content-Type': 'application/json'
            }
          })

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.instance?.state === 'open') {
              console.log('✅ Reconexão automática bem-sucedida!')
              return NextResponse.json({
                success: true,
                message: 'Reconexão automática bem-sucedida',
                strategy: 'logout_login_success',
                status: 'open',
                phoneNumber: statusData.instance?.phoneNumber
              })
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro no logout/login:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 6: Tentar reconectar com QR Code existente
    console.log('🔄 Estratégia 6: Tentando reconectar com QR Code existente...')
    try {
      const connectResponse = await fetch(`${api_url}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': global_api_key
        }
      })

      if (connectResponse.ok) {
        const connectData = await connectResponse.json()
        console.log('📱 QR Code gerado para reconexão')
        
        // Aguardar um pouco e verificar se conectou automaticamente
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': global_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.instance?.state === 'open') {
            console.log('✅ Reconexão automática bem-sucedida!')
            return NextResponse.json({
              success: true,
              message: 'Reconexão automática bem-sucedida',
              strategy: 'auto_reconnect',
              status: 'open',
              phoneNumber: statusData.instance?.phoneNumber
            })
          } else {
            // Retornar QR Code para escaneamento manual
            console.log('📱 QR Code necessário para reconexão')
            return NextResponse.json({
              success: true,
              message: 'QR Code necessário para reconexão',
              strategy: 'qr_code_required',
              status: 'waiting_qr',
              qrCode: connectData.base64 || connectData.qrcode?.base64,
              requiresManualScan: true
            })
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro na reconexão:', error instanceof Error ? error.message : String(error))
    }

    // Estratégia 7: Último recurso - Gerar novo QR Code
    console.log('🔄 Estratégia 7: Gerando novo QR Code...')
    try {
      const qrResponse = await fetch(`${api_url}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': global_api_key
        }
      })

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        console.log('📱 Novo QR Code gerado')
        
        return NextResponse.json({
          success: true,
          message: 'Novo QR Code gerado - escaneamento necessário',
          strategy: 'new_qr_code',
          status: 'waiting_qr',
          qrCode: qrData.base64 || qrData.qrcode?.base64,
          requiresManualScan: true
        })
      }
    } catch (error) {
      console.log('⚠️ Erro ao gerar QR Code:', error instanceof Error ? error.message : String(error))
    }

    // Se todas as estratégias falharam
    console.log('❌ Todas as estratégias de reconexão falharam')
    return NextResponse.json({
      success: false,
      error: 'Não foi possível reconectar a instância',
      strategies_tried: ['status_check', 'refresh', 'forced_reconnect', 'restart', 'logout_login', 'reconnect', 'new_qr'],
      recommendation: 'A instância pode estar corrompida ou a sessão foi perdida completamente. Considere recriar a instância.'
    }, { status: 500 })

  } catch (error) {
    console.error('❌ Erro no smart-reconnect:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
