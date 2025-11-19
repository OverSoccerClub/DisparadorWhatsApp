/**
 * Script para atualizar automaticamente o CHANGELOG.md durante o versionamento
 * 
 * Este script é chamado automaticamente pelo script de versionamento
 * e move as entradas de [Não Publicado] para a nova versão com data atual
 */

const fs = require('fs')
const path = require('path')

const CHANGELOG_FILE = path.join(process.cwd(), 'CHANGELOG.md')

function formatDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateChangelogForVersion(version) {
  try {
    let content = fs.readFileSync(CHANGELOG_FILE, 'utf-8')
    const date = formatDate()
    
    // Encontrar a seção [Não Publicado]
    const unpublishedSection = '## [Não Publicado]'
    const unpublishedIndex = content.indexOf(unpublishedSection)
    
    if (unpublishedIndex === -1) {
      console.log('⚠️ Seção [Não Publicado] não encontrada. Criando...')
      // Criar seção se não existir
      const header = '# Changelog - Fluxus Message\n\n'
      const newSection = `## [Não Publicado]\n\n### Adicionado\n- Funcionalidades em desenvolvimento\n\n## [${version}] - ${date}\n\n### Adicionado\n- Versão inicial\n\n`
      content = header + newSection
    } else {
      // Extrair conteúdo da seção [Não Publicado]
      const nextSectionMatch = content.substring(unpublishedIndex).match(/\n## \[/g)
      const nextSectionIndex = nextSectionMatch && nextSectionMatch.length > 1
        ? content.indexOf('\n## [', unpublishedIndex + unpublishedSection.length)
        : content.length
      
      const unpublishedContent = content.substring(
        unpublishedIndex + unpublishedSection.length,
        nextSectionIndex
      ).trim()
      
      // Se não houver conteúdo, criar uma entrada padrão
      const versionContent = unpublishedContent && unpublishedContent.length > 0
        ? unpublishedContent
        : '\n### Adicionado\n- Atualização de versão\n'
      
      // Criar nova seção de versão
      const newVersionSection = `\n## [${version}] - ${date}${versionContent}\n`
      
      // Substituir [Não Publicado] por nova versão e recriar [Não Publicado]
      const beforeUnpublished = content.substring(0, unpublishedIndex)
      const afterUnpublished = content.substring(nextSectionIndex)
      
      const newUnpublishedSection = `## [Não Publicado]\n\n### Adicionado\n- Funcionalidades em desenvolvimento\n\n`
      
      content = beforeUnpublished + newVersionSection + newUnpublishedSection + afterUnpublished
    }
    
    fs.writeFileSync(CHANGELOG_FILE, content, 'utf-8')
    console.log(`✅ CHANGELOG.md atualizado para versão ${version}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao atualizar CHANGELOG:', error)
    return false
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const version = process.argv[2]
  if (!version) {
    console.error('❌ Versão não fornecida')
    console.error('Uso: node scripts/auto-update-changelog.js <versão>')
    process.exit(1)
  }
  updateChangelogForVersion(version)
}

module.exports = { updateChangelogForVersion, formatDate }

