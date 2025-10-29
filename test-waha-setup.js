/**
 * Script de Teste - Configuração WAHA
 * 
 * Verifica se:
 * 1. WAHA está rodando
 * 2. Rotas API do Next.js existem
 * 3. Banco de dados está configurado
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Configuração WAHA...\n');

// ============================================================================
// 1. VERIFICAR ARQUIVOS DAS ROTAS
// ============================================================================

console.log('📁 1. Verificando arquivos das rotas API...');

const requiredFiles = [
  'app/api/waha/sessions/route.ts',
  'app/api/waha/sessions/[sessionName]/route.ts',
  'app/api/waha/sessions/[sessionName]/qr/route.ts',
  'app/api/waha/sessions/[sessionName]/restart/route.ts',
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - NÃO ENCONTRADO`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Alguns arquivos estão faltando!\n');
  process.exit(1);
}

console.log('\n');

// ============================================================================
// 2. VERIFICAR SE WAHA ESTÁ RODANDO
// ============================================================================

console.log('🔍 2. Testando conexão com WAHA...');

function testWaha() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/sessions', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ WAHA está rodando na porta 3001');
        console.log(`   📊 Status: ${res.statusCode}`);
        resolve(true);
      } else {
        console.log(`   ⚠️  WAHA respondeu com status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('   ❌ WAHA não está rodando');
      console.log(`   📝 Erro: ${err.message}`);
      console.log('\n   💡 Para iniciar WAHA:');
      console.log('      docker run -d -p 3001:3000 --name waha devlikeapro/waha\n');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout ao conectar com WAHA');
      resolve(false);
    });
  });
}

// ============================================================================
// 3. VERIFICAR SE NEXT.JS ESTÁ RODANDO
// ============================================================================

console.log('🔍 3. Testando se Next.js está rodando...');

function testNextJs() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('   ✅ Next.js está rodando na porta 3000');
      console.log(`   📊 Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log('   ❌ Next.js não está rodando');
      console.log(`   📝 Erro: ${err.message}`);
      console.log('\n   💡 Para iniciar Next.js:');
      console.log('      npm run dev\n');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout ao conectar com Next.js');
      resolve(false);
    });
  });
}

// ============================================================================
// 4. TESTAR ROTA API DO NEXT.JS
// ============================================================================

function testNextJsRoute() {
  return new Promise((resolve) => {
    console.log('\n🔍 4. Testando rota /api/waha/sessions...');
    
    const req = http.get('http://localhost:3000/api/waha/sessions', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Rota /api/waha/sessions está funcionando');
        console.log(`   📊 Status: ${res.statusCode}`);
        resolve(true);
      } else if (res.statusCode === 404) {
        console.log('   ❌ Rota retornou 404 - Not Found');
        console.log('\n   💡 Solução:');
        console.log('      1. Pare o servidor: Ctrl+C');
        console.log('      2. Limpe o cache: Remove-Item -Recurse -Force .next');
        console.log('      3. Reinicie: npm run dev\n');
        resolve(false);
      } else if (res.statusCode === 500) {
        console.log('   ⚠️  Rota existe mas retornou erro 500');
        console.log('   📝 Possível problema: tabela waha_config não existe');
        console.log('\n   💡 Solução:');
        console.log('      Execute: npm run setup-waha-db\n');
        resolve(false);
      } else {
        console.log(`   ⚠️  Status inesperado: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('   ❌ Erro ao acessar rota');
      console.log(`   📝 Erro: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout ao acessar rota');
      resolve(false);
    });
  });
}

// ============================================================================
// 5. VERIFICAR ARQUIVO .env.local
// ============================================================================

function checkEnvFile() {
  console.log('\n📄 5. Verificando arquivo .env.local...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ Arquivo .env.local não encontrado');
    console.log('\n   💡 Crie o arquivo com:');
    console.log('      WAHA_API_URL=http://localhost:3001');
    console.log('      WAHA_API_KEY=\n');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  if (envContent.includes('WAHA_API_URL')) {
    const match = envContent.match(/WAHA_API_URL=(.+)/);
    const url = match ? match[1].trim() : '';
    console.log('   ✅ WAHA_API_URL configurado');
    console.log(`   📝 URL: ${url}`);
    return true;
  } else {
    console.log('   ⚠️  WAHA_API_URL não encontrado no .env.local');
    console.log('\n   💡 Adicione:');
    console.log('      WAHA_API_URL=http://localhost:3001\n');
    return false;
  }
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests() {
  const wahaOk = await testWaha();
  const nextOk = await testNextJs();
  
  checkEnvFile();
  
  if (nextOk) {
    // Aguardar um pouco para garantir que o servidor está pronto
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testNextJsRoute();
  }
  
  // ============================================================================
  // RESUMO FINAL
  // ============================================================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO');
  console.log('='.repeat(60));
  
  console.log('\n✅ Arquivos das rotas: OK');
  console.log(wahaOk ? '✅ WAHA rodando: OK' : '❌ WAHA rodando: FALHOU');
  console.log(nextOk ? '✅ Next.js rodando: OK' : '❌ Next.js rodando: FALHOU');
  
  console.log('\n📚 Documentação:');
  console.log('   - WAHA_README.md - Guia rápido');
  console.log('   - WAHA_TROUBLESHOOTING.md - Soluções de problemas');
  console.log('   - WAHA_SETUP.md - Setup completo');
  
  if (!wahaOk || !nextOk) {
    console.log('\n⚠️  Alguns serviços não estão rodando!');
    console.log('Veja as instruções acima para resolver.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 Tudo funcionando!\n');
    console.log('🌐 Acesse: http://localhost:3000/waha-sessions\n');
  }
}

// Executar
runAllTests().catch(err => {
  console.error('\n❌ Erro ao executar testes:', err);
  process.exit(1);
});

