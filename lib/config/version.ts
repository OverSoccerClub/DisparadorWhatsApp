/**
 * Configuração centralizada de versão do sistema
 * 
 * Esta é a fonte única de verdade para a versão do sistema.
 * A versão é lida do package.json em tempo de build e exposta
 * através de variável de ambiente NEXT_PUBLIC_APP_VERSION.
 */

// Versão padrão (fallback caso a variável de ambiente não esteja definida)
// Esta deve ser atualizada manualmente se necessário, mas o ideal é usar
// a variável de ambiente NEXT_PUBLIC_APP_VERSION que é definida no build
const DEFAULT_VERSION = '0.1.7'

/**
 * Obtém a versão do sistema
 * Prioriza a variável de ambiente NEXT_PUBLIC_APP_VERSION,
 * caso contrário usa a versão padrão
 * 
 * A variável NEXT_PUBLIC_APP_VERSION é definida no next.config.js
 * e está disponível tanto no cliente quanto no servidor após o build
 */
export function getAppVersion(): string {
  // No Next.js, variáveis NEXT_PUBLIC_* definidas em next.config.js
  // são automaticamente injetadas no cliente e servidor
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION
  }
  
  return DEFAULT_VERSION
}

/**
 * Versão do sistema (exportada como constante para uso direto)
 * Nota: Em componentes client-side, use getAppVersion() para garantir
 * que a variável de ambiente esteja disponível
 */
export const APP_VERSION = getAppVersion()

/**
 * Formata a versão com o prefixo "v"
 */
export function formatVersion(version?: string): string {
  const v = version || getAppVersion()
  return `v${v}`
}

/**
 * Obtém informações completas de versão
 */
export function getVersionInfo() {
  const version = getAppVersion()
  return {
    version,
    formatted: formatVersion(version),
    buildDate: new Date().toISOString().split('T')[0],
    buildDateFormatted: new Date().toLocaleDateString('pt-BR')
  }
}

