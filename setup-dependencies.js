const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Configurando dependências...');

try {
  // Verificar se package.json existe
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json não encontrado!');
    process.exit(1);
  }

  // Instalar dependências
  console.log('📦 Instalando dependências...');
  execSync('npm install', { stdio: 'inherit' });

  // Verificar se Next.js está instalado
  console.log('✅ Verificando Next.js...');
  execSync('npm list next', { stdio: 'inherit' });

  console.log('✅ Dependências configuradas com sucesso!');
  console.log('🚀 Execute: npm run dev');

} catch (error) {
  console.error('❌ Erro ao configurar dependências:', error.message);
  process.exit(1);
}
