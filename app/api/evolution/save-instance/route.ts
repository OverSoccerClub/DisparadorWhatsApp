import { NextRequest, NextResponse } from 'next/server'
import { EvolutionConfigService } from '@/lib/supabase/evolution-config-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, instanceName, connectionStatus, phoneNumber, lastSeen } = body

    if (!userId || !instanceName) {
      return NextResponse.json(
        { success: false, error: 'userId e instanceName são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Salvando instância:', instanceName, 'para usuário:', userId)

    const result = await EvolutionConfigService.saveInstance({
      user_id: userId,
      instance_name: instanceName,
      connection_status: connectionStatus || 'disconnected',
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
    const body = await request.json()
    const { userId, instanceName, connectionStatus, phoneNumber, lastSeen } = body

    if (!userId || !instanceName) {
      return NextResponse.json(
        { success: false, error: 'userId e instanceName são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Atualizando instância:', instanceName, 'para usuário:', userId)

    const updates: any = {}
    if (connectionStatus) updates.connection_status = connectionStatus
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
    const body = await request.json()
    const { userId, instanceName } = body

    if (!userId || !instanceName) {
      return NextResponse.json(
        { success: false, error: 'userId e instanceName são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Excluindo instância:', instanceName, 'para usuário:', userId)

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
