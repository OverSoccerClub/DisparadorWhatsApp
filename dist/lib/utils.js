"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatPhoneNumber = formatPhoneNumber;
exports.validatePhoneNumber = validatePhoneNumber;
exports.formatDate = formatDate;
exports.formatCurrency = formatCurrency;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatPhoneNumber(phone) {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    // Se começar com 55 (Brasil), mantém
    if (cleaned.startsWith('55')) {
        return cleaned;
    }
    // Se começar com 0, remove o 0 e adiciona 55
    if (cleaned.startsWith('0')) {
        return '55' + cleaned.substring(1);
    }
    // Se não tem código do país, adiciona 55
    if (cleaned.length <= 11) {
        return '55' + cleaned;
    }
    return cleaned;
}
function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    // Número brasileiro válido: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
    return /^55\d{10,11}$/.test(cleaned);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
