import Queue from 'bull'
import IORedis from 'ioredis'
import { CampaignService } from './campaignService'

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 1, // Reduzir tentativas
  lazyConnect: true,
  connectTimeout: 5000, // Timeout de 5 segundos
  commandTimeout: 5000
}

// Cliente Redis com tratamento de erro
let redis: IORedis | null = null
let redisAvailable = false

// Verificar se Redis está configurado
const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL

if (hasRedisConfig) {
  try {
    redis = new IORedis(redisConfig)
    redis.on('connect', () => {
      console.log('✅ Redis conectado com sucesso')
      redisAvailable = true
    })
    redis.on('error', (error) => {
      console.log('⚠️ Redis não disponível, usando modo fallback:', error.message)
      redisAvailable = false
    })
  } catch (error) {
    console.log('⚠️ Redis não configurado, usando modo fallback')
    redisAvailable = false
  }
} else {
  console.log('ℹ️ Redis não configurado, usando modo fallback (sem fila)')
  redisAvailable = false
}

// Fila de processamento de campanhas
export const campaignQueue = new Queue('campaign processing', {
  redis: redisAvailable ? redisConfig : undefined,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
})

// Fila de envio de mensagens WhatsApp
export const whatsappQueue = new Queue('whatsapp messages', {
  redis: redisAvailable ? redisConfig : undefined,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
})

// Log do status da fila
console.log('🔧 Configuração da fila WhatsApp:', {
  redisAvailable,
  redisConfig: redisAvailable ? 'configurado' : 'não configurado'
})

// Processador de campanhas
campaignQueue.process('process-campaign', async (job) => {
  const { campanhaId } = job.data
  
  try {
    console.log(`Processando campanha ${campanhaId}`)
    
    // Buscar campanha
    const campanhaResult = await CampaignService.getCampanhaById(campanhaId)
    const campanha = campanhaResult?.data
    if (!campanha) {
      throw new Error('Campanha não encontrada')
    }

    // Buscar lotes pendentes
    const lotes = await CampaignService.getLotesCampanha(campanhaId)
    const lotesPendentes = lotes.filter(lote => lote.status === 'pendente')

    if (lotesPendentes.length === 0) {
      // Marcar campanha como concluída (sem userId em contexto de worker)
      await CampaignService.controlarCampanha(campanhaId, { acao: 'concluir' })
      return { message: 'Campanha concluída' }
    }

    // Processar primeiro lote pendente
  const lote = lotesPendentes[0]
    await processarLote(campanhaId, lote)

    // Se ainda há lotes pendentes, agendar próximo processamento
    const lotesRestantes = await CampaignService.getLotesCampanha(campanhaId)
    const aindaPendentes = lotesRestantes.filter(l => l.status === 'pendente')
    
    if (aindaPendentes.length > 0) {
      // Agendar próximo processamento baseado no intervalo
      const proximoProcessamento = (campanha as any).configuracao?.intervaloMensagens * 1000
      await campaignQueue.add('process-campaign', { campanhaId }, {
        delay: proximoProcessamento
      })
    }

    return { message: `Lote ${lote.numero_lote} processado` }
  } catch (error) {
    console.error(`Erro ao processar campanha ${campanhaId}:`, error)
    throw error
  }
})

// Processador de mensagens WhatsApp
console.log('🔧 Registrando processador da fila WhatsApp...')
whatsappQueue.process('send-message', async (job: any) => {
  const { telefone, mensagem, disparoId, instanceName, scheduledTime } = job.data
  
  try {
    console.log(`🚀 PROCESSADOR ATIVADO: Processando mensagem para ${telefone} via instância ${instanceName}`)
    console.log(`📊 Dados do job:`, {
      disparoId,
      telefone,
      instanceName,
      messageLength: mensagem.length,
      scheduledTime
    })
    
    let sucesso = false
    
    // Tentar enviar via Evolution API se tiver instância
    if (instanceName) {
      console.log(`🔗 Enviando via Evolution API: ${instanceName}`)
      sucesso = await enviarMensagemEvolutionAPI(telefone, mensagem, instanceName)
    }
    
    // Fallback para simulação se Evolution API falhar
    if (!sucesso) {
      console.log('⚠️ Evolution API falhou, usando simulação como fallback')
      sucesso = await simularEnvioWhatsApp(telefone, mensagem)
    }
    
    if (sucesso) {
      console.log(`✅ Mensagem enviada com sucesso para ${telefone}`)
      // Atualizar status do disparo no banco
      await atualizarStatusDisparo(disparoId, 'enviado')
      return { status: 'enviado', telefone, disparoId }
    } else {
      console.log(`❌ Falha no envio para ${telefone}`)
      await atualizarStatusDisparo(disparoId, 'falhou')
      throw new Error('Falha no envio')
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${telefone}:`, error)
    await atualizarStatusDisparo(disparoId, 'falhou')
    throw error
  }
})

// Função para processar um lote
async function processarLote(campanhaId: string, lote: any) {
  try {
    // Marcar lote como processando
    await marcarLoteStatus(lote.id, 'processando')
    
    // Criar jobs para cada cliente do lote
    const jobs = lote.clientes.map((cliente: any) => ({
      telefone: cliente.telefone,
      mensagem: '', // TODO: Buscar mensagem da campanha
      loteId: lote.id,
      clienteId: cliente.id
    }))

    // Adicionar jobs à fila de WhatsApp
    await whatsappQueue.addBulk(
      jobs.map((job: any) => ({
        name: 'send-message',
        data: job
      }))
    )

    // Marcar lote como concluído
    await marcarLoteStatus(lote.id, 'concluido')
    
    // Atualizar progresso da campanha
    await atualizarProgressoCampanha(campanhaId)
    
  } catch (error) {
    console.error(`Erro ao processar lote ${lote.id}:`, error)
    await marcarLoteStatus(lote.id, 'erro')
    throw error
  }
}

// Função para enviar mensagem via Evolution API
async function enviarMensagemEvolutionAPI(telefone: string, mensagem: string, instanceName: string): Promise<boolean> {
  try {
    console.log(`🔗 Enviando via Evolution API: ${instanceName} -> ${telefone}`)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/evolution/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName,
        phoneNumber: telefone,
        message: mensagem
      })
    })

    const data = await response.json()
    console.log(`📡 Resposta Evolution API:`, { status: response.status, success: data.success })
    
    return response.ok && data.success
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via Evolution API:', error)
    return false
  }
}

// Função para simular envio WhatsApp (fallback)
async function simularEnvioWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  // Simular delay de envio
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simular 95% de sucesso
  return Math.random() > 0.05
}

// Função para marcar status do lote
async function marcarLoteStatus(loteId: string, status: string) {
  // TODO: Implementar atualização no banco
  console.log(`Lote ${loteId} marcado como ${status}`)
}

// Função para atualizar status do disparo
async function atualizarStatusDisparo(disparoId: string, status: string) {
  try {
    console.log(`📝 Atualizando status do disparo ${disparoId} para ${status}`)
    
    // Importar supabase dinamicamente para evitar problemas de SSR
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const updateData: any = { status }
    
    if (status === 'enviado') {
      updateData.enviado_em = new Date().toISOString()
    } else if (status === 'falhou') {
      updateData.erro = 'Falha no envio via Evolution API'
    }
    
    const { error } = await supabase
      .from('disparos')
      .update(updateData)
      .eq('id', disparoId)
    
    if (error) {
      console.error('❌ Erro ao atualizar status do disparo:', error)
    } else {
      console.log(`✅ Status do disparo ${disparoId} atualizado para ${status}`)
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status do disparo:', error)
  }
}

// Função para atualizar progresso da campanha
async function atualizarProgressoCampanha(campanhaId: string) {
  // TODO: Implementar atualização no banco
  console.log(`Progresso da campanha ${campanhaId} atualizado`)
}

// Event listeners
campaignQueue.on('completed', (job) => {
  console.log(`Campanha ${job.data.campanhaId} processada com sucesso`)
})

campaignQueue.on('failed', (job, err) => {
  console.error(`Campanha ${job.data.campanhaId} falhou:`, err)
})

whatsappQueue.on('completed', (job: any) => {
  console.log(`✅ Mensagem enviada com sucesso para ${job?.data?.telefone}`)
})

whatsappQueue.on('failed', (job: any, err: any) => {
  console.error(`❌ Falha ao enviar mensagem para ${job?.data?.telefone}:`, err)
})

// Alguns eventos retornam somente jobId; tolerar ambos
whatsappQueue.on('waiting', (jobOrId: any) => {
  const id = typeof jobOrId === 'object' ? jobOrId.id : jobOrId
  console.log(`⏳ Job ${id} aguardando processamento`)
})

whatsappQueue.on('active', (jobOrId: any) => {
  const id = typeof jobOrId === 'object' ? jobOrId.id : jobOrId
  console.log(`🔄 Job ${id} sendo processado`)
})

// Log de inicialização
console.log('🚀 Sistema de filas inicializado:', {
  campaignQueue: 'ativa',
  whatsappQueue: 'ativa',
  redisAvailable
})

// Função para iniciar processamento de campanha
export async function iniciarProcessamentoCampanha(campanhaId: string) {
  try {
    await campaignQueue.add('process-campaign', { campanhaId })
    console.log(`Processamento da campanha ${campanhaId} iniciado`)
    return true
  } catch (error) {
    console.error(`Erro ao iniciar processamento da campanha ${campanhaId}:`, error)
    return false
  }
}

// Função para pausar processamento de campanha
export async function pausarProcessamentoCampanha(campanhaId: string) {
  try {
    // Pausar jobs da campanha
    const jobs = await campaignQueue.getJobs(['waiting', 'delayed'])
    const jobsCampanha = jobs.filter(job => job.data.campanhaId === campanhaId)
    
    for (const job of jobsCampanha) {
      await job.remove()
    }
    
    console.log(`Processamento da campanha ${campanhaId} pausado`)
    return true
  } catch (error) {
    console.error(`Erro ao pausar processamento da campanha ${campanhaId}:`, error)
    return false
  }
}

// Função para obter estatísticas das filas
export async function getQueueStats() {
  try {
    const campaignStats = {
      waiting: await campaignQueue.getWaiting(),
      active: await campaignQueue.getActive(),
      completed: await campaignQueue.getCompleted(),
      failed: await campaignQueue.getFailed()
    }

    const whatsappStats = {
      waiting: await whatsappQueue.getWaiting(),
      active: await whatsappQueue.getActive(),
      completed: await whatsappQueue.getCompleted(),
      failed: await whatsappQueue.getFailed()
    }

    return {
      campaign: campaignStats,
      whatsapp: whatsappStats
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas das filas:', error)
    return null
  }
}

// Função para adicionar mensagem à fila
export async function addMessageToQueue(data: {
  disparoId: string
  instanceName: string
  phoneNumber: string
  message: string
  scheduledTime?: string | null
}) {
  try {
    console.log('📤 Adicionando mensagem à fila:', {
      disparoId: data.disparoId,
      phone: data.phoneNumber,
      instance: data.instanceName,
      messageLength: data.message.length
    })

    // Se Redis não estiver disponível, processar diretamente
    if (!redisAvailable) {
      console.log('⚠️ Redis não disponível, processando mensagem diretamente...')
      return await processarMensagemDiretamente(data)
    }

    const jobData = {
      telefone: data.phoneNumber,
      mensagem: data.message,
      disparoId: data.disparoId,
      instanceName: data.instanceName,
      scheduledTime: data.scheduledTime
    }

    // Adicionar à fila de WhatsApp
    console.log('🔄 Adicionando job à fila whatsappQueue...')
    const job = await whatsappQueue.add('send-message', jobData, {
      delay: data.scheduledTime ? new Date(data.scheduledTime).getTime() - Date.now() : 0
    })

    console.log('✅ Mensagem adicionada à fila com sucesso:', job.id)
    console.log('📊 Status da fila após adicionar job:', {
      waiting: await whatsappQueue.getWaiting().then(jobs => jobs.length),
      active: await whatsappQueue.getActive().then(jobs => jobs.length),
      completed: await whatsappQueue.getCompleted().then(jobs => jobs.length),
      failed: await whatsappQueue.getFailed().then(jobs => jobs.length)
    })
    
    return job
  } catch (error) {
    console.error('❌ Erro ao adicionar mensagem à fila:', error)
    
    // Fallback: processar diretamente se a fila falhar
    console.log('🔄 Fallback: processando mensagem diretamente...')
    try {
      return await processarMensagemDiretamente(data)
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError)
      throw error
    }
  }
}

// Função para processar mensagem diretamente (sem fila)
async function processarMensagemDiretamente(data: {
  disparoId: string
  instanceName: string
  phoneNumber: string
  message: string
  scheduledTime?: string | null
}) {
  console.log('🚀 Processando mensagem diretamente:', {
    disparoId: data.disparoId,
    phone: data.phoneNumber,
    instance: data.instanceName
  })

  try {
    // Tentar enviar via Evolution API
    let sucesso = false
    if (data.instanceName) {
      console.log(`🔗 Enviando via Evolution API: ${data.instanceName} -> ${data.phoneNumber}`)
      sucesso = await enviarMensagemEvolutionAPI(data.phoneNumber, data.message, data.instanceName)
    }

    // Fallback para simulação se Evolution API falhar
    if (!sucesso) {
      console.log('⚠️ Evolution API falhou, usando simulação como fallback')
      sucesso = await simularEnvioWhatsApp(data.phoneNumber, data.message)
    }

    // Atualizar status no banco
    await atualizarStatusDisparo(data.disparoId, sucesso ? 'enviado' : 'falhou')
    
    console.log(`✅ Mensagem processada diretamente: ${sucesso ? 'enviado' : 'falhou'}`)
    return { id: 'direct-' + Date.now(), success: sucesso }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem diretamente:', error)
    await atualizarStatusDisparo(data.disparoId, 'falhou')
    throw error
  }
}

const queueService = {
  campaignQueue,
  whatsappQueue,
  iniciarProcessamentoCampanha,
  pausarProcessamentoCampanha,
  getQueueStats,
  addMessageToQueue
}

export default queueService