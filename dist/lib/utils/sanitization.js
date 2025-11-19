"use strict";
/**
 * Utilitários de Sanitização
 *
 * Fornece funções para sanitizar dados antes de inserção no banco.
 * IMPORTANTE: O Supabase já protege contra SQL injection, mas é bom
 * sanitizar dados para prevenir XSS e outros ataques.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = sanitizeString;
exports.sanitizeStringAllowBasic = sanitizeStringAllowBasic;
exports.sanitizeNumber = sanitizeNumber;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizePhone = sanitizePhone;
exports.sanitizeURL = sanitizeURL;
exports.sanitizeObject = sanitizeObject;
exports.sanitizeObjectPreserve = sanitizeObjectPreserve;
/**
 * Remove tags HTML e caracteres perigosos
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return String(input);
    }
    // Remove tags HTML
    let sanitized = input.replace(/<[^>]*>/g, '');
    // Remove caracteres de controle
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    // Remove caracteres especiais perigosos
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    return sanitized.trim();
}
/**
 * Sanitiza string mas permite alguns caracteres HTML básicos
 */
function sanitizeStringAllowBasic(input) {
    if (typeof input !== 'string') {
        return String(input);
    }
    // Remove apenas tags script e style
    let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');
    // Remove eventos JavaScript
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    return sanitized.trim();
}
/**
 * Sanitiza número (remove caracteres não numéricos)
 */
function sanitizeNumber(input) {
    if (input === null || input === undefined || input === '') {
        return null;
    }
    const num = Number(input);
    return isNaN(num) ? null : num;
}
/**
 * Sanitiza email (remove caracteres perigosos mas mantém formato)
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }
    // Remove caracteres perigosos mas mantém formato de email
    return email
        .toLowerCase()
        .trim()
        .replace(/[<>'"&]/g, '')
        .replace(/\s+/g, '');
}
/**
 * Sanitiza telefone (remove caracteres não numéricos)
 */
function sanitizePhone(phone) {
    if (typeof phone !== 'string') {
        return '';
    }
    // Remove tudo exceto números
    return phone.replace(/\D/g, '');
}
/**
 * Sanitiza URL (valida e limpa)
 */
function sanitizeURL(url) {
    if (typeof url !== 'string') {
        return null;
    }
    try {
        const parsed = new URL(url);
        // Permite apenas http e https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed.toString();
    }
    catch {
        return null;
    }
}
/**
 * Sanitiza objeto recursivamente
 */
function sanitizeObject(obj) {
    const sanitized = { ...obj };
    Object.keys(sanitized).forEach(key => {
        const value = sanitized[key];
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        }
        else if (typeof value === 'number') {
            sanitized[key] = sanitizeNumber(value);
        }
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) : item);
        }
        else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        }
    });
    return sanitized;
}
/**
 * Sanitiza objeto mas preserva campos específicos
 */
function sanitizeObjectPreserve(obj, preserveFields) {
    const sanitized = { ...obj };
    Object.keys(sanitized).forEach(key => {
        if (preserveFields.includes(key)) {
            // Preservar campo sem sanitização
            return;
        }
        const value = sanitized[key];
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        }
        else if (typeof value === 'number') {
            sanitized[key] = sanitizeNumber(value);
        }
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) : item);
        }
        else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObjectPreserve(value, []);
        }
    });
    return sanitized;
}
