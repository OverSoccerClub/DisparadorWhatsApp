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
    const { apiUrl, globalApiKey, instanceName, userId } = req.body

    console.log('Buscando perfil do usuário para instância:', instanceName)
    console.log('API URL:', apiUrl)

    if (!apiUrl || !globalApiKey || !instanceName) {
      return res.status(200).json({ success: false, error: 'URL da API, API KEY GLOBAL e nome da instância são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificação de permissão simplificada
    console.log('Verificação de permissão simplificada - permitindo busca de perfil para usuário:', userId)

    // Buscar informações do perfil do usuário conectado
    console.log('Fazendo requisição para:', `${apiUrl}/chat/fetchProfile/${instanceName}`)
    
    const response = await fetch(`${apiUrl}/chat/fetchProfile/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': globalApiKey
      }
    })

    const data = await response.json()
    console.log('Resposta da Evolution API para perfil:', data)
    console.log('Status da resposta:', response.status)

    if (response.ok) {
      // Extrair informações do perfil
      const profileData = data.data || data
      const userName = profileData.name || profileData.pushName || profileData.notifyName
      const userPhone = profileData.id || profileData.phoneNumber
      const userAvatar = profileData.avatar || profileData.profilePictureUrl
      const userStatus = profileData.status || profileData.about
      
      console.log('Dados do perfil processados:', {
        userName,
        userPhone,
        userAvatar,
        userStatus
      })
      
      return res.status(200).json({
        success: true,
        data: {
          instanceName,
          userName,
          userPhone,
          userAvatar,
          userStatus,
          rawData: profileData // Incluir dados brutos para debug
        }
      })
    } else {
      console.error('Erro na Evolution API ao buscar perfil:', data)
      return res.status(200).json({
        success: false,
        error: data.message || 'Erro ao buscar perfil do usuário',
        details: data
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}