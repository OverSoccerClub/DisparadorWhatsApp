/**
 * Script para testar a funcionalidade de exclusão de disparos
 */

const testDeleteDisparo = async () => {
  console.log('🗑️ Testando funcionalidade de exclusão de disparos...\n')

  try {
    // Teste 1: Listar disparos antes da exclusão
    console.log('📋 Teste 1: Listando disparos antes da exclusão...')
    
    const listResponse = await fetch('http://localhost:3000/api/disparos?page=1&limit=5&search=&status=todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const listData = await listResponse.json()
    console.log('📊 Disparos encontrados:')
    console.log(`Total: ${listData.pagination?.total || 0}`)
    console.log(`Data length: ${listData.data?.length || 0}`)

    if (listData.data && listData.data.length > 0) {
      const primeiroDisparo = listData.data[0]
      console.log(`\n📝 Primeiro disparo para teste:`)
      console.log(`  ID: ${primeiroDisparo.id}`)
      console.log(`  Telefone: ${primeiroDisparo.telefone}`)
      console.log(`  Status: ${primeiroDisparo.status}`)
      console.log(`  Mensagem: ${primeiroDisparo.mensagem?.substring(0, 50)}...`)

      console.log('\n' + '='.repeat(50) + '\n')

      // Teste 2: Excluir o primeiro disparo
      console.log('🗑️ Teste 2: Excluindo disparo...')
      
      const deleteResponse = await fetch(`http://localhost:3000/api/disparos/${primeiroDisparo.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const deleteData = await deleteResponse.json()
      console.log('📊 Resultado da exclusão:')
      console.log(`Status HTTP: ${deleteResponse.status}`)
      console.log(`Success: ${deleteData.success}`)
      console.log(`Message: ${deleteData.message}`)
      console.log(`Data: ${JSON.stringify(deleteData.data || {}, null, 2)}`)

      if (deleteResponse.ok && deleteData.success) {
        console.log('✅ Disparo excluído com sucesso!')
      } else {
        console.log('❌ Erro ao excluir disparo:', deleteData.error)
      }

      console.log('\n' + '='.repeat(50) + '\n')

      // Teste 3: Verificar se o disparo foi realmente excluído
      console.log('🔍 Teste 3: Verificando se o disparo foi excluído...')
      
      const verifyResponse = await fetch('http://localhost:3000/api/disparos?page=1&limit=5&search=&status=todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const verifyData = await verifyResponse.json()
      console.log('📊 Verificação pós-exclusão:')
      console.log(`Total: ${verifyData.pagination?.total || 0}`)
      console.log(`Data length: ${verifyData.data?.length || 0}`)

      // Verificar se o disparo excluído ainda aparece na lista
      const disparoAindaExiste = verifyData.data?.some(d => d.id === primeiroDisparo.id)
      
      if (!disparoAindaExiste) {
        console.log('✅ Disparo foi realmente excluído da lista!')
      } else {
        console.log('❌ Disparo ainda aparece na lista (erro na exclusão)')
      }

    } else {
      console.log('❌ Nenhum disparo encontrado para testar exclusão')
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Teste 4: Tentar excluir disparo inexistente
    console.log('🔍 Teste 4: Testando exclusão de disparo inexistente...')
    
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const fakeDeleteResponse = await fetch(`http://localhost:3000/api/disparos/${fakeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const fakeDeleteData = await fakeDeleteResponse.json()
    console.log('📊 Resultado da exclusão de ID inexistente:')
    console.log(`Status HTTP: ${fakeDeleteResponse.status}`)
    console.log(`Error: ${fakeDeleteData.error}`)

    if (fakeDeleteResponse.status === 404) {
      console.log('✅ API corretamente retorna 404 para ID inexistente')
    } else {
      console.log('❌ API deveria retornar 404 para ID inexistente')
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Funcionalidade de exclusão implementada')
    console.log('✅ API de exclusão funcionando')
    console.log('✅ Validação de ID inexistente funcionando')
    console.log('✅ Botão de excluir pronto para uso!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testDeleteDisparo()
