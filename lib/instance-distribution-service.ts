import { EvolutionConfigService } from './supabase/evolution-config-service'

export interface InstanceInfo {
  instanceName: string
  connectionStatus: string
  phoneNumber?: string
  lastSeen?: string
}

export interface MessageDistribution {
  instanceName: string
  phoneNumber: string
  message: string
  userId: string
}

export interface TimeControlConfig {
  delayBetweenMessages: number // em milissegundos
  totalSendingTime: number // em milissegundos
  messagesPerInstance: number
  totalInstances: number
}

export class InstanceDistributionService {
  /**
   * Verifica instâncias ativas dinamicamente no momento atual
   * Esta função é chamada a cada ciclo de envio para garantir que apenas instâncias conectadas sejam usadas
   */
  static async getActiveInstancesNow(userId: string): Promise<InstanceInfo[]> {
    try {
      console.log('🔄 [DYNAMIC] Verificando instâncias ativas no momento atual...')
      
      const result = await EvolutionConfigService.getUserInstances(userId)
      if (!result.success || !result.data) {
        console.log('❌ [DYNAMIC] Nenhuma instância encontrada no banco')
        return []
      }

      const configResult = await EvolutionConfigService.getConfig(userId)
      if (!configResult.success || !configResult.data) {
        console.log('❌ [DYNAMIC] Configuração da Evolution API não encontrada')
        return []
      }

      const { api_url: apiUrl, global_api_key: globalApiKey } = configResult.data
      const activeInstances: InstanceInfo[] = []

      // Verificar cada instância em tempo real
      for (const instance of result.data) {
        try {
          const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instance.instance_name}`, {
            method: 'GET',
            headers: { 'apikey': globalApiKey }
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            const isConnected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
            
            if (isConnected) {
              activeInstances.push({
                instanceName: instance.instance_name,
                connectionStatus: 'connected',
                phoneNumber: statusData.instance?.phoneNumber || instance.phone_number,
                lastSeen: statusData.instance?.lastSeen || instance.last_seen
              })
              console.log(`✅ [DYNAMIC] Instância ${instance.instance_name} está ATIVA`)
            } else {
              console.log(`❌ [DYNAMIC] Instância ${instance.instance_name} está DESCONECTADA`)
            }
          } else {
            console.log(`❌ [DYNAMIC] Erro ao verificar ${instance.instance_name}: ${statusResponse.status}`)
          }
        } catch (error) {
          console.log(`❌ [DYNAMIC] Erro ao verificar ${instance.instance_name}:`, error)
        }
      }

      console.log(`🔄 [DYNAMIC] Instâncias ativas encontradas: ${activeInstances.length}`)
      return activeInstances
    } catch (error) {
      console.error('❌ [DYNAMIC] Erro ao verificar instâncias ativas:', error)
      return []
    }
  }

  /**
   * Busca instâncias conectadas do usuário
   */
  static async getConnectedInstances(userId: string): Promise<InstanceInfo[]> {
    try {
      console.log('🔍 Buscando instâncias do usuário:', userId)
      const result = await EvolutionConfigService.getUserInstances(userId)
      console.log('📊 Resultado do EvolutionConfigService:', result)
      
      if (!result.success || !result.data) {
        console.log('❌ Nenhuma instância encontrada no banco')
        return []
      }

      console.log('📋 Instâncias no banco:', result.data.map(inst => ({
        name: inst.instance_name,
        status: inst.connection_status
      })))

      // Verificar status real na Evolution API para cada instância
      const configResult = await EvolutionConfigService.getConfig(userId)
      if (!configResult.success || !configResult.data) {
        console.log('❌ Configuração da Evolution API não encontrada')
        return []
      }

      const { api_url: apiUrl, global_api_key: globalApiKey } = configResult.data
      console.log('🔧 Usando configuração Evolution API:', { apiUrl, globalApiKey: globalApiKey ? '***' : 'null' })

      const connectedInstances: InstanceInfo[] = []

      // Verificar cada instância na Evolution API
      for (const instance of result.data) {
        try {
          console.log(`🔍 Verificando status real da instância: ${instance.instance_name}`)
          
          const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instance.instance_name}`, {
            method: 'GET',
            headers: { 'apikey': globalApiKey }
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            console.log(`📊 Status real da instância ${instance.instance_name}:`, statusData)
            
            const isConnected = statusData.instance?.state === 'open' || statusData.instance?.connectionStatus === 'open'
            console.log(`🔗 Instância ${instance.instance_name} conectada:`, isConnected)
            
            if (isConnected) {
              connectedInstances.push({
                instanceName: instance.instance_name,
                connectionStatus: 'open',
                phoneNumber: statusData.instance?.phoneNumber || instance.phone_number,
                lastSeen: statusData.instance?.lastSeen || instance.last_seen
              })
            }
          } else {
            console.log(`❌ Erro ao verificar status da instância ${instance.instance_name}:`, statusResponse.status)
          }
        } catch (error) {
          console.log(`❌ Erro ao verificar instância ${instance.instance_name}:`, error)
        }
      }

      console.log('🔗 Instâncias realmente conectadas:', connectedInstances.length)
      console.log('📋 Lista de conectadas:', connectedInstances.map(inst => ({
        name: inst.instanceName,
        status: inst.connectionStatus
      })))

      return connectedInstances
    } catch (error) {
      console.error('❌ Erro ao buscar instâncias conectadas:', error)
      return []
    }
  }

  /**
   * Distribui mensagens de forma balanceada entre instâncias conectadas
   * Alterna entre instâncias: inst1, inst2, inst1, inst2, etc.
   */
  static async distributeMessages(
    userId: string, 
    phoneNumbers: string[], 
    message: string,
    messageVariations?: string[]
  ): Promise<MessageDistribution[]> {
    const connectedInstances = await this.getConnectedInstances(userId)
    
    if (connectedInstances.length === 0) {
      throw new Error('Nenhuma instância conectada encontrada')
    }

    console.log(`🔄 Distribuindo ${phoneNumbers.length} mensagens entre ${connectedInstances.length} instâncias`)
    console.log('📋 Instâncias disponíveis:', connectedInstances.map(inst => inst.instanceName))

    const distributions: MessageDistribution[] = []
    
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i]
      
      // Balanceamento alternado: instância 0, 1, 0, 1, etc.
      const instanceIndex = i % connectedInstances.length
      const selectedInstance = connectedInstances[instanceIndex]
      
      // Usar variação se disponível, senão usar mensagem original
      const messageToSend = messageVariations && messageVariations[i] 
        ? messageVariations[i] 
        : message
      
      console.log(`📤 Mensagem ${i + 1}/${phoneNumbers.length} → Instância: ${selectedInstance.instanceName}`)
      
      distributions.push({
        instanceName: selectedInstance.instanceName,
        phoneNumber,
        message: messageToSend,
        userId
      })
    }

    console.log('📊 Distribuição final:', distributions.map(d => ({
      phone: d.phoneNumber,
      instance: d.instanceName
    })))

    return distributions
  }

  /**
   * Distribui uma única mensagem para uma instância aleatória
   */
  static async distributeSingleMessage(
    userId: string,
    phoneNumber: string,
    message: string
  ): Promise<MessageDistribution> {
    const connectedInstances = await this.getConnectedInstances(userId)
    
    if (connectedInstances.length === 0) {
      throw new Error('Nenhuma instância conectada encontrada')
    }

    // Selecionar instância aleatória
    const randomIndex = Math.floor(Math.random() * connectedInstances.length)
    const selectedInstance = connectedInstances[randomIndex]
    
    return {
      instanceName: selectedInstance.instanceName,
      phoneNumber,
      message,
      userId
    }
  }

  /**
   * Verifica se o usuário tem instâncias conectadas
   */
  static async hasConnectedInstances(userId: string): Promise<boolean> {
    const connectedInstances = await this.getConnectedInstances(userId)
    return connectedInstances.length > 0
  }

  /**
   * Verifica o status de uma instância específica
   */
  static async getInstanceStatus(userId: string, instanceName: string): Promise<InstanceInfo | null> {
    try {
      console.log('🔍 Buscando status da instância:', { userId, instanceName })
      const connectedInstances = await this.getConnectedInstances(userId)
      console.log('📊 Instâncias conectadas encontradas:', connectedInstances.length)
      console.log('📋 Lista de instâncias:', connectedInstances.map(inst => ({
        name: inst.instanceName,
        status: inst.connectionStatus
      })))
      
      const instance = connectedInstances.find(inst => inst.instanceName === instanceName)
      console.log('🎯 Instância encontrada:', instance ? {
        name: instance.instanceName,
        status: instance.connectionStatus
      } : 'null')
      
      return instance || null
    } catch (error) {
      console.error('❌ Erro ao verificar status da instância:', error)
      return null
    }
  }

  /**
   * Distribui mensagens de forma sequencial balanceada entre instâncias
   * Cada instância envia uma mensagem por vez, com intervalos de 1-3 minutos
   * Exemplo: Inst1 → Inst2 → Inst3 → Inst1 → Inst2 → Inst3...
   */
  static async distributeMessagesSequentially(
    userId: string, 
    phoneNumbers: string[], 
    message: string,
    messageVariations?: string[]
  ): Promise<MessageDistribution[]> {
    const connectedInstances = await this.getConnectedInstances(userId)
    
    if (connectedInstances.length === 0) {
      throw new Error('Nenhuma instância conectada encontrada')
    }

    console.log(`🔄 Distribuindo ${phoneNumbers.length} mensagens sequencialmente entre ${connectedInstances.length} instâncias`)
    console.log('📋 Instâncias disponíveis:', connectedInstances.map(inst => inst.instanceName))
    console.log('🎨 Variações disponíveis:', messageVariations ? messageVariations.length : 0)
    console.log('📝 Primeira variação:', messageVariations && messageVariations[0] ? messageVariations[0].substring(0, 50) + '...' : 'Nenhuma')

    const distributions: MessageDistribution[] = []
    
    // Criar fila de mensagens para distribuição sequencial
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i]
      
      // Balanceamento sequencial: instância 0, 1, 2, 0, 1, 2, etc.
      const instanceIndex = i % connectedInstances.length
      const selectedInstance = connectedInstances[instanceIndex]
      
      // Usar variação se disponível, senão usar mensagem original
      const messageToSend = messageVariations && messageVariations[i] 
        ? messageVariations[i] 
        : message
      
      console.log(`📤 Mensagem ${i + 1}/${phoneNumbers.length} → Instância: ${selectedInstance.instanceName} (índice: ${instanceIndex})`)
      console.log(`🎨 Variação aplicada: ${messageToSend.substring(0, 50)}${messageToSend.length > 50 ? '...' : ''}`)
      console.log(`🔍 Debug - Variação ${i}:`, messageVariations && messageVariations[i] ? 'EXISTE' : 'NÃO EXISTE')
      console.log(`🔍 Debug - Mensagem original:`, message.substring(0, 30) + '...')
      console.log(`🔍 Debug - Mensagem final:`, messageToSend.substring(0, 30) + '...')
      
      distributions.push({
        instanceName: selectedInstance.instanceName,
        phoneNumber,
        message: messageToSend,
        userId
      })
    }

    console.log('📊 Distribuição sequencial final:', distributions.map(d => ({
      phone: d.phoneNumber,
      instance: d.instanceName
    })))

    return distributions
  }

  /**
   * Envia mensagens com balanceamento inteligente e intervalos de 1-3 minutos
   * Sistema de fila por instância: cada instância envia uma mensagem por vez
   */
  /**
   * Distribui mensagens de forma precisa e equilibrada entre instâncias ativas
   * Calcula exatamente quantas mensagens cada instância deve enviar
   * Segue fila sequencial: inst1→inst2→inst3→inst1→inst2→inst3...
   */
  static async distributeMessagesPrecisely(
    userId: string,
    phoneNumbers: string[],
    message: string,
    messageVariations?: string[]
  ): Promise<MessageDistribution[]> {
    console.log(`📊 [PRECISE] Iniciando distribuição precisa de ${phoneNumbers.length} mensagens`)
    
    // Verificar instâncias ativas no momento
    const activeInstances = await this.getActiveInstancesNow(userId)
    
    if (activeInstances.length === 0) {
      throw new Error('Nenhuma instância ativa encontrada')
    }

    const totalMessages = phoneNumbers.length
    const totalInstances = activeInstances.length
    
    // Calcular distribuição precisa
    const messagesPerInstance = Math.floor(totalMessages / totalInstances)
    const remainingMessages = totalMessages % totalInstances
    
    console.log(`📊 [PRECISE] Distribuição calculada:`)
    console.log(`   📱 Total de mensagens: ${totalMessages}`)
    console.log(`   🔄 Total de instâncias: ${totalInstances}`)
    console.log(`   📊 Mensagens por instância: ${messagesPerInstance}`)
    console.log(`   🔢 Mensagens restantes: ${remainingMessages}`)
    
    // Calcular quantas mensagens cada instância enviará
    const instanceMessageCounts = new Array(totalInstances).fill(messagesPerInstance)
    
    // Distribuir mensagens restantes para as primeiras instâncias
    for (let i = 0; i < remainingMessages; i++) {
      instanceMessageCounts[i]++
    }
    
    console.log(`📊 [PRECISE] Mensagens por instância:`)
    instanceMessageCounts.forEach((count, index) => {
      console.log(`   🔄 Instância ${index + 1} (${activeInstances[index].instanceName}): ${count} mensagens`)
    })

    const distributions: MessageDistribution[] = []
    let messageIndex = 0

    // Criar fila sequencial perfeita
    for (let round = 0; round < Math.max(...instanceMessageCounts); round++) {
      console.log(`🔄 [PRECISE] Rodada ${round + 1}/${Math.max(...instanceMessageCounts)}`)
      
      for (let instanceIndex = 0; instanceIndex < totalInstances; instanceIndex++) {
        // Verificar se esta instância ainda tem mensagens para enviar nesta rodada
        if (round < instanceMessageCounts[instanceIndex]) {
          const phoneNumber = phoneNumbers[messageIndex]
          const messageToSend = messageVariations && messageVariations[messageIndex] 
            ? messageVariations[messageIndex] 
            : message
          
          const selectedInstance = activeInstances[instanceIndex]
          
          console.log(`📤 [PRECISE] Mensagem ${messageIndex + 1}/${totalMessages} → Instância ${instanceIndex + 1} (${selectedInstance.instanceName}) → ${phoneNumber}`)
          
          distributions.push({
            instanceName: selectedInstance.instanceName,
            phoneNumber,
            message: messageToSend,
            userId
          })
          
          messageIndex++
        }
      }
    }

    console.log(`✅ [PRECISE] Distribuição concluída:`)
    console.log(`   📊 Total de distribuições: ${distributions.length}`)
    console.log(`   🔄 Distribuição por instância:`)
    
    // Verificar distribuição final
    const finalDistribution = new Map<string, number>()
    distributions.forEach(dist => {
      finalDistribution.set(dist.instanceName, (finalDistribution.get(dist.instanceName) || 0) + 1)
    })
    
    finalDistribution.forEach((count, instanceName) => {
      console.log(`   🔄 ${instanceName}: ${count} mensagens`)
    })

    return distributions
  }

  /**
   * Envio inteligente com verificação dinâmica de instâncias ativas e controle rigoroso de tempo
   * Esta função verifica instâncias ativas a cada ciclo e respeita exatamente o tempo calculado
   */
  static async sendMessagesWithDynamicBalancing(
    userId: string,
    phoneNumbers: string[],
    message: string,
    messageVariations?: string[],
    timeControl?: {
      delayMinutes: number
      delaySeconds: number
      totalTimeHours: number
      totalTimeMinutes: number
    }
  ): Promise<{
    success: number
    failed: number
    results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
      sentAt: string
    }>
    totalTime: number
    activeInstancesCount: number
    summary: {
      totalMessages: number
      successCount: number
      failedCount: number
      totalTime: number
      averageTimePerMessage: number
      instanceStats: Array<{
        instanceName: string
        messageCount: number
        successCount: number
        failedCount: number
        averageTime: number
      }>
      startTime: string
      endTime: string
    }
  }> {
    console.log(`🚀 [DYNAMIC] Iniciando envio inteligente de ${phoneNumbers.length} mensagens`)
    console.log(`⏰ [DYNAMIC] Controle de tempo:`, timeControl)
    
    const startTime = Date.now()
    let success = 0
    let failed = 0
    const results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
      sentAt: string
    }> = []

    // Calcular delay total em milissegundos
    const delayMs = timeControl 
      ? (timeControl.delayMinutes * 60 + timeControl.delaySeconds) * 1000
      : 180000 // 3 minutos padrão

    console.log(`⏰ [DYNAMIC] Delay entre mensagens: ${delayMs}ms (${delayMs/1000}s)`)

    // Criar distribuição precisa das mensagens
    const distributions = await this.distributeMessagesPrecisely(userId, phoneNumbers, message, messageVariations)
    
    console.log(`📊 [DYNAMIC] Distribuição precisa criada: ${distributions.length} mensagens`)

    // Processar cada mensagem seguindo a distribuição precisa
    for (let i = 0; i < distributions.length; i++) {
      const distribution = distributions[i]
      
      console.log(`🔄 [DYNAMIC] Processando mensagem ${i + 1}/${distributions.length} para ${distribution.phoneNumber}`)

      try {
        // Verificar se a instância ainda está ativa antes de enviar
        const activeInstances = await this.getActiveInstancesNow(userId)
        const isInstanceActive = activeInstances.some(inst => inst.instanceName === distribution.instanceName)
        
        if (!isInstanceActive) {
          console.log(`❌ [DYNAMIC] Instância ${distribution.instanceName} não está mais ativa para mensagem ${i + 1}`)
          failed++
          results.push({
            phoneNumber: distribution.phoneNumber,
            instanceName: distribution.instanceName,
            success: false,
            error: 'Instância não está mais ativa',
            sentAt: new Date().toISOString()
          })
          continue
        }

        console.log(`📤 [DYNAMIC] Enviando mensagem ${i + 1} via ${distribution.instanceName} para ${distribution.phoneNumber}`)
        console.log(`🎨 [DYNAMIC] Variação única: ${distribution.message.substring(0, 50)}${distribution.message.length > 50 ? '...' : ''}`)
        console.log(`🔄 [DYNAMIC] Instâncias ativas disponíveis: ${activeInstances.length}`)

        // Enviar mensagem via Evolution API diretamente
        const sucesso = await this.sendMessageDirectly(
          distribution.phoneNumber,
          distribution.message,
          distribution.instanceName,
          userId
        )

        const sentAt = new Date().toISOString()

        if (sucesso) {
          console.log(`✅ [DYNAMIC] Mensagem ${i + 1} enviada com sucesso via ${distribution.instanceName}`)
          success++
          results.push({
            phoneNumber: distribution.phoneNumber,
            instanceName: distribution.instanceName,
            success: true,
            sentAt
          })
        } else {
          console.log(`❌ [DYNAMIC] Falha no envio da mensagem ${i + 1} via ${distribution.instanceName}`)
          failed++
          results.push({
            phoneNumber: distribution.phoneNumber,
            instanceName: distribution.instanceName,
            success: false,
            error: 'Falha no envio da mensagem',
            sentAt
          })
        }

        // Aguardar delay calculado (exceto na última mensagem)
        if (i < distributions.length - 1) {
          console.log(`⏳ [DYNAMIC] Aguardando ${delayMs/1000} segundo(s) antes da próxima mensagem...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }

      } catch (error) {
        console.log(`❌ [DYNAMIC] Erro no envio da mensagem ${i + 1}:`, error)
        failed++
        results.push({
          phoneNumber: distribution.phoneNumber,
          instanceName: distribution.instanceName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          sentAt: new Date().toISOString()
        })
      }
    }

    const totalTime = Date.now() - startTime
    const activeInstancesCount = (await this.getActiveInstancesNow(userId)).length
    const endTime = new Date().toISOString()

    // Calcular estatísticas por instância
    const instanceStatsMap = new Map<string, {
      messageCount: number
      successCount: number
      failedCount: number
      totalTime: number
      messageTimes: number[]
    }>()

    results.forEach(result => {
      if (!instanceStatsMap.has(result.instanceName)) {
        instanceStatsMap.set(result.instanceName, {
          messageCount: 0,
          successCount: 0,
          failedCount: 0,
          totalTime: 0,
          messageTimes: []
        })
      }

      const stats = instanceStatsMap.get(result.instanceName)!
      stats.messageCount++
      
      if (result.success) {
        stats.successCount++
      } else {
        stats.failedCount++
      }

      // Calcular tempo aproximado por mensagem (baseado no delay)
      const messageTime = delayMs
      stats.messageTimes.push(messageTime)
      stats.totalTime += messageTime
    })

    // Converter para array de estatísticas
    const instanceStats = Array.from(instanceStatsMap.entries()).map(([instanceName, stats]) => ({
      instanceName,
      messageCount: stats.messageCount,
      successCount: stats.successCount,
      failedCount: stats.failedCount,
      averageTime: stats.messageTimes.length > 0 
        ? stats.messageTimes.reduce((a, b) => a + b, 0) / stats.messageTimes.length 
        : 0
    }))

    // Calcular tempo médio por mensagem
    const averageTimePerMessage = results.length > 0 ? totalTime / results.length : 0

    const summary = {
      totalMessages: phoneNumbers.length,
      successCount: success,
      failedCount: failed,
      totalTime,
      averageTimePerMessage,
      instanceStats,
      startTime: new Date(startTime).toISOString(),
      endTime
    }

    console.log(`✅ [DYNAMIC] Envio concluído:`)
    console.log(`📊 [DYNAMIC] Sucessos: ${success}`)
    console.log(`📊 [DYNAMIC] Falhas: ${failed}`)
    console.log(`⏰ [DYNAMIC] Tempo total: ${totalTime}ms (${totalTime/1000}s)`)
    console.log(`🔄 [DYNAMIC] Instâncias ativas no final: ${activeInstancesCount}`)
    console.log(`📊 [DYNAMIC] Resumo detalhado:`, summary)

    return {
      success,
      failed,
      results,
      totalTime,
      activeInstancesCount,
      summary
    }
  }

  /**
   * Envio inteligente com balanceamento sequencial (versão original mantida para compatibilidade)
   */
  static async sendMessagesWithIntelligentBalancing(
    userId: string,
    phoneNumbers: string[],
    message: string,
    messageVariations?: string[],
    timeControl?: {
      delayMinutes: number
      delaySeconds: number
      totalTimeHours: number
      totalTimeMinutes: number
    }
  ): Promise<{
    success: number
    failed: number
    results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
      sentAt: string
    }>
    totalTime: number
  }> {
    console.log(`🚀 Iniciando envio inteligente de ${phoneNumbers.length} mensagens`)
    const startTime = Date.now()
    
    // Distribuir mensagens sequencialmente
    const distributions = await this.distributeMessagesSequentially(userId, phoneNumbers, message, messageVariations)
    
    let success = 0
    let failed = 0
    const results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
      sentAt: string
    }> = []

    // Agrupar mensagens por instância para controle de fila
    const messagesByInstance = new Map<string, MessageDistribution[]>()
    distributions.forEach(distribution => {
      if (!messagesByInstance.has(distribution.instanceName)) {
        messagesByInstance.set(distribution.instanceName, [])
      }
      messagesByInstance.get(distribution.instanceName)!.push(distribution)
    })

    console.log('📊 Mensagens por instância:', Array.from(messagesByInstance.entries()).map(([instance, messages]) => ({
      instance,
      count: messages.length
    })))

    // Processar mensagens em rodadas sequenciais
    const maxMessagesPerInstance = Math.max(...Array.from(messagesByInstance.values()).map(messages => messages.length))
    
    for (let round = 0; round < maxMessagesPerInstance; round++) {
      console.log(`🔄 Rodada ${round + 1}/${maxMessagesPerInstance}`)
      
      // Processar uma mensagem de cada instância nesta rodada
      for (const [instanceName, messages] of messagesByInstance.entries()) {
        if (round < messages.length) {
          const distribution = messages[round]
          
          try {
            console.log(`📤 Enviando mensagem da rodada ${round + 1} via ${instanceName} para ${distribution.phoneNumber}`)
            console.log(`🎨 Variação única: ${distribution.message.substring(0, 50)}${distribution.message.length > 50 ? '...' : ''}`)
            
            // Enviar mensagem via Evolution API diretamente
            const sucesso = await this.sendMessageDirectly(
              distribution.phoneNumber,
              distribution.message,
              distribution.instanceName,
              distribution.userId
            )
            
            const sentAt = new Date().toISOString()
            
            if (sucesso) {
              console.log(`✅ Mensagem enviada com sucesso via ${instanceName}`)
              success++
              results.push({
                phoneNumber: distribution.phoneNumber,
                instanceName: distribution.instanceName,
                success: true,
                sentAt
              })
            } else {
              console.log(`❌ Falha no envio via ${instanceName}`)
              failed++
              results.push({
                phoneNumber: distribution.phoneNumber,
                instanceName: distribution.instanceName,
                success: false,
                error: 'Falha no envio da mensagem',
                sentAt
              })
            }
          } catch (error) {
            console.log(`❌ Erro no envio via ${instanceName}:`, error)
            failed++
            results.push({
              phoneNumber: distribution.phoneNumber,
              instanceName: distribution.instanceName,
              success: false,
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              sentAt: new Date().toISOString()
            })
          }

          // Delay configurado entre mensagens (apenas se não for a última mensagem da rodada)
          if (!(round === maxMessagesPerInstance - 1 && instanceName === Array.from(messagesByInstance.keys())[Array.from(messagesByInstance.keys()).length - 1])) {
            // Usar delay configurado ou padrão de 1-3 minutos
            const delaySeconds = timeControl 
              ? (timeControl.delayMinutes * 60) + timeControl.delaySeconds
              : Math.floor(Math.random() * 120) + 60 // 1-3 minutos padrão
            
            const delayMs = delaySeconds * 1000
            const delayMinutes = Math.floor(delaySeconds / 60)
            const delaySecondsRemainder = delaySeconds % 60
            
            console.log(`⏳ Aguardando ${delayMinutes} minuto(s) e ${delaySecondsRemainder} segundo(s) antes da próxima mensagem...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
        }
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000 / 60) // em minutos
    console.log(`📊 Envio inteligente concluído: ${success} sucessos, ${failed} falhas em ${totalTime} minutos`)
    
    return {
      success,
      failed,
      results,
      totalTime
    }
  }

  /**
   * Envia mensagens com delay balanceado entre instâncias
   * Delay de 5-10 segundos entre mensagens (método legado)
   */
  static async sendMessagesWithDelay(
    userId: string,
    phoneNumbers: string[],
    message: string,
    messageVariations?: string[]
  ): Promise<{
    success: number
    failed: number
    results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
    }>
  }> {
    console.log(`🚀 Iniciando envio de ${phoneNumbers.length} mensagens com delay balanceado`)
    
    const distributions = await this.distributeMessages(userId, phoneNumbers, message, messageVariations)
    
    let success = 0
    let failed = 0
    const results: Array<{
      phoneNumber: string
      instanceName: string
      success: boolean
      error?: string
    }> = []

    for (let i = 0; i < distributions.length; i++) {
      const distribution = distributions[i]
      
      try {
        console.log(`📤 Enviando mensagem ${i + 1}/${distributions.length} para ${distribution.phoneNumber} via ${distribution.instanceName}`)
        
        // Enviar mensagem via Evolution API diretamente
        const sucesso = await this.sendMessageDirectly(
          distribution.phoneNumber,
          distribution.message,
          distribution.instanceName,
          distribution.userId
        )
        
        if (sucesso) {
          console.log(`✅ Mensagem ${i + 1} enviada com sucesso`)
          success++
          results.push({
            phoneNumber: distribution.phoneNumber,
            instanceName: distribution.instanceName,
            success: true
          })
        } else {
          console.log(`❌ Falha no envio da mensagem ${i + 1}`)
          failed++
          results.push({
            phoneNumber: distribution.phoneNumber,
            instanceName: distribution.instanceName,
            success: false,
            error: 'Falha no envio da mensagem'
          })
        }
      } catch (error) {
        console.log(`❌ Erro no envio da mensagem ${i + 1}:`, error)
        failed++
        results.push({
          phoneNumber: distribution.phoneNumber,
          instanceName: distribution.instanceName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }

      // Delay entre mensagens (5-10 segundos)
      if (i < distributions.length - 1) {
        const delay = Math.floor(Math.random() * 6) + 5 // 5-10 segundos
        console.log(`⏳ Aguardando ${delay} segundos antes da próxima mensagem...`)
        await new Promise(resolve => setTimeout(resolve, delay * 1000))
      }
    }

    console.log(`📊 Envio concluído: ${success} sucessos, ${failed} falhas`)
    
    return {
      success,
      failed,
      results
    }
  }

  /**
   * Retorna estatísticas das instâncias
   */
  static async getInstanceStats(userId: string): Promise<{
    total: number
    connected: number
    disconnected: number
  }> {
    try {
      const result = await EvolutionConfigService.getUserInstances(userId)
      
      if (!result.success || !result.data) {
        return { total: 0, connected: 0, disconnected: 0 }
      }

      const total = result.data.length
      const connected = result.data.filter(instance => 
        instance.connection_status === 'open' || 
        instance.connection_status === 'connected'
      ).length
      const disconnected = total - connected

      return { total, connected, disconnected }
    } catch (error) {
      console.error('Erro ao buscar estatísticas das instâncias:', error)
      return { total: 0, connected: 0, disconnected: 0 }
    }
  }

  /**
   * Envia mensagem diretamente via Evolution API
   */
  static async sendMessageDirectly(
    phoneNumber: string, 
    message: string, 
    instanceName: string, 
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`🔗 Enviando via Evolution API: ${instanceName} -> ${phoneNumber}`)
      
      // Buscar configuração do usuário
      const config = await EvolutionConfigService.getConfig(userId)
      if (!config.success || !config.data) {
        console.error('❌ Configuração da Evolution API não encontrada')
        return false
      }

      const { api_url, global_api_key } = config.data

      // Validar se a URL está definida
      if (!api_url) {
        console.error('❌ api_url não está definida na configuração')
        return false
      }

      // Limpar número do telefone
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      
      console.log(`🔗 URL: ${api_url}/message/sendText/${instanceName}`)
      
      const response = await fetch(`${api_url}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': global_api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
          delay: 1200, // Delay padrão de 1.2 segundos
          linkPreview: true
        })
      })

      const data = await response.json()
      
      // Log detalhado da resposta
      console.log(`📡 Resposta Evolution API para ${instanceName}:`, {
        status: response.status,
        success: response.ok,
        data: data
      })

      if (response.ok) {
        console.log(`✅ Mensagem enviada com sucesso para ${phoneNumber}`)
        return true
      } else {
        console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, {
          status: response.status,
          error: data.message || data.error || 'Erro desconhecido',
          details: data
        })
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Evolution API:', error)
      return false
    }
  }
}
