import { Buffer } from 'node:buffer'
import { WahaHttpClient, WahaHttpClientConfig, WahaHttpError } from './http-client'

type Logger = Pick<typeof console, 'log' | 'warn' | 'error'>

export interface FetchQrCodeOptions extends WahaHttpClientConfig {
  sessionName: string
  logger?: Logger
}

export interface FetchQrCodeResult {
  qrCode: string
  method: 'POST' | 'GET'
  contentType: string
  source: 'json' | 'image'
}

/**
 * Serviço especializado em garantir a disponibilidade do QR Code WAHA.
 * Complexidade: dominada pelas chamadas HTTP (O(1) CPU).
 */
export class WahaQrService {
  private readonly client: WahaHttpClient
  private readonly logger: Logger

  constructor(clientConfig: WahaHttpClientConfig, logger: Logger = console) {
    this.client = new WahaHttpClient(clientConfig)
    this.logger = logger
  }

  /**
   * Busca o QR Code garantindo fallback GET quando o servidor retorna PNG binário.
   */
  async fetchQrCode(sessionName: string): Promise<FetchQrCodeResult> {
    const normalizedSession = sessionName.trim()
    await this.ensureSession(normalizedSession)

    try {
      return await this.requestQrWithPost(normalizedSession)
    } catch (error) {
      if (error instanceof WahaHttpError && error.status === 404) {
        this.logger.warn(`WAHA POST /auth/qr retornou 404 para ${normalizedSession}, tentando GET`)
        return this.requestQrWithGet(normalizedSession)
      }
      throw error
    }
  }

  private async ensureSession(sessionName: string) {
    try {
      const sessionsResponse = await this.client.request<unknown[]>({
        path: '/api/sessions',
        method: 'GET',
      })

      const exists = Array.isArray(sessionsResponse.data)
        ? sessionsResponse.data.some((session: any) => session?.name === sessionName)
        : false

      if (exists) return
    } catch (error) {
      this.logger.warn(`Não foi possível listar sessões antes de iniciar ${sessionName}:`, error)
    }

    await this.tryCreateSession(sessionName)
    await this.tryStartSession(sessionName)
  }

  private async tryCreateSession(sessionName: string) {
    try {
      await this.client.request({
        path: `/api/${encodeURIComponent(sessionName)}`,
        method: 'POST',
        body: {},
      })
      this.logger.log(`Sessão ${sessionName} criada com sucesso`)
    } catch (error) {
      if (error instanceof WahaHttpError && error.status === 409) {
        this.logger.log(`Sessão ${sessionName} já existia (409)`)
        return
      }
      this.logger.warn(`Falha ao criar sessão ${sessionName}:`, error)
    }
  }

  private async tryStartSession(sessionName: string) {
    try {
      await this.client.request({
        path: `/api/${encodeURIComponent(sessionName)}/start`,
        method: 'POST',
      })
      this.logger.log(`Sessão ${sessionName} iniciada com sucesso`)
    } catch (error) {
      this.logger.warn(`Falha ao iniciar sessão ${sessionName}:`, error)
    }
  }

  private async requestQrWithPost(sessionName: string): Promise<FetchQrCodeResult> {
    const { data, headers } = await this.client.request<unknown>({
      path: `/api/${encodeURIComponent(sessionName)}/auth/qr`,
      method: 'POST',
    })

    const qrCode = this.extractQrValue(data)
    if (!qrCode) {
      throw new Error('Formato de QR code não reconhecido na resposta POST')
    }

    return {
      qrCode,
      method: 'POST',
      contentType: headers.get('content-type') ?? 'application/json',
      source: 'json',
    }
  }

  private async requestQrWithGet(sessionName: string): Promise<FetchQrCodeResult> {
    const response = await this.client.request<ArrayBuffer>({
      path: `/api/${encodeURIComponent(sessionName)}/auth/qr`,
      method: 'GET',
      responseType: 'arrayBuffer',
      accept: 'application/json,image/png',
    })

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    if (contentType.includes('json')) {
      const asText = Buffer.from(response.data).toString('utf-8')
      const json = this.safeParse(asText)
      const qrCode = this.extractQrValue(json)
      if (!qrCode) {
        throw new Error('Formato de QR code JSON não reconhecido na resposta GET')
      }
      return {
        qrCode,
        method: 'GET',
        contentType,
        source: 'json',
      }
    }

    const qrCode = this.bufferToDataUrl(response.data, contentType)
    return {
      qrCode,
      method: 'GET',
      contentType,
      source: 'image',
    }
  }

  private extractQrValue(payload: unknown): string | null {
    if (!payload) return null
    if (typeof payload === 'string') return payload
    if (Array.isArray(payload) && payload.length > 0) {
      return this.extractQrValue(payload[0])
    }
    if (typeof payload === 'object') {
      const qrLike = (payload as Record<string, unknown>).qr
        ?? (payload as Record<string, unknown>).qrCode
        ?? (payload as Record<string, unknown>).data
      return typeof qrLike === 'string' ? qrLike : null
    }
    return null
  }

  private bufferToDataUrl(buffer: ArrayBuffer, contentType: string) {
    const mime = contentType || 'image/png'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${mime};base64,${base64}`
  }

  private safeParse<T = unknown>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
}

export const fetchQrCode = (options: FetchQrCodeOptions) => {
  const service = new WahaQrService(options, options.logger)
  return service.fetchQrCode(options.sessionName)
}

