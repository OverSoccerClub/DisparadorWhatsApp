// Script para verificar o status da nova campanha
require('dotenv').config()

async function checkNewCampanha() {
  console.log('🔍 Verificando status da nova campanha...\n')

  try {
    const response = await fetch('http://localhost:3000/api/campanhas/d1ddc04d-84ba-4404-9a6b-effd88202da6')
    const result = await response.json()
    
    console.log('📋 Dados da nova campanha:')
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

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

checkNewCampanha()
