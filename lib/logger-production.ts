/**
 * Sistema de Logs para Produção
 * 
 * Fornece logging estruturado com níveis adequados para produção.
 * Em produção, logs são enviados para console (pode ser redirecionado para serviços externos).
 * Em desenvolvimento, logs são mais verbosos.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: string
  message: string
  timestamp: string
  meta?: any
  error?: {
    message: string
    stack?: string
    name?: string
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = isDevelopment 
  ? LogLevel.DEBUG 
  : (process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO)

/**
 * Formata entrada de log para produção
 */
function formatLog(level: string, message: string, meta?: any, error?: Error): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (meta) {
    entry.meta = meta
  }

  if (error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    }
  }

  return entry
}

/**
 * Output do log (pode ser estendido para enviar para serviços externos)
 */
function outputLog(entry: LogEntry) {
  const logString = JSON.stringify(entry)
  
  switch (entry.level) {
    case 'ERROR':
      console.error(logString)
      break
    case 'WARN':
      console.warn(logString)
      break
    case 'INFO':
      console.info(logString)
      break
    case 'DEBUG':
      console.debug(logString)
      break
    default:
      console.log(logString)
  }
}

export const logger = {
  /**
   * Log de erro - sempre logado, mesmo em produção
   */
  error: (message: string, error?: Error | any, meta?: any) => {
    if (LogLevel.ERROR <= logLevel) {
      const err = error instanceof Error ? error : undefined
      const errorMeta = error && !(error instanceof Error) ? error : meta
      outputLog(formatLog('ERROR', message, errorMeta, err))
    }
  },

  /**
   * Log de aviso - logado em produção
   */
  warn: (message: string, meta?: any) => {
    if (LogLevel.WARN <= logLevel) {
      outputLog(formatLog('WARN', message, meta))
    }
  },

  /**
   * Log de informação - logado em produção
   */
  info: (message: string, meta?: any) => {
    if (LogLevel.INFO <= logLevel) {
      outputLog(formatLog('INFO', message, meta))
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (message: string, meta?: any) => {
    if (LogLevel.DEBUG <= logLevel) {
      outputLog(formatLog('DEBUG', message, meta))
    }
  },

  /**
   * Log de requisição HTTP
   */
  http: (method: string, path: string, statusCode: number, duration?: number, meta?: any) => {
    if (LogLevel.INFO <= logLevel) {
      outputLog(formatLog('INFO', `${method} ${path} ${statusCode}`, {
        ...meta,
        method,
        path,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
      }))
    }
  },

  /**
   * Log de operação de banco de dados
   */
  db: (operation: string, table: string, duration?: number, meta?: any) => {
    if (LogLevel.DEBUG <= logLevel || (duration && duration > 1000)) {
      outputLog(formatLog('DEBUG', `DB ${operation} ${table}`, {
        ...meta,
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      }))
    }
  },
}

/**
 * Helper para logar erros de API
 */
export function logApiError(
  route: string,
  error: Error | any,
  requestMeta?: {
    method?: string
    userId?: string
    body?: any
  }
) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  logger.error(`API Error: ${route}`, error, {
    route,
    ...requestMeta,
    stack: errorStack,
  })
}

/**
 * Helper para logar operações de usuário
 */
export function logUserAction(
  action: string,
  userId: string,
  meta?: any
) {
  logger.info(`User Action: ${action}`, {
    action,
    userId,
    ...meta,
  })
}

