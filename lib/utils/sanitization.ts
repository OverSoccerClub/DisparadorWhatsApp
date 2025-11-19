/**
 * Utilitários de Sanitização
 * 
 * Fornece funções para sanitizar dados antes de inserção no banco.
 * IMPORTANTE: O Supabase já protege contra SQL injection, mas é bom
 * sanitizar dados para prevenir XSS e outros ataques.
 */

/**
 * Remove tags HTML e caracteres perigosos
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }

  // Remove tags HTML
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Remove caracteres especiais perigosos
  sanitized = sanitized.replace(/[<>'"&]/g, '')
  
  return sanitized.trim()
}

/**
 * Sanitiza string mas permite alguns caracteres HTML básicos
 */
export function sanitizeStringAllowBasic(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }

  // Remove apenas tags script e style
  let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '')
  
  // Remove eventos JavaScript
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  return sanitized.trim()
}

/**
 * Sanitiza número (remove caracteres não numéricos)
 */
export function sanitizeNumber(input: any): number | null {
  if (input === null || input === undefined || input === '') {
    return null
  }

  const num = Number(input)
  return isNaN(num) ? null : num
}

/**
 * Sanitiza email (remove caracteres perigosos mas mantém formato)
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return ''
  }

  // Remove caracteres perigosos mas mantém formato de email
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"&]/g, '')
    .replace(/\s+/g, '')
}

/**
 * Sanitiza telefone (remove caracteres não numéricos)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return ''
  }

  // Remove tudo exceto números
  return phone.replace(/\D/g, '')
}

/**
 * Sanitiza URL (valida e limpa)
 */
export function sanitizeURL(url: string): string | null {
  if (typeof url !== 'string') {
    return null
  }

  try {
    const parsed = new URL(url)
    // Permite apenas http e https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  // Usar any internamente para evitar restrições de indexação genérica
  const sanitized: any = { ...obj }

  Object.keys(sanitized).forEach((key: string) => {
    const value = sanitized[key]

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    }
  })

  return sanitized as T
}

/**
 * Sanitiza objeto mas preserva campos específicos
 */
export function sanitizeObjectPreserve<T extends Record<string, any>>(
  obj: T,
  preserveFields: (keyof T)[]
): T {
  const sanitized: any = { ...obj }

  Object.keys(sanitized).forEach((key: string) => {
    if (preserveFields.includes(key as keyof T)) {
      // Preservar campo sem sanitização
      return
    }

    const value = sanitized[key]

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObjectPreserve(value, [])
    }
  })

  return sanitized as T
}

