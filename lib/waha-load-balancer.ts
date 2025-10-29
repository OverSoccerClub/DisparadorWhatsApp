import { WahaSessionStats } from './waha-dispatch-service'

export interface WahaSession {
  serverId: string
  serverName: string
  sessionName: string
  status: string
  stats?: WahaSessionStats
}

export interface LoadBalancingStrategy {
  name: string
  description: string
  selectSession: (sessions: WahaSession[]) => WahaSession | null
}

export class WahaLoadBalancer {
  private static strategies: Record<string, LoadBalancingStrategy> = {
    round_robin: {
      name: 'Round Robin',
      description: 'Distribui mensagens sequencialmente entre as sessões',
      selectSession: WahaLoadBalancer.roundRobin
    },
    least_connections: {
      name: 'Menos Conexões',
      description: 'Seleciona a sessão com menos mensagens enviadas',
      selectSession: WahaLoadBalancer.leastConnections
    },
    random: {
      name: 'Aleatório',
      description: 'Seleciona uma sessão aleatoriamente',
      selectSession: WahaLoadBalancer.random
    }
  }

  static getStrategies(): LoadBalancingStrategy[] {
    return Object.values(this.strategies)
  }

  static getStrategy(name: string): LoadBalancingStrategy | null {
    return this.strategies[name] || null
  }

  static selectSession(sessions: WahaSession[], strategy: string): WahaSession | null {
    const strategyImpl = this.getStrategy(strategy)
    if (!strategyImpl) {
      console.warn(`Estratégia de balanceamento '${strategy}' não encontrada. Usando round_robin.`)
      return this.roundRobin(sessions)
    }

    return strategyImpl.selectSession(sessions)
  }

  private static roundRobin(sessions: WahaSession[]): WahaSession | null {
    const workingSessions = sessions.filter(s => s.status === 'WORKING' || s.status === 'CONNECTED')
    
    if (workingSessions.length === 0) {
      return null
    }

    // Ordena por nome da sessão para garantir consistência
    workingSessions.sort((a, b) => a.sessionName.localeCompare(b.sessionName))
    
    // Seleciona baseado no timestamp atual (simula round robin)
    const index = Math.floor(Date.now() / 1000) % workingSessions.length
    return workingSessions[index]
  }

  private static leastConnections(sessions: WahaSession[]): WahaSession | null {
    const workingSessions = sessions.filter(s => s.status === 'WORKING' || s.status === 'CONNECTED')
    
    if (workingSessions.length === 0) {
      return null
    }

    // Ordena por total de mensagens enviadas (menor primeiro)
    workingSessions.sort((a, b) => {
      const aTotal = a.stats?.total_sent || 0
      const bTotal = b.stats?.total_sent || 0
      return aTotal - bTotal
    })

    return workingSessions[0]
  }

  private static random(sessions: WahaSession[]): WahaSession | null {
    const workingSessions = sessions.filter(s => s.status === 'WORKING' || s.status === 'CONNECTED')
    
    if (workingSessions.length === 0) {
      return null
    }

    const index = Math.floor(Math.random() * workingSessions.length)
    return workingSessions[index]
  }

  // Utilitário para calcular delay entre mensagens
  static calculateDelay(delayMin: number, delayMax: number): number {
    if (delayMin >= delayMax) {
      return delayMin
    }
    
    return Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
  }

  // Utilitário para calcular próximo horário de envio baseado no rate limit
  static calculateNextSendTime(messagesPerMinute: number, lastSendTime?: Date): Date {
    const now = new Date()
    const intervalMs = (60 * 1000) / messagesPerMinute // ms entre mensagens
    
    if (!lastSendTime) {
      return now
    }
    
    const timeSinceLastSend = now.getTime() - lastSendTime.getTime()
    
    if (timeSinceLastSend >= intervalMs) {
      return now
    }
    
    return new Date(lastSendTime.getTime() + intervalMs)
  }

  // Validação de sessões disponíveis
  static validateSessions(sessions: WahaSession[]): { valid: WahaSession[], invalid: WahaSession[] } {
    const valid: WahaSession[] = []
    const invalid: WahaSession[] = []

    sessions.forEach(session => {
      if (session.status === 'WORKING' || session.status === 'CONNECTED') {
        valid.push(session)
      } else {
        invalid.push(session)
      }
    })

    return { valid, invalid }
  }

  // Estatísticas de balanceamento
  static getBalancingStats(sessions: WahaSession[]): {
    totalSessions: number
    workingSessions: number
    totalMessagesSent: number
    averageMessagesPerSession: number
    sessionsWithStats: number
  } {
    const workingSessions = sessions.filter(s => s.status === 'WORKING' || s.status === 'CONNECTED')
    const sessionsWithStats = sessions.filter(s => s.stats)
    
    const totalMessagesSent = sessionsWithStats.reduce((sum, s) => sum + (s.stats?.total_sent || 0), 0)
    const averageMessagesPerSession = sessionsWithStats.length > 0 ? totalMessagesSent / sessionsWithStats.length : 0

    return {
      totalSessions: sessions.length,
      workingSessions: workingSessions.length,
      totalMessagesSent,
      averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100,
      sessionsWithStats: sessionsWithStats.length
    }
  }
}
