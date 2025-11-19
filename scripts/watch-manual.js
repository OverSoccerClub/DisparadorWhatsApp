/**
 * Script para monitorar mudanças e atualizar o manual automaticamente
 * 
 * Este script pode ser executado em modo watch durante o desenvolvimento
 * para manter o manual sempre atualizado
 */

const { watch } = require('fs')
const { updateManual } = require('./generate-manual')
const path = require('path')

const PAGES_DIR = path.join(process.cwd(), 'pages')
const COMPONENTS_DIR = path.join(process.cwd(), 'components')

console.log('👀 Monitorando mudanças no sistema para atualizar o manual...')
console.log('📁 Diretórios monitorados:')
console.log(`   - ${PAGES_DIR}`)
console.log(`   - ${COMPONENTS_DIR}`)
console.log('\n💡 Pressione Ctrl+C para parar\n')

// Atualizar manual inicialmente
updateManual()

// Monitorar mudanças
let updateTimeout
function scheduleUpdate() {
  clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    console.log('\n🔄 Mudanças detectadas, atualizando manual...')
    updateManual()
    console.log('✅ Manual atualizado!\n')
  }, 1000) // Debounce de 1 segundo
}

// Monitorar diretórios
try {
  watch(PAGES_DIR, { recursive: true }, scheduleUpdate)
  watch(COMPONENTS_DIR, { recursive: true }, scheduleUpdate)
  console.log('✅ Monitoramento ativo')
} catch (error) {
  console.error('❌ Erro ao iniciar monitoramento:', error.message)
  console.log('💡 Executando atualização única...')
  updateManual()
}

