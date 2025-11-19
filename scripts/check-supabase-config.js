/**
 * Script de Diagnóstico do Supabase
 * 
 * Este script verifica se a configuração do Supabase está correta
 * e se o banco de dados está acessível.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Verificando configuração do Supabase...\n')

// Verificar variáveis de ambiente
console.log('1. Verificando variáveis de ambiente:')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurado' : '❌ Não configurado'}`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurado' : '❌ Não configurado'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurado' : '⚠️  Não configurado (opcional)'}\n`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente obrigatórias não configuradas!')
  console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local')
  process.exit(1)
}

// Validar formato da URL
try {
  new URL(supabaseUrl)
  console.log('2. Validando formato da URL: ✅ URL válida\n')
} catch (error) {
  console.error('❌ Erro: URL do Supabase inválida!')
  console.error(`   URL fornecida: ${supabaseUrl}`)
  process.exit(1)
}

// Testar conexão com Supabase
async function testConnection() {
  console.log('3. Testando conexão com Supabase...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Tentar fazer uma query simples para verificar se o banco está acessível
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1)
    
    if (error) {
      // Se a tabela não existir, tentar outra verificação
      console.log('   ⚠️  Não foi possível verificar migrations (normal se o projeto for novo)')
      
      // Tentar verificar se o Auth está funcionando
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession()
        if (authError && authError.message?.includes('Database error querying schema')) {
          console.error('   ❌ Erro: Database error querying schema')
          console.error('   Este erro indica um problema com o banco de dados do Supabase.')
          console.error('   Possíveis causas:')
          console.error('   1. O projeto Supabase pode estar pausado ou inativo')
          console.error('   2. O banco de dados pode estar com problemas')
          console.error('   3. As permissões do banco podem estar incorretas')
          console.error('   Solução: Verifique o status do projeto no dashboard do Supabase')
          return false
        } else {
          console.log('   ✅ Conexão com Auth estabelecida')
        }
      } catch (authTestError) {
        console.error('   ❌ Erro ao testar Auth:', authTestError.message)
        return false
      }
    } else {
      console.log('   ✅ Conexão com banco de dados estabelecida\n')
    }
    
    // Verificar se o Service Role Key está configurado (para operações admin)
    if (supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
      console.log('4. Testando Service Role Key...')
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        
        // Tentar listar usuários (requer Service Role Key)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (usersError) {
          console.log('   ⚠️  Service Role Key pode estar incorreta ou sem permissões')
          console.log(`   Erro: ${usersError.message}`)
        } else {
          console.log(`   ✅ Service Role Key válida (${usersData?.users?.length || 0} usuários encontrados)`)
        }
      } catch (adminError) {
        console.log('   ⚠️  Erro ao testar Service Role Key:', adminError.message)
      }
    }
    
    console.log('\n✅ Diagnóstico concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('   1. Se o erro persistir, verifique o dashboard do Supabase')
    console.log('   2. Certifique-se de que o projeto está ativo')
    console.log('   3. Verifique se há migrations pendentes')
    console.log('   4. Tente recriar o projeto Supabase se necessário')
    
    return true
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message)
    console.error('\n📋 Possíveis soluções:')
    console.error('   1. Verifique se a URL do Supabase está correta')
    console.error('   2. Verifique se a chave anônima está correta')
    console.error('   3. Verifique se o projeto Supabase está ativo')
    console.error('   4. Verifique sua conexão com a internet')
    return false
  }
}

// Executar diagnóstico
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })

