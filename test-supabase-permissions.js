// Script para testar permissões do Supabase
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testando configuração do Supabase...\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Não encontrado')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurado' : '❌ Não encontrado')
  process.exit(1)
}

console.log('✅ Variáveis de ambiente encontradas')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseKey.length)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPermissions() {
  console.log('\n🔍 Testando permissões das tabelas...\n')

  try {
    // Teste 1: Buscar campanhas
    console.log('1. Testando busca de campanhas...')
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select('*')
      .limit(5)

    if (campanhasError) {
      console.error('❌ Erro ao buscar campanhas:')
      console.error('Código:', campanhasError.code)
      console.error('Mensagem:', campanhasError.message)
      console.error('Detalhes:', campanhasError.details)
    } else {
      console.log('✅ Campanhas acessíveis:', campanhas?.length || 0)
    }

    // Teste 2: Buscar lotes
    console.log('\n2. Testando busca de lotes...')
    const { data: lotes, error: lotesError } = await supabase
      .from('lotes_campanha')
      .select('*')
      .limit(5)

    if (lotesError) {
      console.error('❌ Erro ao buscar lotes:')
      console.error('Código:', lotesError.code)
      console.error('Mensagem:', lotesError.message)
    } else {
      console.log('✅ Lotes acessíveis:', lotes?.length || 0)
    }

    // Teste 3: Inserir campanha de teste
    console.log('\n3. Testando inserção de campanha...')
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
      console.error('❌ Erro ao inserir campanha:')
      console.error('Código:', insertError.code)
      console.error('Mensagem:', insertError.message)
    } else {
      console.log('✅ Campanha inserida com sucesso:', novaCampanha.id)
      
      // Teste 4: Deletar campanha de teste
      console.log('\n4. Testando exclusão de campanha...')
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

    console.log('\n🎉 Teste de permissões concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testPermissions()
