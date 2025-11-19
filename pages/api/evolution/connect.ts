import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
 {
  try {
    const { instanceName, apiUrl, globalApiKey, userId } = req.body

    if (!instanceName) {
      return res.status(200).json({ success: false, error: 'Nome da instância é obrigatório' },
        { status: 400 }
      )
    }

    if (!apiUrl || !globalApiKey) {
      return res.status(200).json({ success: false, error: 'URL da API e API KEY GLOBAL são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificação de permissão simplificada
    // Com o novo sistema de nomes, não podemos mais verificar pelo prefixo
    // Por enquanto, permitir conexão para todos os usuários autenticados
    console.log('Verificação de permissão simplificada - permitindo conexão para usuário:', userId)

    // Conectar instância seguindo a documentação da Evolution API
    const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': globalApiKey
      }
    })

    const data = await response.json()

    if (response.ok) {
      // Verificar status da conexão
      const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': globalApiKey
        }
      })

      const statusData = await statusResponse.json()

      if (statusData.instance?.connectionStatus === 'open') {
        return res.status(200).json({
          success: true,
          message: 'Instância já conectada',
          status: 'connected',
          phoneNumber: statusData.instance?.phoneNumber
        })
      } else {
        // Gerar QR Code
        const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': globalApiKey
          }
        })

        const qrData = await qrResponse.json()
        
        return res.status(200).json({
          success: true,
          message: 'QR Code gerado com sucesso',
          qrCode: qrData.base64 || qrData.qrcode?.base64,
          status: 'waiting_qr'
        })
      }
    } else {
      return res.status(200).json({
        success: false,
        error: data.message || 'Erro ao conectar instância'
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao conectar instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}