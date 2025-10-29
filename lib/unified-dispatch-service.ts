/**
 * Serviço Unificado de Disparos
 * 
 * Abstração que gerencia envio de mensagens via Evolution API ou WAHA API
 * de forma transparente, permitindo mudança de método em tempo real.
 */

export type DispatchMethod = 'evolution' | 'waha'

export interface InstanceInfo {
  id: string
  name: string
  displayName: string
  status: string
  phoneNumber?: string
  method: DispatchMethod
  serverId?: string // Para WAHA
  serverName?: string // Para WAHA
}

export interface DispatchParams {
  method: DispatchMethod
  telefones: string[]
  mensagem: string
  messageVariations?: string[]
  enableVariations: boolean
  useAI?: boolean
  userId: string
  
  // Para distribuição
  useLoadBalancing?: boolean
  selectedInstanceOrSession?: string
  
  // Para Evolution API
  useRandomDistribution?: boolean
  selectedInstance?: string
  
  // Para WAHA API
  selectedSession?: string
  
  // Controle de tempo
  timeControl?: {
    delayMinutes: number
    delaySeconds: number
    totalTimeHours: number
    totalTimeMinutes: number
    autoCalculate: boolean
  }
}

export interface DispatchResult {
  success: boolean
  message: string
  data?: any
  error?: string
  details?: {
    totalMessages: number
    sentMessages: number
    failedMessages: number
    method: DispatchMethod
    instanceOrSession?: string
  }
}

export class UnifiedDispatchService {
  /**
   * Carrega instâncias/sessões disponíveis para o método selecionado
   */
  static async loadAvailableInstances(
    method: DispatchMethod,
    userId: string
  ): Promise<InstanceInfo[]> {
    try {
      if (method === 'evolution') {
        return await this.loadEvolutionInstances(userId)
      } else {
        return await this.loadWahaSessions(userId)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar instâncias/sessões:', error)
      return []
    }
  }

  /**
   * Carrega instâncias da Evolution API
   */
  private static async loadEvolutionInstances(userId: string): Promise<InstanceInfo[]> {
    try {
      console.log('🔄 Carregando instâncias Evolution API...')
      const response = await fetch('/api/evolution/instances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('❌ Erro ao carregar instâncias Evolution:', response.status)
        return []
      }

      const data = await response.json()
      
      if (!data.success || !data.instances) {
        console.error('❌ Resposta inválida da API Evolution:', data)
        return []
      }

      // Mapear instâncias para formato unificado
      const instances: InstanceInfo[] = data.instances.map((inst: any) => ({
        id: inst.instance.instanceName || inst.instance_name || inst.instanceName,
        name: inst.instance.instanceName || inst.instance_name || inst.instanceName,
        displayName: inst.instance.instanceName || inst.instance_name || inst.instanceName,
        status: inst.instance.state || inst.state || 'unknown',
        phoneNumber: inst.instance.owner || inst.owner,
        method: 'evolution' as DispatchMethod
      }))

      console.log('✅ Instâncias Evolution carregadas:', instances.length)
      return instances
    } catch (error) {
      console.error('❌ Erro ao carregar instâncias Evolution:', error)
      return []
    }
  }

  /**
   * Carrega sessões da WAHA API
   */
  private static async loadWahaSessions(userId: string): Promise<InstanceInfo[]> {
    try {
      console.log('🔄 Carregando sessões WAHA API...')
      const response = await fetch('/api/waha/sessions/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('❌ Erro ao carregar sessões WAHA:', response.status)
        return []
      }

      const data = await response.json()
      
      if (!data.success || !data.sessions) {
        console.error('❌ Resposta inválida da API WAHA:', data)
        return []
      }

      // Mapear sessões para formato unificado
      const sessions: InstanceInfo[] = data.sessions.map((session: any) => ({
        id: `${session.serverId}:${session.sessionName}`,
        name: session.sessionName,
        displayName: `${session.sessionName} (${session.serverName || 'Servidor'})`,
        status: session.status,
        phoneNumber: session.phoneNumber,
        method: 'waha' as DispatchMethod,
        serverId: session.serverId,
        serverName: session.serverName
      }))

      console.log('✅ Sessões WAHA carregadas:', sessions.length)
      return sessions
    } catch (error) {
      console.error('❌ Erro ao carregar sessões WAHA:', error)
      return []
    }
  }

  /**
   * Obtém estatísticas de instâncias/sessões disponíveis
   */
  static async getStats(method: DispatchMethod, userId: string) {
    const instances = await this.loadAvailableInstances(method, userId)
    
    const connected = instances.filter(inst => 
      inst.status === 'open' || 
      inst.status === 'WORKING' || 
      inst.status === 'CONNECTED'
    ).length
    
    return {
      total: instances.length,
      connected,
      disconnected: instances.length - connected,
      instances
    }
  }

  /**
   * Envia mensagens usando o método selecionado
   */
  static async dispatch(params: DispatchParams): Promise<DispatchResult> {
    try {
      console.log('📤 Iniciando disparo unificado:', {
        method: params.method,
        totalPhones: params.telefones.length,
        enableVariations: params.enableVariations
      })

      // Validações
      if (!params.telefones || params.telefones.length === 0) {
        return {
          success: false,
          message: 'Nenhum telefone fornecido',
          error: 'Lista de telefones vazia'
        }
      }

      if (!params.mensagem || params.mensagem.trim().length === 0) {
        return {
          success: false,
          message: 'Mensagem não pode estar vazia',
          error: 'Mensagem vazia'
        }
      }

      // Delegar para o método apropriado
      if (params.method === 'evolution') {
        return await this.dispatchViaEvolution(params)
      } else {
        return await this.dispatchViaWaha(params)
      }
    } catch (error: any) {
      console.error('❌ Erro no disparo unificado:', error)
      return {
        success: false,
        message: 'Erro ao enviar mensagens',
        error: error.message || 'Erro desconhecido'
      }
    }
  }

  /**
   * Envia mensagens via Evolution API
   */
  private static async dispatchViaEvolution(params: DispatchParams): Promise<DispatchResult> {
    try {
      console.log('☁️ Enviando via Evolution API...')

      const payload = {
        telefones: params.telefones,
        mensagem: params.mensagem,
        messageVariations: params.messageVariations || [],
        enableVariations: params.enableVariations,
        useAI: params.useAI || false,
        user_id: params.userId,
        useRandomDistribution: params.useLoadBalancing || params.useRandomDistribution || false,
        selectedInstance: params.selectedInstanceOrSession || params.selectedInstance || '',
        timeControl: params.timeControl
      }

      const response = await fetch('/api/disparos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: 'Mensagens enviadas com sucesso via Evolution API',
          data: data,
          details: {
            totalMessages: params.telefones.length,
            sentMessages: data.enviados || params.telefones.length,
            failedMessages: data.falhas || 0,
            method: 'evolution',
            instanceOrSession: params.selectedInstanceOrSession || params.selectedInstance
          }
        }
      } else {
        return {
          success: false,
          message: data.error || 'Erro ao enviar via Evolution API',
          error: data.error
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar via Evolution API:', error)
      return {
        success: false,
        message: 'Erro ao enviar via Evolution API',
        error: error.message
      }
    }
  }

  /**
   * Envia mensagens via WAHA API
   */
  private static async dispatchViaWaha(params: DispatchParams): Promise<DispatchResult> {
    try {
      console.log('📱 Enviando via WAHA API...')

      const payload = {
        telefones: params.telefones,
        mensagem: params.mensagem,
        messageVariations: params.messageVariations || [],
        enableVariations: params.enableVariations,
        useAI: params.useAI || false,
        user_id: params.userId,
        useLoadBalancing: params.useLoadBalancing || false,
        selectedSession: params.selectedInstanceOrSession || params.selectedSession || '',
        timeControl: params.timeControl
      }

      const response = await fetch('/api/waha/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: 'Mensagens enviadas com sucesso via WAHA API',
          data: data,
          details: {
            totalMessages: params.telefones.length,
            sentMessages: data.enviados || params.telefones.length,
            failedMessages: data.falhas || 0,
            method: 'waha',
            instanceOrSession: params.selectedInstanceOrSession || params.selectedSession
          }
        }
      } else {
        return {
          success: false,
          message: data.error || 'Erro ao enviar via WAHA API',
          error: data.error
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar via WAHA API:', error)
      return {
        success: false,
        message: 'Erro ao enviar via WAHA API',
        error: error.message
      }
    }
  }

  /**
   * Valida se o método selecionado está configurado corretamente
   */
  static async validateMethod(method: DispatchMethod, userId: string): Promise<{
    valid: boolean
    message: string
  }> {
    try {
      const stats = await this.getStats(method, userId)
      
      if (stats.total === 0) {
        return {
          valid: false,
          message: method === 'evolution' 
            ? 'Nenhuma instância Evolution encontrada. Configure em Configurações.' 
            : 'Nenhuma sessão WAHA encontrada. Configure em Sessões WAHA.'
        }
      }
      
      if (stats.connected === 0) {
        return {
          valid: false,
          message: method === 'evolution'
            ? 'Nenhuma instância Evolution conectada. Conecte pelo menos uma instância.'
            : 'Nenhuma sessão WAHA conectada. Conecte pelo menos uma sessão.'
        }
      }
      
      return {
        valid: true,
        message: method === 'evolution'
          ? `${stats.connected} instância(s) Evolution conectada(s)`
          : `${stats.connected} sessão(ões) WAHA conectada(s)`
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Erro ao validar configuração'
      }
    }
  }
}

