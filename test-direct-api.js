/**
 * Script para testar API diretamente
 */

const testDirectAPI = async () => {
  console.log('🔍 Testando API diretamente...\n')

  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('📡 Teste 1: Verificando se o servidor está rodando...')
    
    const healthResponse = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    })

    console.log(`Status HTTP: ${healthResponse.status}`)
    
    if (healthResponse.status === 404) {
      console.log('ℹ️ Endpoint /api/health não existe, mas servidor está rodando')
    } else if (healthResponse.ok) {
      console.log('✅ Servidor está rodando!')
    } else {
      console.log('❌ Servidor com problemas')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Testar endpoint simples
    console.log('📡 Teste 2: Testando endpoint simples...')
    
    try {
      const simpleResponse = await fetch('http://localhost:3000/api/disparos', {
        method: 'GET'
      })
      
      console.log(`Status HTTP: ${simpleResponse.status}`)
      
      if (simpleResponse.ok) {
        const data = await simpleResponse.json()
        console.log('✅ API de disparos funcionando!')
        console.log(`Data length: ${data.data?.length || 0}`)
      } else {
        const errorData = await simpleResponse.json()
        console.log('❌ Erro na API:', errorData.error)
      }
    } catch (fetchError) {
      console.log('❌ Erro de conexão:', fetchError.message)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testDirectAPI()
