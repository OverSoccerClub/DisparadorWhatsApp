/**
 * Script para atualizar o CHANGELOG.md
 * 
 * Uso: node scripts/update-changelog.js "tipo" "descrição"
 * 
 * Tipos: added, changed, fixed, removed, security
 * 
 * Exemplo:
 * node scripts/update-changelog.js "added" "Nova funcionalidade de exportação"
 */

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const CHANGELOG_FILE = join(process.cwd(), 'CHANGELOG.md')

const typeMap = {
  'added': 'Adicionado',
  'changed': 'Alterado',
  'fixed': 'Corrigido',
  'removed': 'Removido',
  'security': 'Segurança'
}

function updateChangelog(type, description) {
  if (!type || !description) {
    console.error('❌ Uso: node scripts/update-changelog.js "tipo" "descrição"')
    console.error('Tipos: added, changed, fixed, removed, security')
    process.exit(1)
  }

  const mappedType = typeMap[type.toLowerCase()]
  if (!mappedType) {
    console.error(`❌ Tipo inválido: ${type}`)
    console.error('Tipos válidos: added, changed, fixed, removed, security')
    process.exit(1)
  }

  try {
    let content = readFileSync(CHANGELOG_FILE, 'utf-8')
    
    // Encontrar a seção [Não Publicado]
    const unpublishedSection = '## [Não Publicado]'
    const unpublishedIndex = content.indexOf(unpublishedSection)
    
    if (unpublishedIndex === -1) {
      console.error('❌ Seção [Não Publicado] não encontrada no CHANGELOG.md')
      process.exit(1)
    }

    // Encontrar a próxima seção ou o final do arquivo
    const nextSectionMatch = content.substring(unpublishedIndex).match(/\n## \[/g)
    const nextSectionIndex = nextSectionMatch 
      ? content.indexOf('\n## [', unpublishedIndex + unpublishedSection.length)
      : content.length

    // Encontrar a subseção do tipo
    const typeSection = `### ${mappedType}`
    const typeSectionIndex = content.indexOf(typeSection, unpublishedIndex)
    
    let newContent
    if (typeSectionIndex !== -1 && typeSectionIndex < nextSectionIndex) {
      // Subseção existe, adicionar item
      const endOfTypeSection = content.indexOf('\n### ', typeSectionIndex + typeSection.length)
      const insertIndex = endOfTypeSection !== -1 && endOfTypeSection < nextSectionIndex
        ? endOfTypeSection
        : nextSectionIndex
      
      newContent = 
        content.substring(0, insertIndex) +
        `- ${description}\n` +
        content.substring(insertIndex)
    } else {
      // Subseção não existe, criar nova
      const insertIndex = content.indexOf('\n### ', unpublishedIndex)
      const insertPoint = insertIndex !== -1 && insertIndex < nextSectionIndex
        ? insertIndex
        : nextSectionIndex
      
      newContent = 
        content.substring(0, insertPoint) +
        `\n### ${mappedType}\n- ${description}\n` +
        content.substring(insertPoint)
    }

    writeFileSync(CHANGELOG_FILE, newContent, 'utf-8')
    console.log(`✅ CHANGELOG.md atualizado: ${mappedType} - ${description}`)
  } catch (error) {
    console.error('❌ Erro ao atualizar CHANGELOG:', error)
    process.exit(1)
  }
}

const [,, type, ...descriptionParts] = process.argv
const description = descriptionParts.join(' ')

updateChangelog(type, description)

