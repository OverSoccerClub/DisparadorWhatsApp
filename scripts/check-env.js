/**
 * Script para verificar variáveis de ambiente
 * Execute: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando variáveis de ambiente...\n');

// Verificar .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ Arquivo .env.local encontrado');
  
  const content = fs.readFileSync(envLocalPath, 'utf8');
  
  // Verificar URL
  const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/m);
  if (urlMatch) {
    const url = urlMatch[1].trim();
    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${url}`);
    if (!url.includes('innovarecode.com.br')) {
      console.warn('⚠️  URL não parece ser do novo servidor!');
    }
  } else {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrada');
  }
  
  // Verificar ANON_KEY
  const keyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/m);
  if (keyMatch) {
    const key = keyMatch[1].trim();
    console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key.substring(0, 20)}...`);
  } else {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada');
  }
  
  // Verificar SERVICE_ROLE_KEY
  const serviceKeyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/m);
  if (serviceKeyMatch) {
    const serviceKey = serviceKeyMatch[1].trim();
    if (serviceKey === 'your_supabase_service_role_key_here' || 
        serviceKey === "'l1fpXIdFhOdWtSGZOTixa8KdCAxMOyOiwgW872GeCmA='" ||
        serviceKey === "l1fpXIdFhOdWtSGZOTixa8KdCAxMOyOiwgW872GeCmA=") {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY parece ser um placeholder ou igual à ANON_KEY');
    } else {
      console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 20)}...`);
    }
  } else {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada');
  }
  
  // Verificar problemas comuns
  if (content.includes("'") && content.includes("NEXT_PUBLIC_SUPABASE")) {
    console.warn('⚠️  Possíveis aspas simples nas variáveis - remova as aspas');
  }
  
} else {
  console.error('❌ Arquivo .env.local não encontrado!');
  console.log('💡 Crie o arquivo a partir do .env-example:');
  console.log('   cp .env-example .env.local');
}

// Verificar se há arquivo .env (não deve existir)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.warn('\n⚠️  Arquivo .env encontrado! Isso pode causar conflitos.');
  console.log('💡 Considere removê-lo ou renomeá-lo para .env.backup');
}

console.log('\n📋 Resumo:');
console.log('   - Use apenas .env.local para desenvolvimento');
console.log('   - Remova aspas das variáveis');
console.log('   - SERVICE_ROLE_KEY deve ser diferente da ANON_KEY');
console.log('   - Reinicie o servidor após alterar .env.local');

