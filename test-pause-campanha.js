// Script para testar pausar campanha
require('dotenv').config()

async function testPauseCampanha() {
  console.log('🔍 Testando pausar campanha...\n')

  try {
    const campanhaId = '7dcef6b2-fcb1-4911-b542-47bd9192891a'
    
    // Verificar status atual
    console.log('1. Verificando status atual...')
    const statusResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}`)
    const statusResult = await statusResponse.json()
    console.log('Status atual:', statusResult.data.status)
    console.log('Progresso status:', statusResult.data.progresso.status)

    // Testar pausar
    console.log('\n2. Testando pausar...')
    const controleResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}/controle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acao: 'pausar' })
    })

    console.log('Status da resposta:', controleResponse.status)
    const controleResult = await controleResponse.json()
    console.log('Resposta:', JSON.stringify(controleResult, null, 2))

    if (controleResponse.ok) {
      console.log('\n✅ Pausar funcionou!')
      
      // Testar retomar
      console.log('\n3. Testando retomar...')
      const retomarResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}/controle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao: 'retomar' })
      })

      console.log('Status da resposta:', retomarResponse.status)
      const retomarResult = await retomarResponse.json()
      console.log('Resposta:', JSON.stringify(retomarResult, null, 2))

      if (retomarResponse.ok) {
        console.log('\n✅ Retomar funcionou!')
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testPauseCampanha()
