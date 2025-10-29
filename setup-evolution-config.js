/**
 * Script para configurar a Evolution API
 */

const setupEvolutionConfig = async () => {
  console.log('🔧 Configurando Evolution API...\n')

  try {
    // Configurar a Evolution API
    console.log('📝 Configurando Evolution API...')
    
    const configResponse = await fetch('http://localhost:3000/api/evolution/save-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: '92648299-39f8-48d6-957b-65b72091339d',
        apiUrl: 'https://evolution.analome.com.br',
        globalApiKey: 'sua_api_key_aqui', // Substitua pela sua API key real
        webhookUrl: 'https://seu-webhook.com.br'
      })
    })

    const configData = await configResponse.json()
    console.log('📊 Resultado da configuração:')
    console.log(`Status: ${configResponse.status}`)
    console.log(`Success: ${configData.success}`)
    console.log(`Message: ${configData.message || 'Nenhuma mensagem'}`)
    console.log(`Error: ${configData.error || 'Nenhum erro'}`)

    if (configData.success) {
      console.log('✅ Configuração salva com sucesso!')
    } else {
      console.log('❌ Erro ao salvar configuração:', configData.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Verificar se a configuração foi salva
    console.log('🔍 Verificando configuração salva...')
    
    const checkResponse = await fetch('http://localhost:3000/api/evolution/save-config?userId=92648299-39f8-48d6-957b-65b72091339d', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const checkData = await checkResponse.json()
    console.log('📋 Configuração verificada:')
    console.log(`Status: ${checkResponse.status}`)
    console.log(`Success: ${checkData.success}`)
    console.log(`Data: ${JSON.stringify(checkData.data || {}, null, 2)}`)

    if (checkData.success && checkData.data) {
      console.log('✅ Configuração encontrada!')
      console.log(`URL: ${checkData.data.api_url}`)
      console.log(`API Key: ${checkData.data.global_api_key ? 'Configurada' : 'Não configurada'}`)
    } else {
      console.log('❌ Configuração não encontrada')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste da Evolution API
    console.log('📡 Testando Evolution API...')
    
    const testResponse = await fetch('http://localhost:3000/api/evolution/send-message', {
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

    const testData = await testResponse.json()
    console.log('📊 Resultado do teste:')
    console.log(`Status: ${testResponse.status}`)
    console.log(`Success: ${testData.success}`)
    console.log(`Error: ${testData.error || 'Nenhum erro'}`)

    if (testData.success) {
      console.log('✅ Evolution API funcionando perfeitamente!')
    } else if (testData.error?.includes('URL da Evolution API não configurada')) {
      console.log('❌ AINDA HÁ PROBLEMA: URL não configurada')
    } else {
      console.log('⚠️ Evolution API com problema, mas URL está configurada')
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 INSTRUÇÕES:')
    console.log('1. ✅ Configure a URL da Evolution API')
    console.log('2. ✅ Configure a API Key real')
    console.log('3. ✅ Teste o sistema de disparos')
    console.log('4. ✅ Configure as instâncias WhatsApp')

  } catch (error) {
    console.error('❌ Erro no setup:', error.message)
  }
}

// Executar setup
setupEvolutionConfig()
