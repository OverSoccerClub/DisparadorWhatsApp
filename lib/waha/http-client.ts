import { Buffer } from 'node:buffer'
import { normalizeApiUrl } from '../server/waha-config-helpers'

const DEFAULT_TIMEOUT_MS = 15000

/**
 * Erro especializado para chamadas WAHA, preservando status HTTP e corpo.
 */
export class WahaHttpError extends Error {
  public readonly status: number
  public readonly body?: string

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'WahaHttpError'
    this.status = status
    this.body = body
  }
}

export interface WahaHttpClientConfig {
  baseUrl: string
  apiKey?: string | null
  timeoutMs?: number
}

export type WahaResponseType = 'json' | 'text' | 'arrayBuffer'

export interface WahaRequestOptions {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  responseType?: WahaResponseType
  signal?: AbortSignal
  accept?: string
}

export interface WahaHttpResponse<T> {
  status: number
  headers: Headers
  data: T
}

/**
 * Cliente HTTP enxuto para padronizar chamadas WAHA.
 * Complexidade: O(1) por requisição (desconsiderando I/O).
 */
export class WahaHttpClient {
  private readonly baseUrl: string
  private readonly apiKey?: string
  private readonly timeoutMs: number

  constructor(config: WahaHttpClientConfig) {
    if (!config.baseUrl) {
      throw new Error('WAHA base URL é obrigatória')
    }

    this.baseUrl = normalizeApiUrl(config.baseUrl)
    this.apiKey = config.apiKey?.trim() || undefined
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  /**
   * Executa uma requisição tipada para a WAHA API.
   */
  async request<T>(options: WahaRequestOptions): Promise<WahaHttpResponse<T>> {
    const method = options.method ?? 'GET'
    const headers = this.buildHeaders(options.headers, options.accept, options.body)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${options.path}`, {
        method,
        headers,
        body: this.serializeBody(method, options.body, headers),
        signal: options.signal ?? controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new WahaHttpError(
          `WAHA request failed with status ${response.status}`,
          response.status,
          errorText
        )
      }

      const data = await this.parseResponse<T>(response, options.responseType)
      return {
        status: response.status,
        headers: response.headers,
        data,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    accept?: string,
    body?: unknown
  ) {
    const headers: Record<string, string> = {}

    if (this.apiKey && !headers['X-Api-Key']) {
      headers['X-Api-Key'] = this.apiKey
    }

    if (this.apiKey && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    if (accept) {
      headers['Accept'] = accept
    }

    if (body !== undefined && body !== null) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders)
    }

    if (!headers['Accept']) {
      headers['Accept'] = 'application/json'
    }

    return headers
  }

  private serializeBody(method: string, body: unknown, headers: Record<string, string>) {
    if (!body || method === 'GET' || method === 'HEAD') {
      return undefined
    }

    if (typeof body === 'string' || body instanceof Buffer || body instanceof ArrayBuffer) {
      return body as BodyInit
    }

    if (headers['Content-Type']?.includes('application/json')) {
      return JSON.stringify(body)
    }

    return body as BodyInit
  }

  private async parseResponse<T>(response: Response, type: WahaResponseType = 'json'): Promise<T> {
    switch (type) {
      case 'text':
        return (await response.text()) as T
      case 'arrayBuffer':
        return (await response.arrayBuffer()) as T
      default: {
        const text = await response.text()
        if (!text) return {} as T
        try {
          return JSON.parse(text) as T
        } catch (error) {
          throw new WahaHttpError(
            'Resposta JSON inválida recebida da WAHA API',
            response.status,
            text
          )
        }
      }
    }
  }
}

