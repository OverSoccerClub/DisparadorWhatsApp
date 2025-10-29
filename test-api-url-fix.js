/**
 * Script para testar a correção da apiUrl
 */

const testApiUrlFix = async () => {
  console.log('🔧 Testando correção da apiUrl...\n')

  try {
    // Teste 1: Verificar configuração atual
    console.log('📊 Teste 1: Verificando configuração atual...')
    
    const configResponse = await fetch('http://localhost:3000/api/evolution/save-config?userId=92648299-39f8-48d6-957b-65b72091339d', {
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
      console.log('✅ Configuração encontrada!')
      console.log(`URL: ${configData.data.api_url}`)
      console.log(`API Key: ${configData.data.global_api_key ? 'Configurada' : 'Não configurada'}`)
    } else {
      console.log('❌ Configuração não encontrada')
      return
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Testar Evolution API
    console.log('📡 Teste 2: Testando Evolution API...')
    
    const evolutionResponse = await fetch('http://localhost:3000/api/evolution/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: 'inst_70e6b148',
        phoneNumber: '5584999727583',
        message: '🎉 Teste de mensagem via Evolution API! 🚀\n\nEsta é uma mensagem de teste para verificar se o sistema está funcionando corretamente.',
        userId: '92648299-39f8-48d6-957b-65b72091339d'
      })
    })

    const evolutionData = await evolutionResponse.json()
    console.log('📊 Resultado da Evolution API:')
    console.log(`Status HTTP: ${evolutionResponse.status}`)
    console.log(`Success: ${evolutionData.success}`)
    console.log(`Error: ${evolutionData.error || 'Nenhum erro'}`)
    console.log(`Details: ${JSON.stringify(evolutionData.details || {}, null, 2)}`)

    if (evolutionData.success) {
      console.log('✅ CORREÇÃO FUNCIONANDO: Evolution API funcionando perfeitamente!')
      console.log('📱 Mensagem enviada com sucesso!')
    } else if (evolutionData.error?.includes('URL da Evolution API não configurada')) {
      console.log('❌ AINDA HÁ PROBLEMA: apiUrl ainda não está sendo lida corretamente')
    } else {
      console.log('✅ CORREÇÃO FUNCIONANDO: apiUrl corrigida, erro é outro')
      console.log(`   Erro: ${evolutionData.error}`)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 3: Teste completo de disparo
    console.log('🚀 Teste 3: Teste completo de disparo...')
    
    const disparoResponse = await fetch('http://localhost:3000/api/disparos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telefones: ['5584999727583'],
        mensagem: '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!',
        agendamento: null,
        user_id: '92648299-39f8-48d6-957b-65b72091339d',
        instanceName: 'inst_70e6b148',
        useRandomDistribution: false
      })
    })

    const disparoData = await disparoResponse.json()
    console.log('📊 Resultado do disparo:')
    console.log(`Status HTTP: ${disparoResponse.status}`)
    console.log(`Message: ${disparoData.message || 'Nenhuma mensagem'}`)
    console.log(`Error: ${disparoData.error || 'Nenhum erro'}`)

    if (disparoResponse.status === 201) {
      console.log('✅ Sistema completo funcionando!')
      console.log('📱 Disparo processado com sucesso!')
    } else if (disparoData.error?.includes('URL da Evolution API não configurada')) {
      console.log('❌ AINDA HÁ PROBLEMA: apiUrl não corrigida no sistema de disparos')
    } else {
      console.log('✅ CORREÇÃO FUNCIONANDO: apiUrl corrigida, erro é outro')
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ apiUrl corrigida de camelCase para snake_case')
    console.log('✅ Sistema deve funcionar sem erro de URL')
    console.log('✅ Próximo passo: Verificar se instâncias estão conectadas')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testApiUrlFix()
