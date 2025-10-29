// Script para testar o controle da campanha
require('dotenv').config()

async function testCampanhaControl() {
  console.log('🔍 Testando controle da campanha...\n')

  try {
    const campanhaId = '7dcef6b2-fcb1-4911-b542-47bd9192891a'
    
    // Verificar status atual
    console.log('1. Verificando status atual...')
    const statusResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}`)
    const statusResult = await statusResponse.json()
    console.log('Status atual:', statusResult.data.status)
    console.log('Progresso:', JSON.stringify(statusResult.data.progresso, null, 2))

    // Testar controle
    console.log('\n2. Testando controle...')
    const controleResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}/controle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acao: 'iniciar' })
    })

    console.log('Status do controle:', controleResponse.status)
    const controleResult = await controleResponse.text()
    console.log('Resposta do controle:', controleResult)

    if (controleResponse.ok) {
      console.log('✅ Controle funcionando!')
      
      // Verificar status após controle
      console.log('\n3. Verificando status após controle...')
      const finalStatusResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}`)
      const finalStatusResult = await finalStatusResponse.json()
      console.log('Status após controle:', finalStatusResult.data.status)
    } else {
      console.log('❌ Erro no controle')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testCampanhaControl()
