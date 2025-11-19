"use strict";
/**
 * Sistema de Logs para Produção
 *
 * Fornece logging estruturado com níveis adequados para produção.
 * Em produção, logs são enviados para console (pode ser redirecionado para serviços externos).
 * Em desenvolvimento, logs são mais verbosos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
exports.logApiError = logApiError;
exports.logUserAction = logUserAction;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = isDevelopment
    ? LogLevel.DEBUG
    : (process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO);
/**
 * Formata entrada de log para produção
 */
function formatLog(level, message, meta, error) {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };
    if (meta) {
        entry.meta = meta;
    }
    if (error) {
        entry.error = {
            message: error.message,
            stack: error.stack,
            name: error.name,
        };
    }
    return entry;
}
/**
 * Output do log (pode ser estendido para enviar para serviços externos)
 */
function outputLog(entry) {
    const logString = JSON.stringify(entry);
    switch (entry.level) {
        case 'ERROR':
            console.error(logString);
            break;
        case 'WARN':
            console.warn(logString);
            break;
        case 'INFO':
            console.info(logString);
            break;
        case 'DEBUG':
            console.debug(logString);
            break;
        default:
            console.log(logString);
    }
}
exports.logger = {
    /**
     * Log de erro - sempre logado, mesmo em produção
     */
    error: (message, error, meta) => {
        if (LogLevel.ERROR <= logLevel) {
            const err = error instanceof Error ? error : undefined;
            const errorMeta = error && !(error instanceof Error) ? error : meta;
            outputLog(formatLog('ERROR', message, errorMeta, err));
        }
    },
    /**
     * Log de aviso - logado em produção
     */
    warn: (message, meta) => {
        if (LogLevel.WARN <= logLevel) {
            outputLog(formatLog('WARN', message, meta));
        }
    },
    /**
     * Log de informação - logado em produção
     */
    info: (message, meta) => {
        if (LogLevel.INFO <= logLevel) {
            outputLog(formatLog('INFO', message, meta));
        }
    },
    /**
     * Log de debug - apenas em desenvolvimento
     */
    debug: (message, meta) => {
        if (LogLevel.DEBUG <= logLevel) {
            outputLog(formatLog('DEBUG', message, meta));
        }
    },
    /**
     * Log de requisição HTTP
     */
    http: (method, path, statusCode, duration, meta) => {
        if (LogLevel.INFO <= logLevel) {
            outputLog(formatLog('INFO', `${method} ${path} ${statusCode}`, {
                ...meta,
                method,
                path,
                statusCode,
                duration: duration ? `${duration}ms` : undefined,
            }));
        }
    },
    /**
     * Log de operação de banco de dados
     */
    db: (operation, table, duration, meta) => {
        if (LogLevel.DEBUG <= logLevel || (duration && duration > 1000)) {
            outputLog(formatLog('DEBUG', `DB ${operation} ${table}`, {
                ...meta,
                operation,
                table,
                duration: duration ? `${duration}ms` : undefined,
            }));
        }
    },
};
/**
 * Helper para logar erros de API
 */
function logApiError(route, error, requestMeta) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    exports.logger.error(`API Error: ${route}`, error, {
        route,
        ...requestMeta,
        stack: errorStack,
    });
}
/**
 * Helper para logar operações de usuário
 */
function logUserAction(action, userId, meta) {
    exports.logger.info(`User Action: ${action}`, {
        action,
        userId,
        ...meta,
    });
}
