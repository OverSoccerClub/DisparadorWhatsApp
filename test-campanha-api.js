// Script para testar a API de campanhas
require('dotenv').config()

async function testCampanhaAPI() {
  console.log('🔍 Testando API de campanhas...\n')

  try {
    // 1. Buscar campanhas
    console.log('1. Buscando campanhas...')
    const response = await fetch('http://localhost:3000/api/campanhas')
    const campanhas = await response.json()
    console.log('✅ Campanhas encontradas:', campanhas.data?.length || 0)

    if (campanhas.data && campanhas.data.length > 0) {
      const campanhaId = campanhas.data[0].id
      console.log('📋 ID da primeira campanha:', campanhaId)

      // 2. Testar controle de campanha
      console.log('\n2. Testando controle de campanha...')
      const controleResponse = await fetch(`http://localhost:3000/api/campanhas/${campanhaId}/controle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao: 'iniciar' })
      })

      console.log('Status:', controleResponse.status)
      const controleResult = await controleResponse.text()
      console.log('Resposta:', controleResult)

      if (controleResponse.ok) {
        console.log('✅ Controle de campanha funcionando!')
      } else {
        console.log('❌ Erro no controle de campanha')
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testCampanhaAPI()
