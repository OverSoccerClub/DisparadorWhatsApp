// Script para testar permissões do Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPermissions() {
  console.log('🔍 Testando permissões do Supabase...\n')

  try {
    // Teste 1: Buscar campanhas
    console.log('1. Testando busca de campanhas...')
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select('*')
      .limit(5)

    if (campanhasError) {
      console.error('❌ Erro ao buscar campanhas:', campanhasError.message)
    } else {
      console.log('✅ Campanhas acessíveis:', campanhas?.length || 0)
    }

    // Teste 2: Inserir campanha de teste
    console.log('\n2. Testando inserção de campanha...')
    const { data: novaCampanha, error: insertError } = await supabase
      .from('campanhas')
      .insert([{
        nome: 'Teste de Permissão',
        mensagem: 'Mensagem de teste',
        criterios: { status: 'ativo' },
        configuracao: { 
          clientesPorLote: 100, 
          intervaloMensagens: 10, 
          agendamento: 'imediato' 
        }
      }])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao inserir campanha:', insertError.message)
    } else {
      console.log('✅ Campanha inserida com sucesso:', novaCampanha.id)
      
      // Teste 3: Deletar campanha de teste
      console.log('\n3. Testando exclusão de campanha...')
      const { error: deleteError } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', novaCampanha.id)

      if (deleteError) {
        console.error('❌ Erro ao deletar campanha:', deleteError.message)
      } else {
        console.log('✅ Campanha deletada com sucesso')
      }
    }

    // Teste 4: Buscar lotes
    console.log('\n4. Testando busca de lotes...')
    const { data: lotes, error: lotesError } = await supabase
      .from('lotes_campanha')
      .select('*')
      .limit(5)

    if (lotesError) {
      console.error('❌ Erro ao buscar lotes:', lotesError.message)
    } else {
      console.log('✅ Lotes acessíveis:', lotes?.length || 0)
    }

    console.log('\n🎉 Teste de permissões concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testPermissions()
