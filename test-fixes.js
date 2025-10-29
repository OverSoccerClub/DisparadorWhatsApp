/**
 * Script para testar as correções implementadas
 */

const testFixes = async () => {
  console.log('🧪 Testando correções implementadas...\n')

  try {
    // Teste 1: Verificar se a API de variações está funcionando
    console.log('📝 Teste 1: Verificando API de variações...')
    
    const variationsResponse = await fetch('http://localhost:3000/api/ai/variacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensagem: '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!',
        quantidade: 3
      })
    })

    const variationsData = await variationsResponse.json()
    console.log('📊 Resultado das variações:')
    console.log(`Success: ${variationsData.success}`)
    console.log(`Fallback: ${variationsData.fallback || false}`)
    console.log(`Variações geradas: ${variationsData.variations?.length || 0}`)
    
    if (variationsData.success && variationsData.variations?.length > 0) {
      console.log('✅ API de variações funcionando!')
      console.log('📋 Variações geradas:')
      variationsData.variations.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.substring(0, 50)}...`)
      })
    } else {
      console.log('⚠️ API de variações usando fallback local')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Verificar se a Evolution API está recebendo userId
    console.log('📡 Teste 2: Verificando Evolution API com userId...')
    
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
    console.log(`Status HTTP: ${evolutionResponse.status}`)
    console.log(`Success: ${evolutionData.success}`)
    console.log(`Error: ${evolutionData.error || 'Nenhum erro'}`)

    if (evolutionResponse.status !== 400 || !evolutionData.error?.includes('userId')) {
      console.log('✅ Evolution API agora recebe userId corretamente!')
    } else {
      console.log('❌ Ainda há problema com userId na Evolution API')
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
        instanceName: 'inst_391c3d34',
        useRandomDistribution: false
      })
    })

    const disparoData = await disparoResponse.json()
    console.log('📊 Resultado do disparo:')
    console.log(`Status HTTP: ${disparoResponse.status}`)
    console.log(`Message: ${disparoData.message || 'Nenhuma mensagem'}`)
    console.log(`Stats: ${JSON.stringify(disparoData.stats || {}, null, 2)}`)

    if (disparoResponse.status === 201) {
      console.log('✅ Disparo processado com sucesso!')
    } else {
      console.log('❌ Problema no disparo:', disparoData.error)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar testes
testFixes()
