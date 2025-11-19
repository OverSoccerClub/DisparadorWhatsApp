/**
 * Script para gerar hash de build
 * 
 * Este script gera um hash hexadecimal de 12 dígitos e salva em BUILD_HASH.txt
 * Deve ser executado antes de cada build de produção
 */

const { writeFileSync } = require('fs')
const { join } = require('path')
const crypto = require('crypto')

const BUILD_HASH_FILE = join(process.cwd(), 'BUILD_HASH.txt')

function generateBuildHash() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 15)
  const version = process.env.npm_package_version || '0.1.10'
  
  const hashInput = `${timestamp}-${version}-${random}`
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
  
  // Retorna os primeiros 12 caracteres do hash em maiúsculas
  return hash.substring(0, 12).toUpperCase()
}

try {
  const buildHash = generateBuildHash()
  writeFileSync(BUILD_HASH_FILE, buildHash, 'utf-8')
  console.log(`✅ Hash de build gerado: ${buildHash}`)
  console.log(`📁 Salvo em: ${BUILD_HASH_FILE}`)
} catch (error) {
  console.error('❌ Erro ao gerar hash de build:', error)
  process.exit(1)
}

