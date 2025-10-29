/**
 * Script para testar conexão com Supabase
 */

const testSupabaseConnection = async () => {
  console.log('🔍 Testando conexão com Supabase...\n')

  try {
    // Teste básico de conexão
    const response = await fetch('http://localhost:3000/api/test-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Resultado do teste Supabase:')
    console.log(`Status HTTP: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Conexão com Supabase funcionando!')
      console.log(`Data: ${JSON.stringify(data, null, 2)}`)
    } else {
      const errorData = await response.json()
      console.log('❌ Erro na conexão:', errorData.error)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testSupabaseConnection()
