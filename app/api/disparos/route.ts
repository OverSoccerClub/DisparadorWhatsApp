import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InstanceDistributionService } from '@/lib/instance-distribution-service'
import { generateTypedVariations } from '@/lib/messageVariations'

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'todos'
    const campanhaId = searchParams.get('campanha_id')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const tipoData = searchParams.get('tipo_data') || 'created_at' // 'created_at' ou 'enviado_em'

    // Consulta básica que funciona (filtrada por user_id)
    const { data, error } = await supabaseAuth
      .from('disparos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro na consulta:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aplicar filtros manualmente
    let filteredData = data || []

    if (search) {
      filteredData = filteredData.filter(disparo => 
        disparo.telefone?.toLowerCase().includes(search.toLowerCase()) ||
        disparo.mensagem?.toLowerCase().includes(search.toLowerCase()) ||
        disparo.resposta?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status !== 'todos') {
      filteredData = filteredData.filter(disparo => disparo.status === status)
    }

    if (campanhaId) {
      filteredData = filteredData.filter(disparo => disparo.campanha_id === campanhaId)
    }

    // Filtros de data
    if (dataInicio || dataFim) {
      filteredData = filteredData.filter(disparo => {
        const dataDisparo = tipoData === 'enviado_em' ? disparo.enviado_em : disparo.created_at
        
        if (!dataDisparo) return false
        
        const data = new Date(dataDisparo)
        const inicio = dataInicio ? new Date(dataInicio) : null
        const fim = dataFim ? new Date(dataFim + 'T23:59:59.999Z') : null
        
        if (inicio && data < inicio) return false
        if (fim && data > fim) return false
        
        return true
      })
    }

    // Aplicar paginação
    const total = filteredData.length
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedData = filteredData.slice(from, to)

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Dados recebidos na API de disparos:', body)
    const { telefones, mensagem, agendamento, user_id, instanceName, useRandomDistribution, messageVariations, timeControl, humanizeConversation = true } = body
    
    console.log('🔍 Parâmetros extraídos:', {
      telefones: telefones?.length,
      mensagem: mensagem?.length,
      user_id,
      instanceName,
      useRandomDistribution
    })

    // Validar dados obrigatórios
    if (!telefones || !mensagem || !user_id) {
      console.log('Erro de validação:', { telefones, mensagem, user_id })
      return NextResponse.json({ error: 'Telefones, mensagem e user_id são obrigatórios' }, { status: 400 })
    }

    // Validar se é array de telefones
    if (!Array.isArray(telefones) || telefones.length === 0) {
      return NextResponse.json({ error: 'Pelo menos um telefone é obrigatório' }, { status: 400 })
    }

    // Validar modo de distribuição
    console.log('🔍 Validando modo de distribuição...')
    if (instanceName) {
      console.log('🎯 Modo: Instância específica -', instanceName)
      try {
        const instanceStatus = await InstanceDistributionService.getInstanceStatus(user_id, instanceName)
        console.log('📊 Status da instância:', instanceStatus)
        if (!instanceStatus || instanceStatus.connectionStatus !== 'open') {
          console.log('❌ Instância não conectada')
          return NextResponse.json({ 
            error: `A instância ${instanceName} não está conectada. Selecione outra instância.` 
          }, { status: 400 })
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status da instância:', error)
        return NextResponse.json({ 
          error: 'Erro ao verificar status da instância' 
        }, { status: 500 })
      }
    } else if (useRandomDistribution) {
      console.log('🎲 Modo: Balanceamento automático')
      try {
        const hasInstances = await InstanceDistributionService.hasConnectedInstances(user_id)
        console.log('📊 Tem instâncias conectadas:', hasInstances)
        if (!hasInstances) {
          console.log('❌ Nenhuma instância conectada para balanceamento')
          return NextResponse.json({ 
            error: 'Nenhuma instância WhatsApp conectada encontrada para balanceamento automático. Configure instâncias em Configurações.' 
          }, { status: 400 })
        }
      } catch (error) {
        console.error('❌ Erro ao verificar instâncias conectadas:', error)
        return NextResponse.json({ 
          error: 'Erro ao verificar instâncias conectadas' 
        }, { status: 500 })
      }
    } else {
      console.log('🔄 Modo: Distribuição automática (fallback)')
      try {
        const hasInstances = await InstanceDistributionService.hasConnectedInstances(user_id)
        console.log('📊 Tem instâncias conectadas (fallback):', hasInstances)
        if (!hasInstances) {
          console.log('❌ Nenhuma instância conectada (fallback)')
          return NextResponse.json({ 
            error: 'Nenhuma instância WhatsApp conectada encontrada. Configure uma instância em Configurações.' 
          }, { status: 400 })
        }
      } catch (error) {
        console.error('❌ Erro ao verificar instâncias conectadas (fallback):', error)
        return NextResponse.json({ 
          error: 'Erro ao verificar instâncias conectadas' 
        }, { status: 500 })
      }
    }

    // Validar formato dos telefones
    for (const telefone of telefones) {
      // Validar formato básico do telefone (apenas números, mínimo 10 dígitos)
      const phoneDigits = telefone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        return NextResponse.json({ error: `Telefone inválido: ${telefone}` }, { status: 400 })
      }
    }

                // Gerar variações de mensagem para cada destinatário
                console.log('📤 Iniciando distribuição de mensagens...')
                console.log('🎨 Gerando variações de mensagem...')
                
                // Gerar variações diferentes para cada telefone (se não foram enviadas pelo frontend)
                const localMessageVariations = messageVariations || generateTypedVariations(mensagem, telefones.length)
                console.log(`📝 Usando ${localMessageVariations.length} variações de mensagem`)
                
                // Validar que as variações são únicas
                const uniqueVariations = Array.from(new Set(localMessageVariations))
                if (uniqueVariations.length !== localMessageVariations.length) {
                  console.log(`⚠️ Aviso: ${localMessageVariations.length - uniqueVariations.length} variações duplicadas detectadas`)
                } else {
                  console.log(`✅ Todas as ${localMessageVariations.length} variações são únicas - anti-spam ativo`)
                }
                
                let distributions
                if (instanceName) {
                  // Modo: Instância específica
                  console.log('🎯 Modo: Instância específica - criando distribuições')
                  distributions = telefones.map((telefone, index) => ({
                    phoneNumber: telefone.replace(/\D/g, ''), // Limpar formato
                    message: localMessageVariations[index] || mensagem, // Usar variação ou mensagem original
                    userId: user_id,
                    instanceName: instanceName
                  }))
                  console.log('📋 Distribuições criadas (instância específica):', distributions.length)
                } else {
                  // Modo: Balanceamento automático inteligente ou distribuição padrão
                  if (useRandomDistribution) {
                    console.log('🎲 Modo: Balanceamento automático inteligente - distribuindo mensagens sequencialmente')
                    distributions = await InstanceDistributionService.distributeMessagesSequentially(
                      user_id,
                      telefones.map(telefone => telefone.replace(/\D/g, '')), // Limpar formato
                      mensagem,
                      localMessageVariations // Passar variações para o serviço
                    )
                    console.log('📋 Distribuições criadas (balanceamento inteligente):', distributions.length)
                  } else {
                    console.log('🔄 Modo: Distribuição automática (fallback) - distribuindo mensagens')
                    distributions = await InstanceDistributionService.distributeMessages(
                      user_id,
                      telefones.map(telefone => telefone.replace(/\D/g, '')), // Limpar formato
                      mensagem,
                      localMessageVariations // Passar variações para o serviço
                    )
                    console.log('📋 Distribuições criadas (fallback):', distributions.length)
                  }
                }
                
                console.log('📊 Distribuições finais:', distributions.map(d => ({
                  phone: d.phoneNumber,
                  instance: d.instanceName,
                  messageLength: d.message.length
                })))

                // Criar registros de disparo com informações da instância
                console.log('💾 Criando registros de disparo no banco...')
                const disparos = distributions.map(distribution => ({
                  telefone: distribution.phoneNumber,
                  mensagem: distribution.message,
                  status: 'pendente',
                  user_id: distribution.userId,
                  instance_name: distribution.instanceName, // Agora temos a coluna instance_name
                  agendamento: agendamento
                }))

                console.log('📋 Dados dos disparos:', disparos.map(d => ({
                  phone: d.telefone,
                  messageLength: d.mensagem.length,
                  status: d.status,
                  instance: d.instance_name
                })))

                const { data: createdDisparos, error: createError } = await supabase
                  .from('disparos')
                  .insert(disparos)
                  .select()

                if (createError) {
                  console.error('❌ Erro ao criar registros de disparo:', createError)
                  return NextResponse.json({ error: createError.message }, { status: 500 })
                }

                console.log('✅ Registros de disparo criados:', createdDisparos.length)

                // Processar mensagens com sistema inteligente ou tradicional
                console.log('🚀 Processando mensagens...')
                let sucessoCount = 0
                let falhaCount = 0

                if (useRandomDistribution) {
                  // Usar sistema de balanceamento inteligente com intervalos de 1-3 minutos
                  console.log('🧠 Usando sistema de balanceamento inteligente...')
                  
                  try {
                    console.log('🔍 Debug API - Variações recebidas:', messageVariations ? messageVariations.length : 0)
                    console.log('🔍 Debug API - Primeira variação:', messageVariations && messageVariations[0] ? messageVariations[0].substring(0, 50) + '...' : 'Nenhuma')
                    console.log('🔍 Debug API - Mensagem original:', mensagem.substring(0, 30) + '...')
                    console.log('🔍 Debug API - Variações finais:', localMessageVariations.length)
                    
                    const result = await InstanceDistributionService.sendMessagesWithDynamicBalancing(
                      user_id,
                      telefones.map(telefone => telefone.replace(/\D/g, '')),
                      mensagem,
                      localMessageVariations,
                      timeControl
                    )
                    
                    sucessoCount = result.success
                    falhaCount = result.failed
                    
                    console.log(`📊 Balanceamento dinâmico concluído: ${sucessoCount} sucessos, ${falhaCount} falhas em ${result.totalTime/1000}s`)
                    console.log(`🔄 Instâncias ativas no final: ${result.activeInstancesCount}`)
                    console.log(`📊 Resumo detalhado disponível:`, result.summary)
                    
                    // Atualizar status dos disparos no banco baseado nos resultados
                    for (let i = 0; i < createdDisparos.length; i++) {
                      const disparo = createdDisparos[i]
                      const resultItem = result.results[i]
                      
                      if (resultItem) {
                        await atualizarStatusDisparo(disparo.id, resultItem.success ? 'enviado' : 'falhou')
                      }
                    }
                  } catch (error) {
                    console.error('❌ Erro no balanceamento inteligente:', error)
                    // Fallback para processamento tradicional
                    console.log('🔄 Executando fallback para processamento tradicional...')
                    
                    for (let i = 0; i < createdDisparos.length; i++) {
                      const disparo = createdDisparos[i]
                      const distribution = distributions[i]
                      
                      try {
                        const sucesso = await enviarMensagemEvolutionAPI(
                          disparo.telefone,
                          disparo.mensagem,
                          distribution.instanceName,
                          user_id
                        )
                        
                        await atualizarStatusDisparo(disparo.id, sucesso ? 'enviado' : 'falhou')
                        
                        if (sucesso) {
                          sucessoCount++
                        } else {
                          falhaCount++
                        }
                      } catch (error) {
                        console.error(`❌ Erro ao processar disparo ${i + 1}:`, error)
                        await atualizarStatusDisparo(disparo.id, 'falhou')
                        falhaCount++
                      }
                    }
                  }
                } else {
                  // Processamento tradicional para instância específica ou fallback
                  console.log('🔄 Usando processamento tradicional...')
                  
                  // Utilitários humanizados
                  const randomDelay = (minMs: number, maxMs: number) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs))
                  const getTimeGreeting = () => {
                    const h = new Date().getHours()
                    if (h < 12) return 'Bom dia'
                    if (h < 18) return 'Boa tarde'
                    return 'Boa noite'
                  }
                  const randomBrazilianName = () => {
                    const nomes = ['João','Maria','Pedro','Ana','Lucas','Mariana','Gabriel','Carla','Rafael','Beatriz','Felipe','Camila','Gustavo','Larissa','Bruno','Patrícia','André','Juliana','Thiago','Letícia']
                    return nomes[Math.floor(Math.random()*nomes.length)]
                  }

                  for (let i = 0; i < createdDisparos.length; i++) {
                    const disparo = createdDisparos[i]
                    const distribution = distributions[i]
                    
                    console.log(`📤 Processando disparo ${i + 1}/${createdDisparos.length}:`, {
                      id: disparo.id,
                      phone: disparo.telefone,
                      instance: distribution.instanceName
                    })

                    try {
                      // Enviar mensagem via Evolution API
                      let sucesso = false
                      if (humanizeConversation) {
                        const nome = randomBrazilianName()
                        const saudacao = `${getTimeGreeting()} ${nome}!`
                        const cumprimento = 'Como vai?'
                        const optout = 'Se não deseja mais receber este tipo de mensagem, escreva: NÃO'

                        const s1 = await enviarMensagemEvolutionAPI(disparo.telefone, saudacao, distribution.instanceName, user_id)
                        await randomDelay(1200, 3500)
                        const s2 = await enviarMensagemEvolutionAPI(disparo.telefone, cumprimento, distribution.instanceName, user_id)
                        await randomDelay(1500, 4000)
                        const s3 = await enviarMensagemEvolutionAPI(disparo.telefone, disparo.mensagem, distribution.instanceName, user_id)
                        await randomDelay(1500, 4000)
                        const s4 = await enviarMensagemEvolutionAPI(disparo.telefone, optout, distribution.instanceName, user_id)
                        sucesso = s1 && s2 && s3 && s4
                      } else {
                        sucesso = await enviarMensagemEvolutionAPI(
                          disparo.telefone,
                          disparo.mensagem,
                          distribution.instanceName,
                          user_id
                        )
                      }

                      // Atualizar status no banco
                      await atualizarStatusDisparo(disparo.id, sucesso ? 'enviado' : 'falhou')
                      
                      if (sucesso) {
                        sucessoCount++
                        console.log(`✅ Disparo ${i + 1} processado com sucesso`)
                      } else {
                        falhaCount++
                        console.log(`❌ Disparo ${i + 1} falhou`)
                      }
                    } catch (error) {
                      console.error(`❌ Erro ao processar disparo ${i + 1}:`, error)
                      await atualizarStatusDisparo(disparo.id, 'falhou')
                      falhaCount++
                    }

                    // Delay entre mensagens (5-10 segundos)
                    if (i < createdDisparos.length - 1) {
                      const delay = Math.floor(Math.random() * 6) + 5 // 5-10 segundos
                      console.log(`⏳ Aguardando ${delay} segundos antes da próxima mensagem...`)
                      await new Promise(resolve => setTimeout(resolve, delay * 1000))
                    }
                  }
                }
                
                console.log(`🎉 Processamento concluído! Sucessos: ${sucessoCount}, Falhas: ${falhaCount}`)

    // Buscar estatísticas das instâncias para resposta
    const stats = await InstanceDistributionService.getInstanceStats(user_id)

    // Preparar resposta com resumo se disponível
    const response: any = {
      data: createdDisparos,
      message: instanceName 
        ? `${createdDisparos.length} disparo(s) enviado(s) pela instância ${instanceName}`
        : useRandomDistribution
          ? `${createdDisparos.length} disparo(s) distribuído(s) com balanceamento inteligente entre ${stats.connected} instância(s) conectada(s) (intervalos de 1-3 min)`
          : `${createdDisparos.length} disparo(s) distribuído(s) entre ${stats.connected} instância(s) conectada(s)`,
      stats: {
        totalInstances: stats.total,
        connectedInstances: stats.connected,
        distributionMethod: instanceName ? 'instância específica' : useRandomDistribution ? 'balanceamento inteligente (1-3 min)' : 'aleatória',
        selectedInstance: instanceName,
        useRandomDistribution,
        intelligentBalancing: useRandomDistribution
      }
    }

    // Adicionar resumo detalhado se disponível (balanceamento inteligente)
    // Nota: O resumo detalhado já foi adicionado na resposta durante o processamento

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Erro ao processar disparos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, resposta } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (resposta) updateData.resposta = resposta

    const { data, error } = await supabase
      .from('disparos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para enviar mensagem via Evolution API
async function enviarMensagemEvolutionAPI(telefone: string, mensagem: string, instanceName: string, userId: string): Promise<boolean> {
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
        message: mensagem,
        userId: userId
      })
    })

    const data = await response.json()
    console.log(`📡 Resposta Evolution API:`, { 
      status: response.status, 
      success: data.success,
      error: data.error || 'Nenhum erro específico',
      details: data.details
    })
    
    // Verificar se houve sucesso real
    const sucesso = response.ok && data.success === true
    
    if (!sucesso) {
      console.error(`❌ Falha no envio para ${telefone}:`, {
        status: response.status,
        error: data.error,
        details: data.details
      })
    } else {
      console.log(`✅ Sucesso no envio para ${telefone}`)
    }
    
    return sucesso
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via Evolution API:', error)
    return false
  }
}

// Função para atualizar status do disparo no banco
async function atualizarStatusDisparo(disparoId: string, status: 'enviado' | 'falhou'): Promise<void> {
  try {
    console.log(`📝 Atualizando status do disparo ${disparoId} para ${status}`)
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'enviado') {
      updateData.enviado_em = new Date().toISOString()
    } else {
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
