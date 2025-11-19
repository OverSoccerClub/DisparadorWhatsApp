import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase diretamente aqui para evitar problemas de cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { instanceName, userId } = req.body

    if (!instanceName || !userId) {
      return res.status(400).json({ error: 'Instance name e User ID são obrigatórios' })
    }

    console.log(`🔄 Iniciando reconexão inteligente para instância ${instanceName}`)

    // Buscar configuração da Evolution API
    const { data: configData, error: configError } = await supabase
      .from('evolution_configs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !configData) {
      return res.status(200).json({ 
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
          return res.status(200).json({
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

    // Estratégia 2: Tentar reconectar sem QR Code (restart)
    console.log('🔄 Estratégia 2: Tentando restart da instância...')
    try {
      const restartResponse = await fetch(`${api_url}/instance/restart/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': global_api_key
        }
      })

      if (restartResponse.ok) {
        const restartData = await restartResponse.json()
        console.log('✅ Restart executado com sucesso')
        
        // Aguardar um pouco e verificar se conectou
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
            console.log('✅ Reconexão por restart bem-sucedida!')
            return res.status(200).json({
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

    // Estratégia 3: Tentar reconectar com QR Code existente
    console.log('🔄 Estratégia 3: Tentando reconectar com QR Code existente...')
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
            return res.status(200).json({
              success: true,
              message: 'Reconexão automática bem-sucedida',
              strategy: 'auto_reconnect',
              status: 'open',
              phoneNumber: statusData.instance?.phoneNumber
            })
          } else {
            // Retornar QR Code para escaneamento manual
            console.log('📱 QR Code necessário para reconexão')
            return res.status(200).json({
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

    // Estratégia 4: Último recurso - Gerar novo QR Code
    console.log('🔄 Estratégia 4: Gerando novo QR Code...')
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
        
        return res.status(200).json({
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
    return res.status(200).json({
      success: false,
      error: 'Não foi possível reconectar a instância',
      strategies_tried: ['status_check', 'restart', 'reconnect', 'new_qr'],
      recommendation: 'Verifique a configuração da Evolution API ou tente novamente'
    }, { status: 500 })

  } catch (error) {
    console.error('❌ Erro na reconexão inteligente:', error)
    return res.status(200).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
}