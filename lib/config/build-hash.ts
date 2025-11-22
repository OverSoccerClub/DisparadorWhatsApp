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

// Tenta salvar em diferentes locais com base nas permissões disponíveis
function getBuildHashFilePath(): string | null {
  const modules = getNodeModules()
  if (!modules) {
    return null
  }
  
  const { fs, path } = modules
  
  if (typeof process === 'undefined' || !process.cwd) {
    return null
  }
  
  // Lista de locais possíveis para salvar (em ordem de preferência)
  const possiblePaths = [
    path.join(process.cwd(), 'BUILD_HASH.txt'), // Diretório raiz (preferido)
    path.join(process.cwd(), '.next', 'BUILD_HASH.txt'), // Dentro de .next
    path.join('/tmp', 'BUILD_HASH.txt'), // Diretório temporário
  ]
  
  // Retorna o primeiro caminho que existe ou pode ser escrito
  for (const filePath of possiblePaths) {
    try {
      const dir = path.dirname(filePath)
      // Verifica se o diretório existe e pode ser escrito
      if (fs.existsSync(dir)) {
        // Tenta escrever um arquivo de teste
        try {
          const testFile = path.join(dir, '.write-test')
          fs.writeFileSync(testFile, 'test')
          fs.unlinkSync(testFile)
          return filePath
        } catch {
          continue // Não tem permissão, tenta próximo
        }
      }
    } catch {
      continue
    }
  }
  
  return null // Nenhum local disponível para escrita
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
 * Tenta salvar em diferentes locais se não tiver permissão no diretório raiz
 */
export function saveBuildHash(hash?: string): string {
  const modules = getNodeModules()
  if (!modules) {
    throw new Error('saveBuildHash só pode ser usado no servidor')
  }
  
  const { fs } = modules
  const buildHash = hash || generateBuildHash()
  
  // Tenta encontrar um local com permissão de escrita
  const filePath = getBuildHashFilePath()
  const targetPath = filePath || BUILD_HASH_FILE
  
  try {
    fs.writeFileSync(targetPath, buildHash, 'utf-8')
    return buildHash
  } catch (error: any) {
    // Se não conseguir salvar, apenas loga o erro mas não falha
    // O hash ainda é retornado para uso
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      console.error('Erro ao salvar hash de build:', error.message)
    }
    // Em produção, é comum não ter permissão de escrita, então apenas retorna o hash
    return buildHash
  }
}

// Cache em memória para evitar regenerar o hash a cada chamada
let cachedBuildHash: string | null = null

/**
 * Lê o hash de build do arquivo BUILD_HASH.txt
 * Se o arquivo não existir, gera um novo hash
 * Usa cache em memória para evitar regenerar
 */
export function getBuildHash(): string {
  // Retorna hash em cache se disponível
  if (cachedBuildHash) {
    return cachedBuildHash
  }
  
  const modules = getNodeModules()
  if (!modules) {
    throw new Error('getBuildHash só pode ser usado no servidor')
  }
  
  const { fs, path } = modules
  
  // Lista de locais possíveis para ler (em ordem de preferência)
  const possiblePaths = [
    path.join(process.cwd(), 'BUILD_HASH.txt'),
    path.join(process.cwd(), '.next', 'BUILD_HASH.txt'),
    path.join('/tmp', 'BUILD_HASH.txt'),
  ]
  
  // Tenta ler de qualquer um dos locais possíveis
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const hash = fs.readFileSync(filePath, 'utf-8').trim()
        if (hash && hash.length === 12) {
          cachedBuildHash = hash
          return hash
        }
      }
    } catch (error) {
      // Continua tentando outros locais
      continue
    }
  }
  
  // Se não conseguir ler de nenhum lugar, gera um novo hash
  // Em runtime (API), não tenta salvar para evitar erros de permissão
  // O hash é gerado durante o build, então em produção geralmente já existe
  const buildHash = generateBuildHash()
  
  // Apenas tenta salvar se estiver em ambiente de desenvolvimento/build
  // Em produção/runtime, não tenta salvar para evitar erros de permissão
  const isRuntime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE
  if (!isRuntime) {
    try {
      saveBuildHash(buildHash)
    } catch {
      // Ignora erro de escrita em runtime
    }
  }
  
  cachedBuildHash = buildHash
  return buildHash
}


