import { 
  default as makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  ConnectionState,
  WASocket
} from 'baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export interface WhatsAppMessage {
  to: string
  message: string
  type: 'text' | 'image' | 'document'
  mediaUrl?: string
}

export interface WhatsAppStatus {
  connected: boolean
  qrCode?: string
  phoneNumber?: string
  lastSeen?: Date
}

class WhatsAppService {
  private socket: WASocket | null = null
  private status: WhatsAppStatus = { connected: false }
  private messageQueue: WhatsAppMessage[] = []
  private isProcessing = false
  private initialized = false

  constructor() {
    // Não inicializar automaticamente para evitar problemas de importação
    // this.initialize()
  }

  public async initialize() {
    try {
      // TODO: Implementar autenticação do WhatsApp corretamente
      // const { state, saveCreds } = await useMultiFileAuthState('./sessions')
      const state: any = null
      const saveCreds = () => {}

      // Cast as any para evitar incompatibilidades de tipos entre versões do baileys
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: console,
        browser: ['WhatsApp Dispatcher', 'Chrome', '1.0.0']
      } as any)

      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
          this.generateQRCode(qr)
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
          if (shouldReconnect) {
            this.initialize()
          } else {
            this.status.connected = false
          }
        } else if (connection === 'open') {
          this.status.connected = true
          this.status.phoneNumber = this.socket?.user?.id?.split(':')[0]
          this.status.lastSeen = new Date()
          console.log('WhatsApp conectado com sucesso!')
        }
      })

      this.socket.ev.on('creds.update', saveCreds)

      // Processar fila de mensagens
      this.processMessageQueue()

    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error)
    }
  }

  private async generateQRCode(qr: string) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qr)
      this.status.qrCode = qrCodeDataURL
      
      // Salvar QR Code como imagem
      const qrCodeBuffer = await QRCode.toBuffer(qr)
      fs.writeFileSync('./public/qr-code.png', qrCodeBuffer)
      
      console.log('QR Code gerado. Escaneie com seu WhatsApp.')
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
  }

  private async processMessageQueue() {
    if (this.isProcessing || !this.socket || !this.status.connected) {
      return
    }

    this.isProcessing = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        try {
          await this.sendMessage(message)
          // Delay entre mensagens para evitar spam
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error)
          // Recolocar mensagem na fila em caso de erro
          this.messageQueue.unshift(message)
          break
        }
      }
    }

    this.isProcessing = false
  }

  public async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    if (!this.socket || !this.status.connected) {
      // Adicionar à fila se não estiver conectado
      this.messageQueue.push(message)
      return false
    }

    try {
      const jid = `${message.to}@s.whatsapp.net`
      
      let sentMessage
      switch (message.type) {
        case 'text':
          sentMessage = await this.socket.sendMessage(jid, { text: message.message })
          break
        case 'image':
          if (message.mediaUrl) {
            sentMessage = await this.socket.sendMessage(jid, {
              image: { url: message.mediaUrl },
              caption: message.message
            })
          }
          break
        case 'document':
          if (message.mediaUrl) {
            sentMessage = await this.socket.sendMessage(jid, {
              document: { url: message.mediaUrl },
              mimetype: 'application/pdf',
              fileName: 'documento.pdf'
            })
          }
          break
        default:
          throw new Error('Tipo de mensagem não suportado')
      }

      return !!sentMessage
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      throw error
    }
  }

  public async sendBulkMessages(messages: WhatsAppMessage[]): Promise<{ success: number; errors: number }> {
    let success = 0
    let errors = 0

    for (const message of messages) {
      try {
        const result = await this.sendMessage(message)
        if (result) {
          success++
        } else {
          errors++
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem em lote:', error)
        errors++
      }
    }

    return { success, errors }
  }

  public async getStatus(): Promise<WhatsAppStatus> {
    // Retornar status sem inicializar o Baileys para evitar problemas
    return { ...this.status }
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      await this.socket.logout()
      this.socket = null
      this.status.connected = false
    }
  }

  public async reconnect(): Promise<void> {
    await this.disconnect()
    await this.initialize()
  }

  // Método para validar número de telefone
  public validatePhoneNumber(phone: string): boolean {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '')
    
    // Verifica se tem pelo menos 10 dígitos (formato brasileiro)
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  // Método para formatar número de telefone
  public formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    
    // Se começar com 55 (Brasil), mantém
    if (cleaned.startsWith('55')) {
      return cleaned
    }
    
    // Se começar com 0, remove o 0 e adiciona 55
    if (cleaned.startsWith('0')) {
      return '55' + cleaned.substring(1)
    }
    
    // Se não tem código do país, adiciona 55
    if (cleaned.length <= 11) {
      return '55' + cleaned
    }
    
    return cleaned
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService()

// Função para processar mensagens com variáveis
export function processMessageTemplate(template: string, variables: Record<string, string>): string {
  let processedMessage = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    processedMessage = processedMessage.replace(regex, value)
  })
  
  return processedMessage
}

// Função para agendar mensagens
export function scheduleMessage(message: WhatsAppMessage, scheduleTime: Date): void {
  const now = new Date()
  const delay = scheduleTime.getTime() - now.getTime()
  
  if (delay > 0) {
    setTimeout(() => {
      whatsappService.sendMessage(message)
    }, delay)
  } else {
    // Se o horário já passou, enviar imediatamente
    whatsappService.sendMessage(message)
  }
}
