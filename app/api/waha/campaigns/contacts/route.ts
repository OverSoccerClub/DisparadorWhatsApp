import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { WahaDispatchService } from '@/lib/waha-dispatch-service'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório' }, { status: 400 })
    }

    const contacts = await WahaDispatchService.getCampaignContacts(campaignId, user.id)
    
    return NextResponse.json({ success: true, contacts })
  } catch (error) {
    console.error('Erro ao buscar contatos da campanha:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, contacts } = body

    if (!campaignId || !contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'ID da campanha e lista de contatos são obrigatórios' }, { status: 400 })
    }

    // Validação básica dos contatos
    const validContacts = contacts.filter((contact: any) => 
      contact.phone_number && typeof contact.phone_number === 'string'
    )

    if (validContacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato válido encontrado' }, { status: 400 })
    }

    const addedContacts = await WahaDispatchService.addContactsToCampaign(campaignId, validContacts)

    // Atualiza contagem total na campanha
    const campaign = await WahaDispatchService.getCampaign(campaignId, user.id)
    await WahaDispatchService.updateCampaign(campaignId, {
      total_contacts: campaign.total_contacts + addedContacts.length
    }, user.id)

    return NextResponse.json({ 
      success: true, 
      contacts: addedContacts,
      added: addedContacts.length
    })
  } catch (error) {
    console.error('Erro ao adicionar contatos à campanha:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { contactId, status, errorMessage } = body

    if (!contactId || !status) {
      return NextResponse.json({ error: 'ID do contato e status são obrigatórios' }, { status: 400 })
    }

    const contact = await WahaDispatchService.updateContactStatus(contactId, status, errorMessage)

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.error('Erro ao atualizar status do contato:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
