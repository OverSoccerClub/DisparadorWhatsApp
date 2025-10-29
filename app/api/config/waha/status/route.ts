import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { serverIds } = await request.json();
    
    if (!serverIds || !Array.isArray(serverIds)) {
      return NextResponse.json({ error: 'IDs dos servidores são obrigatórios' }, { status: 400 });
    }

    // Buscar configurações dos servidores
    const { data: servers, error: serversError } = await supabase
      .from('waha_servers')
      .select('id, nome, api_url, api_key')
      .eq('user_id', user.id)
      .in('id', serverIds);

    if (serversError) {
      console.error('Erro ao buscar servidores:', serversError);
      return NextResponse.json({ error: 'Erro ao buscar servidores' }, { status: 500 });
    }

    // Verificar status de cada servidor
    const statusResults = await Promise.allSettled(
      servers.map(async (server) => {
        const startTime = Date.now();
        
        try {
          const response = await fetch(`${server.api_url}/health`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${server.api_key}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000), // 5 segundos de timeout
          });

          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const healthData = await response.json();
            return {
              id: server.id,
              nome: server.nome,
              status: 'online',
              responseTime,
              lastCheck: new Date().toISOString(),
              instances: healthData.instances || 0,
              activeConnections: healthData.activeConnections || 0,
            };
          } else {
            return {
              id: server.id,
              nome: server.nome,
              status: 'offline',
              responseTime,
              lastCheck: new Date().toISOString(),
              error: `HTTP ${response.status}`,
            };
          }
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          return {
            id: server.id,
            nome: server.nome,
            status: 'offline',
            responseTime,
            lastCheck: new Date().toISOString(),
            error: error.message || 'Erro de conexão',
          };
        }
      })
    );

    // Processar resultados
    const results = statusResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: servers[index]?.id,
          nome: servers[index]?.nome,
          status: 'offline',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: 'Erro inesperado',
        };
      }
    });

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Erro na verificação de status dos servidores WAHA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
