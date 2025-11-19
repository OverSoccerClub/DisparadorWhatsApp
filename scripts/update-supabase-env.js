/**
 * Script para atualizar as variáveis de ambiente do Supabase
 * 
 * Este script atualiza o arquivo .env.local com as novas credenciais do Supabase
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env-example')

// Novas credenciais fornecidas pelo usuário
const newCredentials = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.innovarecode.com.br',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
}

function updateEnvFile() {
  console.log('🔄 Atualizando arquivo .env.local com as novas credenciais do Supabase...\n')

  let envContent = ''

  // Se o arquivo .env.local já existe, ler seu conteúdo
  if (fs.existsSync(envPath)) {
    console.log('📄 Arquivo .env.local encontrado. Atualizando...')
    envContent = fs.readFileSync(envPath, 'utf8')
  } else if (fs.existsSync(envExamplePath)) {
    console.log('📄 Arquivo .env.local não encontrado. Criando a partir do .env-example...')
    envContent = fs.readFileSync(envExamplePath, 'utf8')
  } else {
    console.log('📄 Criando novo arquivo .env.local...')
    envContent = `# ============================================================================
# VARIÁVEIS DE AMBIENTE PARA DESENVOLVIMENTO
# ============================================================================
# Configurado automaticamente - ${new Date().toISOString().split('T')[0]}
# ============================================================================

NODE_ENV=development

# ============================================================================
# CONFIGURAÇÕES DO SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ============================================================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================================
# CONFIGURAÇÕES DO N8N (OPCIONAL)
# ============================================================================
N8N_WEBHOOK_URL=your_n8n_webhook_url_here

# ============================================================================
# CONFIGURAÇÕES DE EMAIL (OPCIONAL)
# ============================================================================
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# ============================================================================
# CONFIGURAÇÕES DO GEMINI AI (OPCIONAL)
# ============================================================================
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================================================
# CONFIGURAÇÕES DO REDIS (OPCIONAL)
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# CONFIGURAÇÕES DE LOGS
# ============================================================================
LOG_LEVEL=3
LOG_FORMAT=text
`
  }

  // Atualizar as variáveis do Supabase
  const lines = envContent.split('\n')
  const updatedLines = lines.map(line => {
    // Verificar se a linha contém uma das variáveis do Supabase
    for (const [key, value] of Object.entries(newCredentials)) {
      if (line.trim().startsWith(`${key}=`) || line.trim().startsWith(`# ${key}`)) {
        // Se a linha está comentada, descomentar e atualizar
        if (line.trim().startsWith('#')) {
          return `${key}=${value}`
        }
        // Se já existe, atualizar o valor
        return `${key}=${value}`
      }
    }
    return line
  })

  // Adicionar variáveis que não existem
  const existingKeys = new Set()
  updatedLines.forEach(line => {
    for (const key of Object.keys(newCredentials)) {
      if (line.trim().startsWith(`${key}=`)) {
        existingKeys.add(key)
      }
    }
  })

  // Adicionar variáveis faltantes
  Object.keys(newCredentials).forEach(key => {
    if (!existingKeys.has(key)) {
      // Encontrar a seção do Supabase e adicionar a variável
      const supabaseSectionIndex = updatedLines.findIndex(line => 
        line.includes('SUPABASE') || line.includes('Supabase')
      )
      if (supabaseSectionIndex >= 0) {
        // Adicionar após a última linha da seção Supabase
        let insertIndex = supabaseSectionIndex + 1
        while (insertIndex < updatedLines.length && 
               !updatedLines[insertIndex].trim().startsWith('#') && 
               updatedLines[insertIndex].trim() !== '') {
          insertIndex++
        }
        updatedLines.splice(insertIndex, 0, `${key}=${newCredentials[key]}`)
      } else {
        // Adicionar no final
        updatedLines.push(`${key}=${newCredentials[key]}`)
      }
    }
  })

  // Garantir que todas as variáveis estão atualizadas
  const finalContent = updatedLines.map(line => {
    for (const [key, value] of Object.entries(newCredentials)) {
      if (line.trim().startsWith(`${key}=`)) {
        return `${key}=${value}`
      }
    }
    return line
  }).join('\n')

  // Escrever o arquivo atualizado
  fs.writeFileSync(envPath, finalContent, 'utf8')

  console.log('✅ Arquivo .env.local atualizado com sucesso!\n')
  console.log('📋 Variáveis atualizadas:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL=${newCredentials.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${newCredentials.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY=${newCredentials.SUPABASE_SERVICE_ROLE_KEY.substring(0, 50)}...`)
  console.log('\n📝 Próximos passos:')
  console.log('   1. Execute o script SQL no Supabase: supabase/MIGRATION_COMPLETE.sql')
  console.log('   2. Execute: npm run check-supabase (para verificar a conexão)')
  console.log('   3. Execute: npm run dev (para iniciar o servidor)')
}

// Executar
try {
  updateEnvFile()
  process.exit(0)
} catch (error) {
  console.error('❌ Erro ao atualizar arquivo .env.local:', error.message)
  process.exit(1)
}

