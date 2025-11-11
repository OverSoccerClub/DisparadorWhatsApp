/**
 * Helper para lidar com rate limits do Supabase
 * Implementa retry com backoff exponencial
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, delay: number) => void
}

/**
 * Executa uma função com retry automático em caso de rate limit (429)
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Verificar se é rate limit (429)
      const isRateLimit = 
        error?.status === 429 ||
        error?.code === 'over_request_rate_limit' ||
        error?.__isAuthError === true && error?.status === 429

      // Se não for rate limit ou já esgotou as tentativas, lançar erro
      if (!isRateLimit || attempt === maxRetries) {
        throw error
      }

      // Calcular delay com backoff exponencial
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      
      if (onRetry) {
        onRetry(attempt + 1, delay)
      } else {
        console.warn(`[RateLimit] Tentativa ${attempt + 1}/${maxRetries + 1} falhou com rate limit. Aguardando ${delay}ms...`)
      }

      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Wrapper para supabase.auth.getUser() com retry automático
 */
export async function getUserWithRetry(
  supabase: any,
  options: RetryOptions = {}
): Promise<{ data: { user: any } | null; error: any }> {
  return withRateLimitRetry(
    async () => {
      const result = await supabase.auth.getUser()
      
      // Se retornou erro de rate limit, lançar para triggerar retry
      if (result.error && (
        result.error.status === 429 ||
        result.error.code === 'over_request_rate_limit'
      )) {
        throw result.error
      }
      
      return result
    },
    options
  )
}

