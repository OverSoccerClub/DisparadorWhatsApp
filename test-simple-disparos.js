/**
 * Script para testar consulta simples de disparos
 */

const testSimpleDisparos = async () => {
  console.log('🔍 Testando consulta simples de disparos...\n')

  try {
    // Teste 1: Consulta sem filtros
    console.log('📡 Teste 1: Consulta sem filtros...')
    
    const response = await fetch('http://localhost:3000/api/disparos?page=1&limit=10&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Resultado:')
    console.log(`Status HTTP: ${response.status}`)
    
    if (response.status === 500) {
      const errorData = await response.json()
      console.log('❌ Erro 500:', errorData.error)
      return
    }

    const data = await response.json()
    console.log(`Data length: ${data.data?.length || 0}`)
    console.log(`Total: ${data.pagination?.total || 0}`)
    console.log(`Pages: ${data.pagination?.pages || 0}`)

    if (data.data && data.data.length > 0) {
      console.log('✅ Dados encontrados!')
      console.log('📝 Primeiro disparo:')
      const primeiro = data.data[0]
      console.log(`  ID: ${primeiro.id}`)
      console.log(`  Telefone: ${primeiro.telefone}`)
      console.log(`  Status: ${primeiro.status}`)
    } else {
      console.log('ℹ️ Nenhum disparo encontrado')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testSimpleDisparos()
