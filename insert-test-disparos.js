/**
 * Script para inserir dados de teste na tabela disparos
 */

const insertTestDisparos = async () => {
  console.log('📝 Inserindo dados de teste na tabela disparos...\n')

  try {
    // Dados de teste
    const testDisparos = [
      {
        user_id: '92648299-39f8-48d6-957b-65b72091339d',
        telefone: '5584999727583',
        mensagem: '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!',
        status: 'enviado',
        instance_name: 'inst_70e6b148',
        enviado_em: new Date().toISOString(),
        tentativas: 1,
        max_tentativas: 3
      },
      {
        user_id: '92648299-39f8-48d6-957b-65b72091339d',
        telefone: '5584991053082',
        mensagem: '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!',
        status: 'pendente',
        instance_name: 'inst_70e6b148',
        tentativas: 0,
        max_tentativas: 3
      },
      {
        user_id: '92648299-39f8-48d6-957b-65b72091339d',
        telefone: '5584981610110',
        mensagem: '🎉 RASPADINHA DO NÁUTICO ONLINE! 🎁\nRaspe agora e concorra a prêmios instantâneos incríveis! 😍\n💰 Ganhe até R$10.000,00 e se divirta!\n👉 Acesse: https://nautico.game-core.app\n\nNão perca tempo — sua sorte pode estar a um clique! 🍀\n⚠️ Jogue com responsabilidade!!',
        status: 'falhou',
        instance_name: 'inst_70e6b148',
        erro: 'Número inválido ou bloqueado',
        tentativas: 3,
        max_tentativas: 3
      }
    ]

    // Inserir via API
    for (let i = 0; i < testDisparos.length; i++) {
      const disparo = testDisparos[i]
      console.log(`📝 Inserindo disparo ${i + 1}/${testDisparos.length}...`)
      
      try {
        const response = await fetch('http://localhost:3000/api/disparos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            telefones: [disparo.telefone],
            mensagem: disparo.mensagem,
            agendamento: null,
            user_id: disparo.user_id,
            instanceName: disparo.instance_name,
            useRandomDistribution: false
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Disparo ${i + 1} inserido: ${data.message}`)
        } else {
          const errorData = await response.json()
          console.log(`❌ Erro ao inserir disparo ${i + 1}:`, errorData.error)
        }
      } catch (error) {
        console.log(`❌ Erro ao inserir disparo ${i + 1}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 CONCLUSÃO:')
    console.log('✅ Dados de teste inseridos')
    console.log('✅ Tabela disparos populada')
    console.log('✅ Pronto para testar paginação e filtros!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
insertTestDisparos()
