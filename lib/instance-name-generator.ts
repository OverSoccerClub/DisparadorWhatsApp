import crypto from 'crypto'

export interface InstanceNameOptions {
  userId: string
  prefix?: string
  length?: number
}

export class InstanceNameGenerator {
  private static readonly DEFAULT_PREFIX = 'inst'
  private static readonly DEFAULT_LENGTH = 8
  private static readonly MAX_ATTEMPTS = 10

  /**
   * Gera um nome de instância único e curto
   * Formato: {prefix}_{hash_curto}
   * Exemplo: inst_a1b2c3d4
   */
  static generateInstanceName(options: InstanceNameOptions): string {
    const { userId, prefix = this.DEFAULT_PREFIX, length = this.DEFAULT_LENGTH } = options
    
    // Criar hash baseado no userId + timestamp
    const timestamp = Date.now().toString()
    const hashInput = `${userId}_${timestamp}`
    const hash = crypto.createHash('md5').update(hashInput).digest('hex')
    
    // Pegar apenas os primeiros caracteres do hash
    const shortHash = hash.substring(0, length)
    
    return `${prefix}_${shortHash}`
  }

  /**
   * Gera um nome de instância baseado em timestamp
   * Formato: {prefix}_{timestamp_curto}
   * Exemplo: inst_1703123456
   */
  static generateTimestampBasedName(options: InstanceNameOptions): string {
    const { userId, prefix = this.DEFAULT_PREFIX } = options
    
    // Usar timestamp em base36 para ser mais curto
    const timestamp = Date.now().toString(36)
    
    // Adicionar parte do userId para garantir unicidade
    const userIdShort = userId.substring(0, 4)
    
    return `${prefix}_${timestamp}_${userIdShort}`
  }

  /**
   * Gera um nome de instância usando UUID curto
   * Formato: {prefix}_{uuid_curto}
   * Exemplo: inst_abc123def
   */
  static generateUUIDBasedName(options: InstanceNameOptions): string {
    const { prefix = this.DEFAULT_PREFIX } = options
    
    // Gerar UUID e pegar apenas parte dele
    const uuid = crypto.randomUUID().replace(/-/g, '')
    const shortUuid = uuid.substring(0, 8)
    
    return `${prefix}_${shortUuid}`
  }

  /**
   * Gera um nome de instância sequencial
   * Formato: {prefix}_{numero}
   * Exemplo: inst_001, inst_002
   */
  static generateSequentialName(options: InstanceNameOptions & { sequence?: number }): string {
    const { prefix = this.DEFAULT_PREFIX, sequence = 1 } = options
    
    const paddedSequence = sequence.toString().padStart(3, '0')
    return `${prefix}_${paddedSequence}`
  }

  /**
   * Gera um nome de instância com verificação de unicidade
   * Tenta diferentes métodos até encontrar um nome único
   */
  static async generateUniqueInstanceName(
    options: InstanceNameOptions,
    checkUniqueness: (name: string) => Promise<boolean>
  ): Promise<string> {
    const methods = [
      () => this.generateInstanceName(options),
      () => this.generateTimestampBasedName(options),
      () => this.generateUUIDBasedName(options),
      () => this.generateSequentialName({ ...options, sequence: Math.floor(Math.random() * 1000) + 1 })
    ]

    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const method = methods[attempt % methods.length]
      const name = method()
      
      const isUnique = await checkUniqueness(name)
      if (isUnique) {
        return name
      }
    }

    // Se não conseguir gerar um nome único, usar timestamp + random
    const fallbackName = `${options.prefix || this.DEFAULT_PREFIX}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    return fallbackName
  }

  /**
   * Valida se um nome de instância é válido
   */
  static validateInstanceName(name: string): { isValid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Nome da instância é obrigatório' }
    }

    if (name.length < 3) {
      return { isValid: false, error: 'Nome da instância deve ter pelo menos 3 caracteres' }
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Nome da instância deve ter no máximo 50 caracteres' }
    }

    // Verificar se contém apenas caracteres válidos (letras, números, underscore, hífen)
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(name)) {
      return { isValid: false, error: 'Nome da instância deve conter apenas letras, números, underscore e hífen' }
    }

    // Verificar se não começa com número
    if (/^[0-9]/.test(name)) {
      return { isValid: false, error: 'Nome da instância não pode começar com número' }
    }

    return { isValid: true }
  }

  /**
   * Gera um nome de instância personalizado
   * Permite ao usuário escolher um nome personalizado com validação
   */
  static generateCustomName(customName: string, options: InstanceNameOptions): string {
    const { prefix = this.DEFAULT_PREFIX } = options
    
    // Limpar e normalizar o nome personalizado
    const cleanName = customName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_-]/g, '') // Remover caracteres inválidos
      .substring(0, 20) // Limitar tamanho
    
    // Se o nome estiver vazio após limpeza, usar prefixo + timestamp
    if (!cleanName) {
      return this.generateTimestampBasedName(options)
    }
    
    return `${prefix}_${cleanName}`
  }
}

// Função utilitária para gerar nome de instância rapidamente
export function generateQuickInstanceName(userId: string): string {
  return InstanceNameGenerator.generateInstanceName({ userId })
}

// Função utilitária para gerar nome baseado em timestamp
export function generateTimestampInstanceName(userId: string): string {
  return InstanceNameGenerator.generateTimestampBasedName({ userId })
}

// Função utilitária para gerar nome com UUID
export function generateUUIDInstanceName(): string {
  return InstanceNameGenerator.generateUUIDBasedName({ userId: 'global' })
}
