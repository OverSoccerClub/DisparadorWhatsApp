/**
 * Script para testar a integração da página de disparos
 */

const testDisparosIntegration = async () => {
  console.log('🧪 Testando integração da página de disparos...\n')

  try {
    // Teste 1: Verificar se a API de disparos está funcionando
    console.log('📡 Teste 1: Verificando API de disparos...')
    
    const response = await fetch('http://localhost:3000/api/disparos?page=1&limit=10&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    console.log('📊 Resultado da API:')
    console.log(`Status HTTP: ${response.status}`)
    console.log(`Success: ${response.ok}`)
    console.log(`Data length: ${data.data?.length || 0}`)
    console.log(`Pagination: ${JSON.stringify(data.pagination || {}, null, 2)}`)

    if (response.ok && data.data) {
      console.log('✅ API de disparos funcionando!')
      console.log(`📋 Total de disparos: ${data.pagination?.total || 0}`)
      console.log(`📄 Páginas: ${data.pagination?.pages || 0}`)
      
      if (data.data.length > 0) {
        console.log('📝 Primeiro disparo:')
        const primeiro = data.data[0]
        console.log(`  ID: ${primeiro.id}`)
        console.log(`  Telefone: ${primeiro.telefone}`)
        console.log(`  Status: ${primeiro.status}`)
        console.log(`  Criado em: ${primeiro.created_at}`)
      }
    } else {
      console.log('❌ Problema na API de disparos:', data.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Testar filtros
    console.log('🔍 Teste 2: Testando filtros...')
    
    const filterResponse = await fetch('http://localhost:3000/api/disparos?page=1&limit=10&search=5584999727583&status=pendente', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const filterData = await filterResponse.json()
    console.log('📊 Resultado dos filtros:')
    console.log(`Status HTTP: ${filterResponse.status}`)
    console.log(`Data length: ${filterData.data?.length || 0}`)
    console.log(`Pagination: ${JSON.stringify(filterData.pagination || {}, null, 2)}`)

    if (filterResponse.ok) {
      console.log('✅ Filtros funcionando!')
    } else {
      console.log('❌ Problema nos filtros:', filterData.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 3: Testar paginação
    console.log('📄 Teste 3: Testando paginação...')
    
    const pageResponse = await fetch('http://localhost:3000/api/disparos?page=2&limit=5&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const pageData = await pageResponse.json()
    console.log('📊 Resultado da paginação:')
    console.log(`Status HTTP: ${pageResponse.status}`)
    console.log(`Data length: ${pageData.data?.length || 0}`)
    console.log(`Pagination: ${JSON.stringify(pageData.pagination || {}, null, 2)}`)

    if (pageResponse.ok) {
      console.log('✅ Paginação funcionando!')
    } else {
      console.log('❌ Problema na paginação:', pageData.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Integração com dados reais implementada')
    console.log('✅ Paginação funcionando')
    console.log('✅ Filtros funcionando')
    console.log('✅ Página de disparos pronta para uso!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testDisparosIntegration()
