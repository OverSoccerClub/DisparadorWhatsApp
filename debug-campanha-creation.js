// Script para debugar a criação de campanhas
require('dotenv').config()

async function debugCampanhaCreation() {
  console.log('🔍 Debugando criação de campanhas...\n')

  try {
    // Criar campanha com agendamento diferente
    console.log('1. Criando campanha com agendamento agendado...')
    const response = await fetch('http://localhost:3000/api/campanhas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: 'Debug Campanha',
        mensagem: 'Mensagem de debug',
        criterios: { status: 'ativo' },
        configuracao: {
          clientesPorLote: 50,
          intervaloMensagens: 5,
          agendamento: '2024-12-31T23:59:59Z' // Agendamento futuro
        }
      })
    })

    const result = await response.json()
    console.log('Status da criação:', response.status)
    console.log('Resposta:', JSON.stringify(result, null, 2))

    if (result.data) {
      console.log('\n2. Verificando status da campanha criada...')
      const checkResponse = await fetch(`http://localhost:3000/api/campanhas/${result.data.id}`)
      const checkResult = await checkResponse.json()
      
      console.log('Status da campanha:', checkResult.data.status)
      console.log('Progresso:', JSON.stringify(checkResult.data.progresso, null, 2))
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

debugCampanhaCreation()
