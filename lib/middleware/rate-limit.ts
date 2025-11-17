/**
 * Rate Limiting Middleware
 * 
 * Implementa rate limiting para APIs usando armazenamento em memória.
 * Para produção em escala, considere usar Redis ou um serviço externo.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// Armazenamento em memória (para produção, use Redis)
const store: RateLimitStore = {}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 60000) // Limpar a cada minuto

export interface RateLimitOptions {
  windowMs?: number // Janela de tempo em milissegundos (padrão: 1 minuto)
  max?: number // Número máximo de requisições (padrão: 100)
  message?: string // Mensagem de erro personalizada
  skipSuccessfulRequests?: boolean // Não contar requisições bem-sucedidas
  skipFailedRequests?: boolean // Não contar requisições com falha
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  message?: string
}

/**
 * Cria uma chave única para rate limiting baseada em IP ou userId
 */
function getRateLimitKey(identifier: string, route: string): string {
  return `rate_limit:${route}:${identifier}`
}

/**
 * Verifica e atualiza o rate limit
 */
export function checkRateLimit(
  identifier: string,
  route: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    windowMs = 60000, // 1 minuto padrão
    max = 100, // 100 requisições padrão
    message = 'Muitas requisições. Tente novamente em alguns instantes.',
  } = options

  const key = getRateLimitKey(identifier, route)
  const now = Date.now()

  // Obter ou criar entrada
  let entry = store[key]

  if (!entry || entry.resetAt < now) {
    // Nova janela de tempo
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store[key] = entry
  } else {
    // Incrementar contador
    entry.count++
  }

  const remaining = Math.max(0, max - entry.count)
  const success = entry.count <= max

  return {
    success,
    limit: max,
    remaining,
    reset: entry.resetAt,
    message: success ? undefined : message,
  }
}

/**
 * Middleware para Next.js API Routes
 */
export function withRateLimit(
  handler: (req: any, res: any) => Promise<any>,
  options: RateLimitOptions & {
    getIdentifier?: (req: any) => string | Promise<string>
  } = {}
) {
  return async (req: any, res: any) => {
    const { getIdentifier, ...rateLimitOptions } = options

    // Obter identificador (IP ou userId)
    let identifier = 'anonymous'
    if (getIdentifier) {
      identifier = await getIdentifier(req) || 'anonymous'
    } else {
      // Tentar obter IP do request
      const forwarded = req.headers?.['x-forwarded-for']
      const ip = forwarded 
        ? forwarded.split(',')[0].trim()
        : req.headers?.['x-real-ip'] 
        || req.socket?.remoteAddress
        || 'unknown'
      identifier = ip
    }

    // Obter rota
    const route = req.url || req.nextUrl?.pathname || 'unknown'

    // Verificar rate limit
    const rateLimitResult = checkRateLimit(identifier, route, rateLimitOptions)

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.message || 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: new Date(rateLimitResult.reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Adicionar headers de rate limit na resposta
    const response = await handler(req, res)
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString())
    }

    return response
  }
}

/**
 * Presets de rate limiting
 */
export const rateLimitPresets = {
  // Rate limit para usuários anônimos
  anonymous: {
    windowMs: 60000, // 1 minuto
    max: 100, // 100 requisições por minuto
  },
  
  // Rate limit para usuários autenticados
  authenticated: {
    windowMs: 60000, // 1 minuto
    max: 1000, // 1000 requisições por minuto
  },
  
  // Rate limit para APIs críticas (ex: envio de mensagens)
  critical: {
    windowMs: 60000, // 1 minuto
    max: 10, // 10 requisições por minuto
  },
  
  // Rate limit para autenticação
  auth: {
    windowMs: 900000, // 15 minutos
    max: 5, // 5 tentativas por 15 minutos
  },
}

