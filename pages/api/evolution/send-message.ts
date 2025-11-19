import type { NextApiRequest, NextApiResponse } from 'next'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { instanceName, phoneNumber, message, userId } = req.body

    if (!instanceName || !phoneNumber || !message || !userId) {
      return res.status(200).json({ success: false, error: 'instanceName, phoneNumber, message e userId são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar configuração do usuário
    const config = await EvolutionConfigService.getConfig(userId)
    if (!config.success || !config.data) {
      return res.status(200).json({ success: false, error: 'Configuração da Evolution API não encontrada' },
        { status: 404 }
      )
    }

    const { api_url, global_api_key } = config.data

    // Validar se a URL está definida
    if (!api_url) {
      console.error('❌ api_url não está definida na configuração:', config.data)
      return res.status(200).json({
        success: false,
        error: 'URL da Evolution API não configurada. Configure em Configurações.'
      }, { status: 400 })
    }

    console.log(`🔧 URL da Evolution API: ${api_url}`)
    console.log(`🔑 API Key configurada: ${global_api_key ? 'Sim' : 'Não'}`)

    // Verificar se a instância está realmente conectada antes de enviar
    console.log(`🔍 Verificando conectividade da instância ${instanceName}...`)
    
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
        console.log(`📊 Status da instância ${instanceName}:`, statusData)

        if (statusData.instance?.state !== 'open') {
          console.error(`❌ Instância ${instanceName} não está conectada. Estado: ${statusData.instance?.state}`)
          return res.status(200).json({
            success: false,
            error: `A instância ${instanceName} não está conectada ao WhatsApp. Estado atual: ${statusData.instance?.state || 'desconhecido'}`
          }, { status: 400 })
        }
        console.log(`✅ Instância ${instanceName} está conectada, enviando mensagem...`)
      } else {
        console.log(`⚠️ Não foi possível verificar status da instância ${instanceName}, tentando enviar mensagem diretamente...`)
      }
    } catch (statusError) {
      console.log(`⚠️ Erro ao verificar status da instância ${instanceName}, tentando enviar mensagem diretamente:`, statusError instanceof Error ? statusError.message : String(statusError))
    }

    // Validar formato do número de telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      console.error(`❌ Número de telefone inválido: ${phoneNumber}`)
      return res.status(200).json({
        success: false,
        error: `Número de telefone inválido: ${phoneNumber}. Deve ter pelo menos 10 dígitos.`
      }, { status: 400 })
    }

    // Enviar mensagem via Evolution API (formato correto da documentação)
    console.log(`📱 Enviando mensagem para ${cleanPhone} via instância ${instanceName}`)
    console.log(`🔗 URL: ${api_url}/message/sendText/${instanceName}`)
    
    const response = await fetch(`${api_url}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': global_api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
        delay: 1200, // Delay padrão de 1.2 segundos
        linkPreview: true
      })
    })

    const data = await response.json()
    
    // Log detalhado da resposta
    console.log(`📡 Resposta Evolution API para ${instanceName}:`, {
      status: response.status,
      success: response.ok,
      data: data
    })

    if (response.ok) {
      console.log(`✅ Mensagem enviada com sucesso para ${phoneNumber}`)
      return res.status(200).json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: data
      })
    } else {
      console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, {
        status: response.status,
        error: data.message || data.error || 'Erro desconhecido',
        details: data
      })
      return res.status(200).json({
        success: false,
        error: data.message || data.error || 'Erro ao enviar mensagem',
        details: data
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao enviar mensagem via Evolution API:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}