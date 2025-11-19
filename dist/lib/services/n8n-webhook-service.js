"use strict";
/**
 * Serviço para integração com n8n via webhook
 *
 * Este serviço facilita o envio de dados para workflows n8n,
 * especialmente para envio de mensagens via WhatsApp.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendActivationCodeViaWhatsApp = sendActivationCodeViaWhatsApp;
/**
 * Envia código de ativação via WhatsApp através do n8n
 */
async function sendActivationCodeViaWhatsApp(params) {
    const { name, phone, code, email } = params;
    // Validar parâmetros
    if (!phone || !code) {
        return {
            success: false,
            error: 'Telefone e código são obrigatórios'
        };
    }
    // URL do webhook n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
        console.warn('⚠️ N8N_WEBHOOK_URL não configurada');
        return {
            success: false,
            error: 'Webhook n8n não configurado',
            message: 'Configure N8N_WEBHOOK_URL nas variáveis de ambiente'
        };
    }
    // Normalizar telefone
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    // Formatar telefone para formato internacional
    let formattedPhone = normalizedPhone;
    if (normalizedPhone.length === 11 && !normalizedPhone.startsWith('+')) {
        formattedPhone = `55${normalizedPhone}`;
    }
    // Preparar mensagem
    const message = `Olá ${name}! 👋\n\n` +
        `Seu código de ativação é: *${code}*\n\n` +
        `Use este código para ativar sua conta no WhatsApp Dispatcher.\n\n` +
        `Este código expira em 24 horas.\n\n` +
        `_Se você não solicitou este código, ignore esta mensagem._`;
    // Payload para n8n
    const payload = {
        phone: formattedPhone,
        message: message,
        code: code,
        name: name,
        email: email,
        type: 'activation_code',
        timestamp: new Date().toISOString()
    };
    try {
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro ao enviar para n8n:', {
                status: response.status,
                error: errorText
            });
            return {
                success: false,
                error: `n8n retornou status ${response.status}`,
                message: 'Erro ao enviar código via WhatsApp'
            };
        }
        const n8nResponse = await response.json().catch(() => ({}));
        return {
            success: true,
            message: 'Código enviado via WhatsApp com sucesso',
            phone: formattedPhone,
            n8nResponse: n8nResponse
        };
    }
    catch (error) {
        console.error('Erro ao chamar webhook n8n:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao conectar com n8n'
        };
    }
}
