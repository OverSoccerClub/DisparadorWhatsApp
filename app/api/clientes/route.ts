import { NextRequest, NextResponse } from 'next/server'
import { DisparosSMSService } from '@/lib/supabaseClient'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'todos'

    // Validar limite
    const validLimits = [5, 10, 20, 50, 100, 500]
    const finalLimit = validLimits.includes(limit) ? limit : 10
    

    // Buscar clientes com paginação real do Supabase
    const { data: clientes, error, count } = await DisparosSMSService.getClientesPaginated({
      page,
      limit: finalLimit,
      search,
      status
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: clientes || [],
      pagination: {
        page,
        limit: finalLimit,
        total: count || 0,
        pages: Math.ceil((count || 0) / finalLimit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, telefone, email, status = 'ativo' } = body

    // Validar dados obrigatórios
    if (!nome || !telefone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
    }

    // Verificar se telefone já existe
    const clienteExistente = await DisparosSMSService.getClienteByTelefone(telefone)
    if (clienteExistente) {
      return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 })
    }

    const novoCliente = {
      nome,
      telefone,
      mensagens: '',
      status
    }

    const sucesso = await DisparosSMSService.addCliente(novoCliente)
    
    if (!sucesso) {
      return NextResponse.json({ error: 'Erro ao adicionar cliente' }, { status: 500 })
    }

    // Buscar o cliente recém-criado
    const clienteCriado = await DisparosSMSService.getClienteByTelefone(telefone)
    
    return NextResponse.json({ data: clienteCriado }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nome, telefone, email, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('clientes')
      .update({
        nome,
        telefone,
        email,
        status
      })
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cliente excluído com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
