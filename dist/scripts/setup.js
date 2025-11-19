#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
console.log('🚀 Configurando WhatsApp Dispatcher...\n');
// Verificar se o Node.js está instalado
try {
    const nodeVersion = process.version;
    console.log(`✅ Node.js ${nodeVersion} detectado`);
}
catch (error) {
    console.error('❌ Node.js não encontrado. Instale o Node.js 18+ primeiro.');
    process.exit(1);
}
// Verificar se o Redis está rodando
console.log('🔍 Verificando Redis...');
try {
    execSync('redis-cli ping', { stdio: 'pipe' });
    console.log('✅ Redis está rodando');
}
catch (error) {
    console.log('⚠️  Redis não encontrado. Instale e inicie o Redis:');
    console.log('   Ubuntu/Debian: sudo apt-get install redis-server');
    console.log('   macOS: brew install redis');
    console.log('   Windows: Baixe Redis for Windows');
}
// Criar diretórios necessários
const directories = ['sessions', 'public'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório ${dir} criado`);
    }
});
// Verificar arquivo .env.local
if (!fs.existsSync('.env.local')) {
    console.log('⚠️  Arquivo .env.local não encontrado');
    console.log('📝 Crie o arquivo .env.local com as seguintes variáveis:');
    console.log(`
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_CODE_PATH=./public/qr-code.png

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
  `);
}
else {
    console.log('✅ Arquivo .env.local encontrado');
}
// Instalar dependências
console.log('\n📦 Instalando dependências...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas com sucesso');
}
catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
    process.exit(1);
}
console.log('\n🎉 Configuração concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no arquivo .env.local');
console.log('2. Execute o schema SQL no Supabase (supabase/schema.sql)');
console.log('3. Execute: npm run dev');
console.log('4. Acesse: http://localhost:3000');
console.log('\n📚 Consulte o README.md para mais informações');
