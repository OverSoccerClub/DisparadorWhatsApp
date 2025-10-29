const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Corrigindo problemas do servidor...');

try {
  // Parar todos os processos Node.js
  console.log('🛑 Parando processos Node.js...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  } catch (e) {
    // Ignorar se não houver processos
  }

  // Limpar cache
  console.log('🧹 Limpando cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // Remover pastas de cache
  console.log('🗑️ Removendo pastas de cache...');
  try {
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
    }
    if (fs.existsSync('node_modules')) {
      fs.rmSync('node_modules', { recursive: true, force: true });
    }
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
    }
  } catch (e) {
    console.log('⚠️ Erro ao remover pastas:', e.message);
  }

  // Reinstalar dependências
  console.log('📦 Reinstalando dependências...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('✅ Correção concluída!');
  console.log('🚀 Execute: npm run dev');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
