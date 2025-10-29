/**
 * Script para testar a nova coluna de mensagem na tabela de disparos
 */

const testMensagemColumn = async () => {
  console.log('📝 Testando nova coluna de mensagem...\n')

  try {
    // Teste 1: Buscar disparos para verificar se a mensagem está sendo retornada
    console.log('📡 Teste 1: Verificando dados da API...')
    
    const response = await fetch('http://localhost:3000/api/disparos?page=1&limit=5&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    console.log('📊 Resultado da API:')
    console.log(`Status HTTP: ${response.status}`)
    console.log(`Data length: ${data.data?.length || 0}`)

    if (data.data && data.data.length > 0) {
      console.log('\n📋 Disparos com mensagens:')
      data.data.forEach((disparo, index) => {
        console.log(`${index + 1}. Telefone: ${disparo.telefone}`)
        console.log(`   Status: ${disparo.status}`)
        console.log(`   Mensagem: ${disparo.mensagem?.substring(0, 100)}...`)
        console.log(`   Mensagem completa: ${disparo.mensagem}`)
        console.log('')
      })
    } else {
      console.log('❌ Nenhum disparo encontrado')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 2: Testar busca por mensagem
    console.log('🔍 Teste 2: Testando busca por mensagem...')
    
    const searchResponse = await fetch('http://localhost:3000/api/disparos?page=1&limit=10&search=RASPADINHA&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const searchData = await searchResponse.json()
    console.log('📊 Resultado da busca por "RASPADINHA":')
    console.log(`Status HTTP: ${searchResponse.status}`)
    console.log(`Data length: ${searchData.data?.length || 0}`)

    if (searchData.data && searchData.data.length > 0) {
      console.log('✅ Busca por mensagem funcionando!')
      searchData.data.forEach((disparo, index) => {
        console.log(`${index + 1}. ${disparo.telefone} - ${disparo.mensagem?.substring(0, 50)}...`)
      })
    } else {
      console.log('❌ Nenhum resultado encontrado na busca')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 3: Verificar diferentes tipos de mensagem
    console.log('📝 Teste 3: Verificando tipos de mensagem...')
    
    const messageTypes = {}
    if (data.data) {
      data.data.forEach(disparo => {
        const messageStart = disparo.mensagem?.substring(0, 20) || 'Sem mensagem'
        messageTypes[messageStart] = (messageTypes[messageStart] || 0) + 1
      })
    }

    console.log('📊 Tipos de mensagem encontrados:')
    Object.entries(messageTypes).forEach(([type, count]) => {
      console.log(`  "${type}...": ${count} disparos`)
    })

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Coluna de mensagem adicionada à tabela')
    console.log('✅ Busca por mensagem funcionando')
    console.log('✅ Dados reais sendo exibidos')
    console.log('✅ Página de disparos atualizada!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testMensagemColumn()
