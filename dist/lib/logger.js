"use strict";
/**
 * Utilitário de logging otimizado para produção
 * Remove todos os logs em produção para melhor performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDevelopment = process.env.NODE_ENV === 'development';
exports.logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    error: (...args) => {
        // Erros sempre devem ser logados, mesmo em produção (mas sem cor/emoji)
        if (isDevelopment) {
            console.error(...args);
        }
        else {
            console.error(...args.map(arg => typeof arg === 'string' ? arg.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') : arg));
        }
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};
