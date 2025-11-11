import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CampaignService } from '@/lib/campaignService'

// GET /api/campanhas/[id]/relatorio - Gerar relatório da campanha
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação
    const cookieStore = cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Verificar se campanha existe
    const { data: campanha, error: campanhaError } = await CampaignService.getCampanhaById(id, user.id)
    if (campanhaError || !campanha) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Gerar relatório
    const relatorio = await CampaignService.gerarRelatorio(id, user.id)

    if (!relatorio) {
      return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
    }

    return NextResponse.json({ data: relatorio })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
