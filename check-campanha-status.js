// Script para verificar o status da campanha
require('dotenv').config()

async function checkCampanhaStatus() {
  console.log('🔍 Verificando status da campanha...\n')

  try {
    const response = await fetch('http://localhost:3000/api/campanhas/27fa9a38-5ad1-4d7e-9dd4-ce43be679464')
    const result = await response.json()
    
    console.log('📋 Dados da campanha:')
    console.log('ID:', result.data.id)
    console.log('Nome:', result.data.nome)
    console.log('Status:', result.data.status)
    console.log('Progresso:', JSON.stringify(result.data.progresso, null, 2))
    console.log('Configuração:', JSON.stringify(result.data.configuracao, null, 2))

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

checkCampanhaStatus()
