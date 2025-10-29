/**
 * Script para verificar se há dados na tabela disparos
 */

const checkDisparosTable = async () => {
  console.log('🔍 Verificando tabela disparos...\n')

  try {
    // Teste direto no Supabase
    const { createClient } = require('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Variáveis de ambiente do Supabase não encontradas')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Contar total de disparos
    const { count, error: countError } = await supabase
      .from('disparos')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('❌ Erro ao contar disparos:', countError.message)
      return
    }

    console.log(`📊 Total de disparos na tabela: ${count}`)

    // Buscar alguns disparos
    const { data, error } = await supabase
      .from('disparos')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('❌ Erro ao buscar disparos:', error.message)
      return
    }

    console.log(`📋 Disparos encontrados: ${data?.length || 0}`)
    
    if (data && data.length > 0) {
      console.log('\n📝 Primeiros disparos:')
      data.forEach((disparo, index) => {
        console.log(`${index + 1}. ID: ${disparo.id}`)
        console.log(`   Telefone: ${disparo.telefone}`)
        console.log(`   Status: ${disparo.status}`)
        console.log(`   Criado em: ${disparo.created_at}`)
        console.log('')
      })
    } else {
      console.log('ℹ️ Nenhum disparo encontrado na tabela')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
checkDisparosTable()
