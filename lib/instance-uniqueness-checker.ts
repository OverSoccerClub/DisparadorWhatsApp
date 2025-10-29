import { EvolutionConfigService } from './supabase/evolution-config-service'

export interface UniquenessCheckResult {
  isUnique: boolean
  existsInSupabase?: boolean
  existsInEvolutionAPI?: boolean
  error?: string
}

export class InstanceUniquenessChecker {
  /**
   * Verifica se um nome de instância é único
   * Verifica tanto no Supabase quanto na Evolution API
   */
  static async checkInstanceNameUniqueness(
    instanceName: string,
    userId: string,
    evolutionApiUrl?: string,
    evolutionApiKey?: string
  ): Promise<UniquenessCheckResult> {
    try {
      // 1. Verificar no Supabase primeiro (mais rápido)
      const supabaseResult = await this.checkInSupabase(instanceName, userId)
      if (!supabaseResult.isUnique) {
        return {
          isUnique: false,
          existsInSupabase: true,
          error: 'Nome da instância já existe no banco de dados'
        }
      }

      // 2. Se temos credenciais da Evolution API, verificar lá também
      if (evolutionApiUrl && evolutionApiKey) {
        const evolutionResult = await this.checkInEvolutionAPI(
          instanceName,
          evolutionApiUrl,
          evolutionApiKey
        )
        
        if (!evolutionResult.isUnique) {
          return {
            isUnique: false,
            existsInEvolutionAPI: true,
            error: 'Nome da instância já existe na Evolution API'
          }
        }
      }

      return { isUnique: true }
    } catch (error) {
      console.error('Erro ao verificar unicidade da instância:', error)
      return {
        isUnique: false,
        error: 'Erro ao verificar unicidade da instância'
      }
    }
  }

  /**
   * Verifica se o nome existe no Supabase
   */
  private static async checkInSupabase(
    instanceName: string,
    userId: string
  ): Promise<UniquenessCheckResult> {
    try {
      const result = await EvolutionConfigService.getInstance(userId, instanceName)
      
      if (result.success && result.data) {
        return {
          isUnique: false,
          existsInSupabase: true
        }
      }

      return { isUnique: true }
    } catch (error) {
      console.error('Erro ao verificar no Supabase:', error)
      return {
        isUnique: false,
        error: 'Erro ao verificar no banco de dados'
      }
    }
  }

  /**
   * Verifica se o nome existe na Evolution API
   */
  private static async checkInEvolutionAPI(
    instanceName: string,
    apiUrl: string,
    apiKey: string
  ): Promise<UniquenessCheckResult> {
    try {
      const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      })

      // Se a API retorna 200, significa que a instância existe
      if (response.ok) {
        return {
          isUnique: false,
          existsInEvolutionAPI: true
        }
      }

      // Se retorna 404, significa que não existe (único)
      if (response.status === 404) {
        return { isUnique: true }
      }

      // Outros status codes podem indicar erro na API
      return {
        isUnique: false,
        error: 'Erro ao verificar na Evolution API'
      }
    } catch (error) {
      console.error('Erro ao verificar na Evolution API:', error)
      return {
        isUnique: false,
        error: 'Erro ao conectar com a Evolution API'
      }
    }
  }

  /**
   * Verifica múltiplos nomes de uma vez
   */
  static async checkMultipleNames(
    instanceNames: string[],
    userId: string,
    evolutionApiUrl?: string,
    evolutionApiKey?: string
  ): Promise<{ [name: string]: UniquenessCheckResult }> {
    const results: { [name: string]: UniquenessCheckResult } = {}

    // Verificar todos os nomes em paralelo
    const promises = instanceNames.map(async (name) => {
      const result = await this.checkInstanceNameUniqueness(
        name,
        userId,
        evolutionApiUrl,
        evolutionApiKey
      )
      return { name, result }
    })

    const resolvedResults = await Promise.all(promises)

    resolvedResults.forEach(({ name, result }) => {
      results[name] = result
    })

    return results
  }

  /**
   * Encontra o primeiro nome único de uma lista
   */
  static async findFirstUniqueName(
    instanceNames: string[],
    userId: string,
    evolutionApiUrl?: string,
    evolutionApiKey?: string
  ): Promise<{ name: string; isUnique: boolean } | null> {
    for (const name of instanceNames) {
      const result = await this.checkInstanceNameUniqueness(
        name,
        userId,
        evolutionApiUrl,
        evolutionApiKey
      )
      
      if (result.isUnique) {
        return { name, isUnique: true }
      }
    }

    return null
  }
}

// Função utilitária para verificar unicidade rapidamente
export async function isInstanceNameUnique(
  instanceName: string,
  userId: string,
  evolutionApiUrl?: string,
  evolutionApiKey?: string
): Promise<boolean> {
  const result = await InstanceUniquenessChecker.checkInstanceNameUniqueness(
    instanceName,
    userId,
    evolutionApiUrl,
    evolutionApiKey
  )
  
  return result.isUnique
}
