/**
 * Sistema de hash de build
 * 
 * Gera e gerencia um hash hexadecimal de 12 dígitos para cada build do sistema.
 * O hash é gerado automaticamente durante o build e armazenado em BUILD_HASH.txt
 */

// Este módulo só pode ser usado no servidor (Node.js)
// Não importe diretamente em componentes client-side

let fs: typeof import('fs') | null = null
let path: typeof import('path') | null = null
let crypto: typeof import('crypto') | null = null

// Lazy loading para evitar erros em ambiente cliente
function getNodeModules() {
  if (typeof window !== 'undefined') {
    return null // Cliente não tem acesso a módulos Node.js
  }
  
  if (!fs || !path || !crypto) {
    try {
      fs = require('fs')
      path = require('path')
      crypto = require('crypto')
    } catch {
      return null
    }
  }
  
  return { fs, path, crypto }
}

const BUILD_HASH_FILE = typeof process !== 'undefined' && process.cwd 
  ? require('path').join(process.cwd(), 'BUILD_HASH.txt')
  : 'BUILD_HASH.txt'

/**
 * Gera um hash hexadecimal de 12 dígitos
 * Usa timestamp + versão + random para garantir unicidade
 */
export function generateBuildHash(): string {
  const modules = getNodeModules()
  if (!modules) {
    throw new Error('generateBuildHash só pode ser usado no servidor')
  }
  
  const { crypto } = modules
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 15)
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.10'
  
  const hashInput = `${timestamp}-${version}-${random}`
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
  
  // Retorna os primeiros 12 caracteres do hash
  return hash.substring(0, 12).toUpperCase()
}

/**
 * Salva o hash de build no arquivo BUILD_HASH.txt
 */
export function saveBuildHash(hash?: string): string {
  const modules = getNodeModules()
  if (!modules) {
    throw new Error('saveBuildHash só pode ser usado no servidor')
  }
  
  const { fs } = modules
  const buildHash = hash || generateBuildHash()
  
  try {
    fs.writeFileSync(BUILD_HASH_FILE, buildHash, 'utf-8')
    return buildHash
  } catch (error) {
    console.error('Erro ao salvar hash de build:', error)
    return buildHash
  }
}

/**
 * Lê o hash de build do arquivo BUILD_HASH.txt
 * Se o arquivo não existir, gera um novo hash
 */
export function getBuildHash(): string {
  const modules = getNodeModules()
  if (!modules) {
    throw new Error('getBuildHash só pode ser usado no servidor')
  }
  
  const { fs } = modules
  
  try {
    if (fs.existsSync(BUILD_HASH_FILE)) {
      const hash = fs.readFileSync(BUILD_HASH_FILE, 'utf-8').trim()
      if (hash && hash.length === 12) {
        return hash
      }
    }
  } catch (error) {
    console.error('Erro ao ler hash de build:', error)
  }
  
  // Se não conseguir ler, gera um novo hash
  return saveBuildHash()
}


