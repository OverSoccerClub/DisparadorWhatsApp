/**
 * Script para testar a Evolution API com configuração correta
 */

const testEvolutionAPICorrect = async () => {
  console.log('🔧 Testando Evolution API com configuração correta...\n')

  try {
    // Teste 1: Configurar a Evolution API com URL correta
    console.log('📝 Passo 1: Configurando Evolution API...')
    
    const configResponse = await fetch('http://localhost:3000/api/evolution/save-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: '92648299-39f8-48d6-957b-65b72091339d',
        apiUrl: 'https://evolution.analome.com.br', // Sua URL real
        globalApiKey: 'sua_api_key_real_aqui', // Substitua pela sua API key real
        webhookUrl: 'https://seu-webhook.com.br'
      })
    })

    const configData = await configResponse.json()
    console.log('📊 Resultado da configuração:')
    console.log(`Status: ${configResponse.status}`)
    console.log(`Success: ${configData.success}`)
    console.log(`Message: ${configData.message || 'Nenhuma mensagem'}`)

    if (!configData.success) {
      console.log('❌ Erro ao configurar:', configData.error)
      return
    }

    console.log('✅ Configuração salva com sucesso!')

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Testar Evolution API diretamente
    console.log('📡 Passo 2: Testando Evolution API...')
    
    const evolutionResponse = await fetch('http://localhost:3000/api/evolution/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: 'inst_391c3d34',
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
      console.log('✅ Evolution API funcionando perfeitamente!')
      console.log('📱 Mensagem enviada com sucesso!')
    } else {
      console.log('❌ Evolution API com problema:')
      console.log(`   Erro: ${evolutionData.error}`)
      
      if (evolutionData.error?.includes('URL da Evolution API não configurada')) {
        console.log('🔧 SOLUÇÃO: Configure a URL da Evolution API')
      } else if (evolutionData.error?.includes('não está conectada')) {
        console.log('🔧 SOLUÇÃO: Conecte a instância WhatsApp')
      } else {
        console.log('🔧 SOLUÇÃO: Verifique a configuração da Evolution API')
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 3: Teste completo de disparo
    console.log('🚀 Passo 3: Teste completo de disparo...')
    
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
        instanceName: 'inst_391c3d34',
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
    } else {
      console.log('❌ Problema no sistema de disparos:')
      console.log(`   Erro: ${disparoData.error}`)
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 INSTRUÇÕES FINAIS:')
    console.log('1. ✅ Configure sua URL real da Evolution API')
    console.log('2. ✅ Configure sua API Key real')
    console.log('3. ✅ Conecte suas instâncias WhatsApp')
    console.log('4. ✅ Teste o sistema de disparos')
    console.log('5. ✅ Sistema funcionará perfeitamente!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testEvolutionAPICorrect()
