"use strict";
/**
 * Utilitários de Validação
 *
 * Fornece funções de validação reutilizáveis para inputs de API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequired = validateRequired;
exports.validateMaxLength = validateMaxLength;
exports.validateMinLength = validateMinLength;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validateURL = validateURL;
exports.validateNumber = validateNumber;
exports.validateInteger = validateInteger;
exports.validateUUID = validateUUID;
exports.validateAll = validateAll;
exports.validateObject = validateObject;
/**
 * Valida se uma string não está vazia
 */
function validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return {
            valid: false,
            errors: [`${fieldName} é obrigatório`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida tamanho máximo de string
 */
function validateMaxLength(value, maxLength, fieldName) {
    if (value && value.length > maxLength) {
        return {
            valid: false,
            errors: [`${fieldName} deve ter no máximo ${maxLength} caracteres`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida tamanho mínimo de string
 */
function validateMinLength(value, minLength, fieldName) {
    if (value && value.length < minLength) {
        return {
            valid: false,
            errors: [`${fieldName} deve ter no mínimo ${minLength} caracteres`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida formato de email
 */
function validateEmail(email) {
    if (!email) {
        return { valid: true, errors: [] }; // Email opcional, use validateRequired se for obrigatório
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            errors: ['Email inválido'],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida formato de telefone (Brasil)
 */
function validatePhone(phone) {
    if (!phone) {
        return { valid: true, errors: [] }; // Telefone opcional
    }
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Valida formato brasileiro (10 ou 11 dígitos)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return {
            valid: false,
            errors: ['Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida formato de URL
 */
function validateURL(url) {
    if (!url) {
        return { valid: true, errors: [] }; // URL opcional
    }
    try {
        new URL(url);
        return { valid: true, errors: [] };
    }
    catch {
        return {
            valid: false,
            errors: ['URL inválida'],
        };
    }
}
/**
 * Valida se é um número
 */
function validateNumber(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return { valid: true, errors: [] }; // Número opcional
    }
    if (typeof value !== 'number' && isNaN(Number(value))) {
        return {
            valid: false,
            errors: [`${fieldName} deve ser um número`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida se é um número inteiro
 */
function validateInteger(value, fieldName) {
    const numberResult = validateNumber(value, fieldName);
    if (!numberResult.valid) {
        return numberResult;
    }
    if (value !== null && value !== undefined && value !== '' && !Number.isInteger(Number(value))) {
        return {
            valid: false,
            errors: [`${fieldName} deve ser um número inteiro`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida se é um UUID
 */
function validateUUID(uuid, fieldName) {
    if (!uuid) {
        return { valid: true, errors: [] }; // UUID opcional
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        return {
            valid: false,
            errors: [`${fieldName} deve ser um UUID válido`],
        };
    }
    return { valid: true, errors: [] };
}
/**
 * Valida múltiplas regras
 */
function validateAll(...results) {
    const allErrors = results.flatMap(r => r.errors);
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
    };
}
/**
 * Valida objeto com múltiplos campos
 */
function validateObject(obj, rules) {
    const errors = [];
    Object.keys(rules).forEach(key => {
        const validator = rules[key];
        if (validator) {
            const result = validator(obj[key]);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }
    });
    return {
        valid: errors.length === 0,
        errors,
    };
}
