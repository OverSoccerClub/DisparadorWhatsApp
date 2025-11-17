import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Usar autenticação Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, instanceName, connectionStatus, phoneNumber, lastSeen } = body

    // Validar que o userId da requisição corresponde ao usuário autenticado
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a salvar instância para outro usuário' },
        { status: 403 }
      )
    }

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: 'instanceName é obrigatório' },
        { status: 400 }
      )
    }

    console.log('💾 Salvando instância:', instanceName, 'para usuário:', userId)

    // Converter connectionStatus para o formato esperado pelo banco
    let status: 'open' | 'close' | 'connecting' = 'close'
    if (connectionStatus === 'connected' || connectionStatus === 'open') {
      status = 'open'
    } else if (connectionStatus === 'connecting') {
      status = 'connecting'
    }

    const result = await EvolutionConfigService.saveInstance({
      user_id: userId,
      instance_name: instanceName,
      connection_status: status,
      phone_number: phoneNumber,
      last_seen: lastSeen
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Instância salva com sucesso',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao salvar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Usar autenticação Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, instanceName, connectionStatus, phoneNumber, lastSeen } = body

    // Validar que o userId da requisição corresponde ao usuário autenticado
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a atualizar instância de outro usuário' },
        { status: 403 }
      )
    }

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: 'instanceName é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔄 Atualizando instância:', instanceName, 'para usuário:', userId)

    const updates: any = {}
    if (connectionStatus) {
      // Converter connectionStatus para o formato esperado pelo banco
      if (connectionStatus === 'connected' || connectionStatus === 'open') {
        updates.connection_status = 'open'
      } else if (connectionStatus === 'connecting') {
        updates.connection_status = 'connecting'
      } else {
        updates.connection_status = 'close'
      }
    }
    if (phoneNumber) updates.phone_number = phoneNumber
    if (lastSeen) updates.last_seen = lastSeen

    const result = await EvolutionConfigService.updateInstanceStatus(
      userId,
      instanceName,
      updates
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Instância atualizada com sucesso',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao atualizar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Usar autenticação Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, instanceName } = body

    // Validar que o userId da requisição corresponde ao usuário autenticado
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a excluir instância de outro usuário' },
        { status: 403 }
      )
    }

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: 'instanceName é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🗑️ Excluindo instância:', instanceName, 'para usuário:', userId)

    const result = await EvolutionConfigService.deleteInstance(userId, instanceName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Instância excluída com sucesso',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao excluir instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
