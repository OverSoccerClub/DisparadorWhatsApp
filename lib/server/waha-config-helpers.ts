import type { PostgrestSingleResponse } from '@supabase/supabase-js'

/**
 * Representa o registro bruto retornado pelo Supabase para a tabela `waha_servers`.
 */
export interface WahaServerRecord {
  id: string
  user_id: string
  nome: string
  api_url: string
  api_key?: string | null
  descricao?: string | null
  ativo?: boolean | null
  webhook_url?: string | null
  webhook_secret?: string | null
  timeout?: number | null
  retry_attempts?: number | null
  rate_limit?: number | null
  enable_auto_reconnect?: boolean | null
  enable_qr_code?: boolean | null
  enable_presence?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface FormattedWahaServer {
  id: string
  name: string
  apiUrl: string
  apiKey?: string | null
  webhookUrl?: string | null
  webhookSecret?: string | null
  timeout: number
  retryAttempts: number
  rateLimit: number
  enableAutoReconnect: boolean
  enableQrCode: boolean
  enablePresence: boolean
  ativo: boolean
  status: {
    connected: boolean
    lastTest: string | null
    responseTime: number | null
    errors: number
    instances: number
    activeConnections: number
  }
  createdAt?: string
  updatedAt?: string
}

/**
 * Normaliza a URL da API garantindo que não termine com `/` e possua protocolo.
 * Complexidade: O(1) em relação ao tamanho da string.
 */
export const normalizeApiUrl = (url: string): string => {
  if (!url) return ''

  const trimmed = url.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

/**
 * Constrói os headers necessários para autenticar na WAHA API.
 * Complexidade: O(1).
 */
export const buildWahaHeaders = (apiKey?: string | null) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey && apiKey.trim() !== '') {
    const sanitizedKey = apiKey.trim()
    headers['X-Api-Key'] = sanitizedKey
    headers['Authorization'] = `Bearer ${sanitizedKey}`
  }
  return headers
}

/**
 * Formata o registro do Supabase para o formato esperado no frontend.
 * Complexidade: O(1) relativa ao número de campos.
 */
export const formatWahaServer = (record: WahaServerRecord): FormattedWahaServer => ({
  id: record.id,
  name: record.nome,
  apiUrl: record.api_url,
  apiKey: record.api_key,
  webhookUrl: record.webhook_url || '',
  webhookSecret: record.webhook_secret || '',
  timeout: record.timeout ?? 30,
  retryAttempts: record.retry_attempts ?? 3,
  rateLimit: record.rate_limit ?? 100,
  enableAutoReconnect: record.enable_auto_reconnect ?? true,
  enableQrCode: record.enable_qr_code ?? true,
  enablePresence: record.enable_presence ?? true,
  ativo: record.ativo ?? true,
  status: {
    connected: false,
    lastTest: null,
    responseTime: null,
    errors: 0,
    instances: 0,
    activeConnections: 0
  },
  createdAt: record.created_at,
  updatedAt: record.updated_at
})

/**
 * Helper que valida respostas do Supabase e lança erros legíveis.
 */
export const assertSupabaseResponse = <T>(response: PostgrestSingleResponse<T>) => {
  if (response.error || !response.data) {
    throw response.error ?? new Error('Registro não encontrado')
  }
  return response.data
}

