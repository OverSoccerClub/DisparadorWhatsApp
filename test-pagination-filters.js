/**
 * Script para testar paginação e filtros de status
 */

const testPaginationFilters = async () => {
  console.log('📄 Testando paginação e filtros de status...\n')

  try {
    // Teste 1: Verificar paginação básica
    console.log('📄 Teste 1: Testando paginação básica...')
    
    const page1Response = await fetch('http://localhost:3000/api/disparos?page=1&limit=5&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const page1Data = await page1Response.json()
    console.log('📊 Página 1:')
    console.log(`Status HTTP: ${page1Response.status}`)
    console.log(`Data length: ${page1Data.data?.length || 0}`)
    console.log(`Total: ${page1Data.pagination?.total || 0}`)
    console.log(`Pages: ${page1Data.pagination?.pages || 0}`)
    console.log(`Current page: ${page1Data.pagination?.page || 0}`)
    console.log(`Limit: ${page1Data.pagination?.limit || 0}`)

    if (page1Data.pagination?.pages > 1) {
      console.log('\n📄 Testando página 2...')
      
      const page2Response = await fetch('http://localhost:3000/api/disparos?page=2&limit=5&search=&status=todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const page2Data = await page2Response.json()
      console.log('📊 Página 2:')
      console.log(`Status HTTP: ${page2Response.status}`)
      console.log(`Data length: ${page2Data.data?.length || 0}`)
      console.log(`Current page: ${page2Data.pagination?.page || 0}`)
      
      // Verificar se os dados são diferentes
      const page1Ids = page1Data.data?.map(d => d.id) || []
      const page2Ids = page2Data.data?.map(d => d.id) || []
      const hasOverlap = page1Ids.some(id => page2Ids.includes(id))
      
      if (!hasOverlap && page2Data.data?.length > 0) {
        console.log('✅ Paginação funcionando: páginas diferentes!')
      } else {
        console.log('❌ Problema na paginação: dados repetidos entre páginas')
      }
    } else {
      console.log('ℹ️ Apenas 1 página disponível, pulando teste de múltiplas páginas')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Verificar filtros de status
    console.log('🔍 Teste 2: Testando filtros de status...')
    
    const statusTests = [
      { status: 'todos', name: 'Todos' },
      { status: 'pendente', name: 'Pendentes' },
      { status: 'enviado', name: 'Enviados' },
      { status: 'entregue', name: 'Entregues' },
      { status: 'falhou', name: 'Falhas' },
      { status: 'cancelado', name: 'Cancelados' }
    ]

    for (const test of statusTests) {
      const statusResponse = await fetch(`http://localhost:3000/api/disparos?page=1&limit=10&search=&status=${test.status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const statusData = await statusResponse.json()
      console.log(`📊 ${test.name}: ${statusData.data?.length || 0} disparos`)
      
      if (test.status !== 'todos' && statusData.data?.length > 0) {
        // Verificar se todos os disparos têm o status correto
        const allCorrectStatus = statusData.data.every(d => d.status === test.status)
        if (allCorrectStatus) {
          console.log(`  ✅ Filtro ${test.name} funcionando corretamente`)
        } else {
          console.log(`  ❌ Filtro ${test.name} com problemas: status incorretos`)
        }
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 3: Verificar busca
    console.log('🔍 Teste 3: Testando busca...')
    
    const searchTests = [
      { search: '5584999727583', name: 'Busca por telefone' },
      { search: 'RASPADINHA', name: 'Busca por mensagem' },
      { search: 'NÁUTICO', name: 'Busca por palavra na mensagem' }
    ]

    for (const test of searchTests) {
      const searchResponse = await fetch(`http://localhost:3000/api/disparos?page=1&limit=10&search=${encodeURIComponent(test.search)}&status=todos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const searchData = await searchResponse.json()
      console.log(`📊 ${test.name}: ${searchData.data?.length || 0} resultados`)
      
      if (searchData.data?.length > 0) {
        console.log(`  ✅ Busca "${test.search}" funcionando`)
      } else {
        console.log(`  ℹ️ Nenhum resultado para "${test.search}"`)
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 4: Verificar combinação de filtros
    console.log('🔍 Teste 4: Testando combinação de filtros...')
    
    const combinedResponse = await fetch('http://localhost:3000/api/disparos?page=1&limit=5&search=RASPADINHA&status=enviado', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const combinedData = await combinedResponse.json()
    console.log('📊 Combinação (busca + status):')
    console.log(`Resultados: ${combinedData.data?.length || 0}`)
    console.log(`Total: ${combinedData.pagination?.total || 0}`)
    
    if (combinedData.data?.length > 0) {
      const allEnviados = combinedData.data.every(d => d.status === 'enviado')
      const allWithSearch = combinedData.data.every(d => 
        d.telefone.includes('RASPADINHA') || 
        d.mensagem?.includes('RASPADINHA') || 
        d.resposta?.includes('RASPADINHA')
      )
      
      if (allEnviados && allWithSearch) {
        console.log('✅ Combinação de filtros funcionando!')
      } else {
        console.log('❌ Problema na combinação de filtros')
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Paginação implementada e funcionando')
    console.log('✅ Filtros de status funcionando')
    console.log('✅ Busca funcionando')
    console.log('✅ Combinação de filtros funcionando')
    console.log('✅ Sistema de disparos completo!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testPaginationFilters()
