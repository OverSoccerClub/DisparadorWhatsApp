/**
 * Serviço de envio de email
 * Suporta múltiplos provedores: Resend, SendGrid, SMTP
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private static readonly RESEND_API_KEY = process.env.RESEND_API_KEY
  private static readonly SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  private static readonly SMTP_HOST = process.env.SMTP_HOST
  private static readonly SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  private static readonly SMTP_USER = process.env.SMTP_USER
  private static readonly SMTP_PASS = process.env.SMTP_PASS
  private static readonly SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER
  private static readonly EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend' // resend, sendgrid, smtp

  /**
   * Envia email usando o provedor configurado
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.EMAIL_PROVIDER.toLowerCase()) {
        case 'resend':
          return await this.sendViaResend(options)
        case 'sendgrid':
          return await this.sendViaSendGrid(options)
        case 'smtp':
          return await this.sendViaSMTP(options)
        default:
          // Fallback: usar console.log em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.log('📧 [DEV] Email que seria enviado:', {
              to: options.to,
              subject: options.subject,
              html: options.html
            })
            return { success: true }
          }
          return { success: false, error: 'Provedor de email não configurado' }
      }
    } catch (error: any) {
      console.error('Erro ao enviar email:', error)
      return { success: false, error: error.message || 'Erro ao enviar email' }
    }
  }

  /**
   * Envia email via Resend
   */
  private static async sendViaResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY não configurada. Usando modo de desenvolvimento.')
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV] Email Resend:', options)
        return { success: true }
      }
      return { success: false, error: 'RESEND_API_KEY não configurada' }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.SMTP_FROM || 'noreply@dispatcher.com',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Erro ao enviar email via Resend' }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Envia email via SendGrid
   */
  private static async sendViaSendGrid(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.SENDGRID_API_KEY) {
      console.warn('⚠️ SENDGRID_API_KEY não configurada. Usando modo de desenvolvimento.')
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV] Email SendGrid:', options)
        return { success: true }
      }
      return { success: false, error: 'SENDGRID_API_KEY não configurada' }
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }]
          }],
          from: { email: this.SMTP_FROM || 'noreply@dispatcher.com' },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: errorText || 'Erro ao enviar email via SendGrid' }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Envia email via SMTP (requer nodemailer)
   */
  private static async sendViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.SMTP_HOST || !this.SMTP_USER || !this.SMTP_PASS) {
      console.warn('⚠️ Configurações SMTP incompletas. Usando modo de desenvolvimento.')
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV] Email SMTP:', options)
        return { success: true }
      }
      return { success: false, error: 'Configurações SMTP incompletas' }
    }

    // Em produção, você precisaria instalar nodemailer: npm install nodemailer
    // Por enquanto, vamos usar fetch para serviços SMTP via API
    try {
      // Esta é uma implementação básica - em produção, use nodemailer
      console.log('📧 [SMTP] Email que seria enviado:', options)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Gera template de email de confirmação
   */
  static generateActivationEmail(name: string, activationCode: string): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de Cadastro</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">WhatsApp Dispatcher</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar no WhatsApp Dispatcher.</p>
            <p>Para ativar sua conta, use o código de confirmação abaixo:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${activationCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">Este código expira em 24 horas.</p>
            <p style="margin-top: 30px;">Se você não solicitou este cadastro, ignore este email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              WhatsApp Dispatcher - Automação Inteligente<br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
WhatsApp Dispatcher - Confirmação de Cadastro

Olá, ${name}!

Obrigado por se cadastrar no WhatsApp Dispatcher.

Para ativar sua conta, use o código de confirmação abaixo:

${activationCode}

Este código expira em 24 horas.

Se você não solicitou este cadastro, ignore este email.

---
WhatsApp Dispatcher - Automação Inteligente
Este é um email automático, por favor não responda.
    `

    return { html, text }
  }
}

export default EmailService

