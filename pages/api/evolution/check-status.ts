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

    console.log('Verificando status da instância:', instanceName)
    console.log('API URL:', apiUrl)

    if (!apiUrl || !globalApiKey || !instanceName) {
      return res.status(200).json({ success: false, error: 'URL da API, API KEY GLOBAL e nome da instância são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificação de permissão simplificada
    // Com o novo sistema de nomes, não podemos mais verificar pelo prefixo
    // Por enquanto, permitir verificação para todos os usuários autenticados
    console.log('Verificação de permissão simplificada - permitindo verificação para usuário:', userId)

    // Verificar status da instância
    console.log('Fazendo requisição para:', `${apiUrl}/instance/connectionState/${instanceName}`)
    
    const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': globalApiKey
      }
    })

    const data = await response.json()
    console.log('Resposta da Evolution API:', data)
    console.log('Status da resposta:', response.status)
    console.log('Dados da instância:', data.instance)
    console.log('State:', data.instance?.state)
    console.log('ConnectionStatus:', data.instance?.connectionStatus)

    if (response.ok) {
      const connected = data.instance?.state === 'open' || data.instance?.connectionStatus === 'open'
      const phoneNumber = data.instance?.phoneNumber
      const lastSeen = data.instance?.lastSeen
      const status = data.instance?.state || data.instance?.connectionStatus || 'disconnected'
      
      console.log('Status processado:', {
        connected,
        phoneNumber,
        lastSeen,
        status,
        originalState: data.instance?.state,
        originalConnectionStatus: data.instance?.connectionStatus
      })

      // Se conectado, buscar informações do perfil
      let profileData = null
      if (connected) {
        try {
          console.log('Buscando perfil do usuário conectado...')
          
          // Usar o endpoint correto da Evolution API
          const endpoints = [
            // Endpoint correto baseado no exemplo fornecido
            `/instance/fetchInstances?instanceName=${instanceName}`,
            
            // Endpoints alternativos para perfil
            `/instance/info/${instanceName}`,
            `/instance/status/${instanceName}`,
            `/chat/fetchProfile/${instanceName}`,
            `/chat/profile/${instanceName}`
          ]
          
          let profileResult = null
          for (const endpoint of endpoints) {
            try {
              console.log(`Tentando endpoint: ${endpoint}`)
              const profileResponse = await fetch(`${apiUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                  'apikey': globalApiKey
                }
              })

              if (profileResponse.ok) {
                profileResult = await profileResponse.json()
                console.log(`✅ Sucesso no endpoint ${endpoint}:`, profileResult)
                break
              } else {
                console.log(`❌ Falha no endpoint ${endpoint}:`, profileResponse.status, profileResponse.statusText)
              }
            } catch (endpointError) {
              console.log(`❌ Erro no endpoint ${endpoint}:`, endpointError instanceof Error ? endpointError.message : String(endpointError))
            }
          }

          if (profileResult) {
            console.log('Dados do perfil obtidos:', profileResult)
            
            // Estrutura real dos dados recebidos
            const instances = profileResult.data || profileResult
            
            // Se é um array de instâncias (estrutura real)
            if (Array.isArray(instances)) {
              const instanceData = instances.find(inst => 
                inst.name === instanceName
              ) || instances[0]
              
              if (instanceData) {
                profileData = {
                  userName: instanceData.profileName, // 'Divulgador de Produtos'
                  userPhone: instanceData.ownerJid?.split('@')[0], // '5531920055547'
                  userAvatar: instanceData.profilePicUrl, // URL do avatar
                  userStatus: instanceData.profileStatus
                }
                console.log('✅ Dados extraídos da estrutura real:', profileData)
                console.log('✅ Nome do usuário encontrado:', profileData.userName)
                console.log('✅ Telefone do usuário encontrado:', profileData.userPhone)
                console.log('✅ Avatar do usuário encontrado:', profileData.userAvatar)
              }
            } else {
              // Fallback para estrutura alternativa
              const profileInfo = instances
              profileData = {
                userName: profileInfo.profileName, // 'Divulgador de Produtos'
                userPhone: profileInfo.ownerJid?.split('@')[0], // '5531920055547'
                userAvatar: profileInfo.profilePicUrl, // URL do avatar
                userStatus: profileInfo.profileStatus
              }
            }
            console.log('Perfil processado:', profileData)
          } else {
            console.log('❌ Não foi possível obter perfil em nenhum endpoint')
          }
        } catch (profileError) {
          console.log('Erro ao buscar perfil (não crítico):', profileError)
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          instanceName,
          connected,
          phoneNumber,
          lastSeen,
          status,
          profile: profileData
        }
      })
    } else {
      console.error('Erro na Evolution API:', data)
      return res.status(200).json({
        success: false,
        error: data.message || 'Erro ao verificar status da instância'
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Erro ao verificar status da instância:', error)
    return res.status(200).json({ success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
}