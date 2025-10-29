/**
 * Utilitário de logging otimizado para produção
 * Remove todos os logs em produção para melhor performance
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // Erros sempre devem ser logados, mesmo em produção (mas sem cor/emoji)
    if (isDevelopment) {
      console.error(...args)
    } else {
      console.error(...args.map(arg => typeof arg === 'string' ? arg.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') : arg))
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  }
}

