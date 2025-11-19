"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = void 0;
exports.processMessageTemplate = processMessageTemplate;
exports.scheduleMessage = scheduleMessage;
const baileys_1 = __importStar(require("baileys"));
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
class WhatsAppService {
    constructor() {
        this.socket = null;
        this.status = { connected: false };
        this.messageQueue = [];
        this.isProcessing = false;
        this.initialized = false;
        // Não inicializar automaticamente para evitar problemas de importação
        // this.initialize()
    }
    async initialize() {
        try {
            // TODO: Implementar autenticação do WhatsApp corretamente
            // const { state, saveCreds } = await useMultiFileAuthState('./sessions')
            const state = null;
            const saveCreds = () => { };
            this.socket = (0, baileys_1.default)({
                auth: state,
                printQRInTerminal: true,
                logger: console,
                browser: ['WhatsApp Dispatcher', 'Chrome', '1.0.0']
            });
            this.socket.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    this.generateQRCode(qr);
                }
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
                    if (shouldReconnect) {
                        this.initialize();
                    }
                    else {
                        this.status.connected = false;
                    }
                }
                else if (connection === 'open') {
                    this.status.connected = true;
                    this.status.phoneNumber = this.socket?.user?.id?.split(':')[0];
                    this.status.lastSeen = new Date();
                    console.log('WhatsApp conectado com sucesso!');
                }
            });
            this.socket.ev.on('creds.update', saveCreds);
            // Processar fila de mensagens
            this.processMessageQueue();
        }
        catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
        }
    }
    async generateQRCode(qr) {
        try {
            const qrCodeDataURL = await qrcode_1.default.toDataURL(qr);
            this.status.qrCode = qrCodeDataURL;
            // Salvar QR Code como imagem
            const qrCodeBuffer = await qrcode_1.default.toBuffer(qr);
            fs_1.default.writeFileSync('./public/qr-code.png', qrCodeBuffer);
            console.log('QR Code gerado. Escaneie com seu WhatsApp.');
        }
        catch (error) {
            console.error('Erro ao gerar QR Code:', error);
        }
    }
    async processMessageQueue() {
        if (this.isProcessing || !this.socket || !this.status.connected) {
            return;
        }
        this.isProcessing = true;
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                try {
                    await this.sendMessage(message);
                    // Delay entre mensagens para evitar spam
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                    // Recolocar mensagem na fila em caso de erro
                    this.messageQueue.unshift(message);
                    break;
                }
            }
        }
        this.isProcessing = false;
    }
    async sendMessage(message) {
        if (!this.socket || !this.status.connected) {
            // Adicionar à fila se não estiver conectado
            this.messageQueue.push(message);
            return false;
        }
        try {
            const jid = `${message.to}@s.whatsapp.net`;
            let sentMessage;
            switch (message.type) {
                case 'text':
                    sentMessage = await this.socket.sendMessage(jid, { text: message.message });
                    break;
                case 'image':
                    if (message.mediaUrl) {
                        sentMessage = await this.socket.sendMessage(jid, {
                            image: { url: message.mediaUrl },
                            caption: message.message
                        });
                    }
                    break;
                case 'document':
                    if (message.mediaUrl) {
                        sentMessage = await this.socket.sendMessage(jid, {
                            document: { url: message.mediaUrl },
                            mimetype: 'application/pdf',
                            fileName: 'documento.pdf'
                        });
                    }
                    break;
                default:
                    throw new Error('Tipo de mensagem não suportado');
            }
            return !!sentMessage;
        }
        catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }
    async sendBulkMessages(messages) {
        let success = 0;
        let errors = 0;
        for (const message of messages) {
            try {
                const result = await this.sendMessage(message);
                if (result) {
                    success++;
                }
                else {
                    errors++;
                }
            }
            catch (error) {
                console.error('Erro ao enviar mensagem em lote:', error);
                errors++;
            }
        }
        return { success, errors };
    }
    async getStatus() {
        // Retornar status sem inicializar o Baileys para evitar problemas
        return { ...this.status };
    }
    async disconnect() {
        if (this.socket) {
            await this.socket.logout();
            this.socket = null;
            this.status.connected = false;
        }
    }
    async reconnect() {
        await this.disconnect();
        await this.initialize();
    }
    // Método para validar número de telefone
    validatePhoneNumber(phone) {
        // Remove todos os caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');
        // Verifica se tem pelo menos 10 dígitos (formato brasileiro)
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
    // Método para formatar número de telefone
    formatPhoneNumber(phone) {
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
}
// Singleton instance
exports.whatsappService = new WhatsAppService();
// Função para processar mensagens com variáveis
function processMessageTemplate(template, variables) {
    let processedMessage = template;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processedMessage = processedMessage.replace(regex, value);
    });
    return processedMessage;
}
// Função para agendar mensagens
function scheduleMessage(message, scheduleTime) {
    const now = new Date();
    const delay = scheduleTime.getTime() - now.getTime();
    if (delay > 0) {
        setTimeout(() => {
            exports.whatsappService.sendMessage(message);
        }, delay);
    }
    else {
        // Se o horário já passou, enviar imediatamente
        exports.whatsappService.sendMessage(message);
    }
}
