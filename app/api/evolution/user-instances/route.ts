import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Buscando instâncias para usuário:', userId)

    const result = await EvolutionConfigService.getUserInstances(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Instâncias carregadas com sucesso',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao buscar instâncias:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
