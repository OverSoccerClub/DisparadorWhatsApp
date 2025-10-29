import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, apiUrl, globalApiKey, webhookUrl } = body

    if (!userId || !apiUrl || !globalApiKey) {
      return NextResponse.json(
        { success: false, error: 'userId, apiUrl e globalApiKey são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Salvando configuração para usuário:', userId)

    const result = await EvolutionConfigService.saveConfig({
      user_id: userId,
      api_url: apiUrl,
      global_api_key: globalApiKey,
      webhook_url: webhookUrl
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuração salva com sucesso',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log(`🔍 [API] GET /api/evolution/save-config - userId: ${userId}`)

    if (!userId) {
      console.log(`❌ [API] userId é obrigatório`)
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Buscando configuração para usuário: ${userId}`)

    const result = await EvolutionConfigService.getConfig(userId)

    console.log(`📊 [API] Resultado do EvolutionConfigService:`, result)

    if (result.success) {
      console.log(`✅ [API] Configuração carregada com sucesso`)
      return NextResponse.json({
        success: true,
        message: 'Configuração carregada com sucesso',
        data: result.data
      })
    } else {
      console.log(`❌ [API] Erro ao carregar configuração: ${result.error}`)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [API] Erro no GET /api/evolution/save-config:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
