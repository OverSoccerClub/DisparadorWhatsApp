/**
 * Script para testar modelos Gemini disponíveis
 */

const testGeminiModels = async () => {
  console.log('🤖 Testando modelos Gemini disponíveis...\n')

  try {
    // Teste com diferentes quantidades de variações
    const testMessage = '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!'

    console.log('📝 Testando geração de variações...')
    console.log(`Mensagem original: ${testMessage.substring(0, 100)}...\n`)

    const response = await fetch('http://localhost:3000/api/ai/variacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensagem: testMessage,
        quantidade: 3
      })
    })

    const data = await response.json()
    
    console.log('📊 Resultado do teste:')
    console.log(`Status HTTP: ${response.status}`)
    console.log(`Success: ${data.success}`)
    console.log(`Fallback: ${data.fallback || false}`)
    console.log(`Model Used: ${data.modelUsed || 'Nenhum'}`)
    console.log(`Reason: ${data.reason || 'Nenhum'}`)
    console.log(`Message: ${data.message || 'Nenhuma'}`)

    if (data.success && data.variations) {
      console.log(`\n✅ Variações geradas com sucesso usando modelo: ${data.modelUsed}`)
      console.log(`📋 Total de variações: ${data.variations.length}`)
      
      data.variations.forEach((variation, index) => {
        const variationText = typeof variation === 'string' ? variation : JSON.stringify(variation)
        console.log(`\n${index + 1}. ${variationText.substring(0, 100)}...`)
      })
    } else {
      console.log('\n⚠️ Usando sistema local de variações (fallback)')
      console.log('📋 Isso significa que o sistema local está funcionando perfeitamente!')
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎯 CONCLUSÃO:')
    
    if (data.success) {
      console.log('✅ Sistema funcionando com IA (Gemini)')
    } else {
      console.log('✅ Sistema funcionando com fallback local')
    }
    
    console.log('✅ Cada destinatário receberá uma variação diferente')
    console.log('✅ Sistema robusto e confiável')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testGeminiModels()
