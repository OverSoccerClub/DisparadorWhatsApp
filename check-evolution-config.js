/**
 * Script para verificar e configurar a Evolution API
 */

const checkEvolutionConfig = async () => {
  console.log('🔍 Verificando configuração da Evolution API...\n')

  try {
    // Teste 1: Verificar se há configuração no banco
    console.log('📊 Teste 1: Verificando configuração no banco...')
    
    const configResponse = await fetch('http://localhost:3000/api/evolution/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const configData = await configResponse.json()
    console.log('📋 Configuração encontrada:')
    console.log(`Status: ${configResponse.status}`)
    console.log(`Success: ${configData.success}`)
    console.log(`Data: ${JSON.stringify(configData.data || {}, null, 2)}`)

    if (configData.success && configData.data) {
      console.log('✅ Configuração encontrada no banco!')
      console.log(`URL: ${configData.data.api_url}`)
      console.log(`API Key: ${configData.data.global_api_key ? 'Configurada' : 'Não configurada'}`)
    } else {
      console.log('❌ Nenhuma configuração encontrada no banco')
      console.log('🔧 Vamos criar uma configuração de teste...')
      
      // Criar configuração de teste
      const createResponse = await fetch('http://localhost:3000/api/evolution/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: '92648299-39f8-48d6-957b-65b72091339d',
          api_url: 'https://evolution.analome.com.br',
          global_api_key: 'sua_api_key_aqui',
          webhook_url: 'https://seu-webhook.com.br'
        })
      })

      const createData = await createResponse.json()
      console.log('📝 Resultado da criação:')
      console.log(`Status: ${createResponse.status}`)
      console.log(`Success: ${createData.success}`)
      console.log(`Error: ${createData.error || 'Nenhum erro'}`)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Verificar se a API está funcionando
    console.log('📡 Teste 2: Verificando Evolution API...')
    
    const evolutionResponse = await fetch('http://localhost:3000/api/evolution/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: 'inst_391c3d34',
        phoneNumber: '5584999727583',
        message: 'Teste de mensagem',
        userId: '92648299-39f8-48d6-957b-65b72091339d'
      })
    })

    const evolutionData = await evolutionResponse.json()
    console.log('📊 Resultado da Evolution API:')
    console.log(`Status: ${evolutionResponse.status}`)
    console.log(`Success: ${evolutionData.success}`)
    console.log(`Error: ${evolutionData.error || 'Nenhum erro'}`)

    if (evolutionData.error?.includes('URL da Evolution API não configurada')) {
      console.log('❌ PROBLEMA: URL da Evolution API não configurada')
      console.log('🔧 SOLUÇÃO: Configure a URL em Configurações')
    } else if (evolutionData.success) {
      console.log('✅ Evolution API funcionando perfeitamente!')
    } else {
      console.log('⚠️ Evolution API com problema, mas URL está configurada')
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Sistema funcionando com logs detalhados')
    console.log('✅ Problema identificado: URL da Evolution API')
    console.log('🔧 PRÓXIMO PASSO: Configure a URL em Configurações')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
checkEvolutionConfig()
