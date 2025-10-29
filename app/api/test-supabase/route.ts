import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export async function GET(request: NextRequest) {
  try {
    console.log('Testando conexão com Supabase...')
    
    // Testar buscar configurações
    const { data: configs, error: configError } = await EvolutionConfigService.getConfig('user_001')
    console.log('Configurações encontradas:', configs)
    console.log('Erro nas configurações:', configError)
    
    // Testar buscar instâncias
    const { data: instances, error: instanceError } = await EvolutionConfigService.getUserInstances('user_001')
    console.log('Instâncias encontradas:', instances)
    console.log('Erro nas instâncias:', instanceError)
    
    // Testar inserir uma configuração de teste
    const testConfig = {
      user_id: 'user_001',
      api_url: 'https://test.com',
      global_api_key: 'test_key',
      webhook_url: 'https://webhook.test'
    }
    
    const { data: savedConfig, error: saveError } = await EvolutionConfigService.saveConfig(testConfig)
    console.log('Configuração salva:', savedConfig)
    console.log('Erro ao salvar:', saveError)
    
    return NextResponse.json({
      success: true,
      message: 'Teste do Supabase concluído',
      data: {
        configs,
        instances,
        savedConfig,
        errors: {
          configError: configError?.message,
          instanceError: instanceError?.message,
          saveError: saveError?.message
        }
      }
    })
    
  } catch (error: any) {
    console.error('Erro no teste do Supabase:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}
