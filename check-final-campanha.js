// Script para verificar o status da campanha final
require('dotenv').config()

async function checkFinalCampanha() {
  console.log('🔍 Verificando status da campanha final...\n')

  try {
    const response = await fetch('http://localhost:3000/api/campanhas/f1374c9c-b54b-468f-9964-f2e7553218b4')
    const result = await response.json()
    
    console.log('📋 Dados da campanha final:')
    console.log('ID:', result.data.id)
    console.log('Nome:', result.data.nome)
    console.log('Status:', result.data.status)
    console.log('Progresso:', JSON.stringify(result.data.progresso, null, 2))

    // Testar controle
    console.log('\n🎮 Testando controle...')
    const controleResponse = await fetch(`http://localhost:3000/api/campanhas/${result.data.id}/controle`, {
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
    } else {
      console.log('❌ Erro no controle')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

checkFinalCampanha()
