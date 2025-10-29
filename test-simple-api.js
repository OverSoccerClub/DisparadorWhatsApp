/**
 * Script para testar API simples
 */

const testSimpleAPI = async () => {
  console.log('🔍 Testando API simples...\n')

  try {
    const response = await fetch('http://localhost:3000/api/disparos-simple', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Resultado:')
    console.log(`Status HTTP: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API simples funcionando!')
      console.log(`Data length: ${data.data?.length || 0}`)
      console.log(`Total: ${data.pagination?.total || 0}`)
      
      if (data.data && data.data.length > 0) {
        console.log('\n📝 Primeiros disparos:')
        data.data.slice(0, 3).forEach((disparo, index) => {
          console.log(`${index + 1}. ID: ${disparo.id}`)
          console.log(`   Telefone: ${disparo.telefone}`)
          console.log(`   Status: ${disparo.status}`)
          console.log(`   Mensagem: ${disparo.mensagem?.substring(0, 50)}...`)
          console.log('')
        })
      }
    } else {
      const errorData = await response.json()
      console.log('❌ Erro na API:', errorData.error)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testSimpleAPI()
