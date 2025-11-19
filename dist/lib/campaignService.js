"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const supabaseClient_1 = require("./supabaseClient");
class CampaignService {
    // Buscar todas as campanhas (filtradas por user_id)
    static async getCampanhas(userId) {
        try {
            const { data, error } = await supabaseClient_1.supabase
                .from('campanhas')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Erro ao buscar campanhas:', error);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao buscar campanhas:', error);
            return [];
        }
    }
    // Buscar campanha por ID (filtrada por user_id)
    static async getCampanhaById(id, userId) {
        try {
            const { data, error } = await supabaseClient_1.supabase
                .from('campanhas')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error) {
                console.error('Erro ao buscar campanha:', error);
                return { data: null, error };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro ao buscar campanha:', error);
            return { data: null, error };
        }
    }
    // Criar nova campanha (com user_id)
    static async criarCampanha(campanha, userId) {
        try {
            const { data, error } = await supabaseClient_1.supabase
                .from('campanhas')
                .insert([{
                    nome: campanha.nome,
                    mensagem: campanha.mensagem,
                    criterios: campanha.criterios,
                    configuracao: campanha.configuracao,
                    user_id: userId,
                    status: 'rascunho',
                    progresso: {
                        totalClientes: 0,
                        totalLotes: 0,
                        lotesProcessados: 0,
                        clientesEnviados: 0,
                        clientesFalharam: 0,
                        status: 'rascunho'
                    },
                    relatorio: {
                        entregues: 0,
                        falhas: 0,
                        engajamento: {
                            lidos: 0,
                            respondidos: 0,
                            cliques: 0
                        },
                        detalhesFalhas: []
                    }
                }])
                .select()
                .single();
            if (error) {
                console.error('Erro ao criar campanha:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('Erro ao criar campanha:', error);
            return null;
        }
    }
    // Atualizar campanha (verificando user_id)
    static async atualizarCampanha(id, updates, userId) {
        try {
            const { error } = await supabaseClient_1.supabase
                .from('campanhas')
                .update(updates)
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                console.error('Erro ao atualizar campanha:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Erro ao atualizar campanha:', error);
            return false;
        }
    }
    // Deletar campanha (verificando user_id)
    static async deletarCampanha(id, userId) {
        try {
            const { error } = await supabaseClient_1.supabase
                .from('campanhas')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                console.error('Erro ao deletar campanha:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Erro ao deletar campanha:', error);
            return false;
        }
    }
    // Controle de campanha (iniciar, pausar, retomar, cancelar) - verificando user_id
    static async controlarCampanha(id, controle, userId) {
        try {
            const { acao } = controle;
            let statusUpdate = '';
            let progressoUpdate = {};
            switch (acao) {
                case 'iniciar':
                    statusUpdate = 'processando';
                    progressoUpdate = {
                        status: 'processando',
                        iniciadoEm: new Date().toISOString()
                    };
                    break;
                case 'pausar':
                    statusUpdate = 'pausada';
                    progressoUpdate = {
                        status: 'pausada'
                    };
                    break;
                case 'retomar':
                    statusUpdate = 'processando';
                    progressoUpdate = {
                        status: 'processando'
                    };
                    break;
                case 'cancelar':
                    statusUpdate = 'rascunho';
                    progressoUpdate = {
                        status: 'rascunho'
                    };
                    break;
            }
            const { error } = await supabaseClient_1.supabase
                .from('campanhas')
                .update({
                status: statusUpdate,
                progresso: progressoUpdate
            })
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                console.error('Erro ao controlar campanha:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Erro ao controlar campanha:', error);
            return false;
        }
    }
    // Buscar clientes baseado nos critérios (filtrado por user_id)
    static async buscarClientesPorCriterios(criterios, userId) {
        try {
            let query = supabaseClient_1.supabase
                .from('clientes')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            // Aplicar filtros baseado nos critérios
            if (criterios.status && criterios.status !== 'todos') {
                query = query.eq('status', criterios.status);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Erro ao buscar clientes:', error);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao buscar clientes:', error);
            return [];
        }
    }
    // Criar lotes para uma campanha
    static async criarLotes(campanhaId, clientes, clientesPorLote) {
        try {
            const lotes = [];
            const totalLotes = Math.ceil(clientes.length / clientesPorLote);
            for (let i = 0; i < totalLotes; i++) {
                const inicio = i * clientesPorLote;
                const fim = Math.min(inicio + clientesPorLote, clientes.length);
                const clientesLote = clientes.slice(inicio, fim);
                lotes.push({
                    campanha_id: campanhaId,
                    numero_lote: i + 1,
                    clientes: clientesLote.map(cliente => ({
                        id: cliente.id?.toString() || '',
                        nome: cliente.nome,
                        telefone: cliente.telefone
                    })),
                    status: 'pendente'
                });
            }
            const { error } = await supabaseClient_1.supabase
                .from('lotes_campanha')
                .insert(lotes);
            if (error) {
                console.error('Erro ao criar lotes:', error);
                return false;
            }
            // Atualizar progresso da campanha
            await supabaseClient_1.supabase
                .from('campanhas')
                .update({
                progresso: {
                    totalClientes: clientes.length,
                    totalLotes: totalLotes,
                    lotesProcessados: 0,
                    clientesEnviados: 0,
                    clientesFalharam: 0,
                    status: 'agendada'
                }
            })
                .eq('id', campanhaId);
            return true;
        }
        catch (error) {
            console.error('Erro ao criar lotes:', error);
            return false;
        }
    }
    // Buscar lotes de uma campanha
    static async getLotesCampanha(campanhaId) {
        try {
            const { data, error } = await supabaseClient_1.supabase
                .from('lotes_campanha')
                .select('*')
                .eq('campanha_id', campanhaId)
                .order('numero_lote', { ascending: true });
            if (error) {
                console.error('Erro ao buscar lotes:', error);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao buscar lotes:', error);
            return [];
        }
    }
    // Gerar relatório de campanha (verificando user_id)
    static async gerarRelatorio(campanhaId, userId) {
        try {
            const campanha = await this.getCampanhaById(campanhaId, userId);
            if (!campanha.data)
                return null;
            const campanhaData = campanha.data;
            const lotes = await this.getLotesCampanha(campanhaId);
            const estatisticas = {
                totalClientes: campanhaData.progresso.totalClientes,
                clientesEnviados: campanhaData.progresso.clientesEnviados,
                clientesFalharam: campanhaData.progresso.clientesFalharam,
                taxaEntrega: campanhaData.progresso.totalClientes > 0
                    ? (campanhaData.progresso.clientesEnviados / campanhaData.progresso.totalClientes) * 100
                    : 0,
                tempoTotal: 0, // TODO: Calcular baseado nos timestamps
                velocidadeMedia: 0 // TODO: Calcular baseado no tempo total
            };
            const relatorio = {
                campanha: campanhaData,
                estatisticas,
                lotes: lotes.map(lote => ({
                    numero: lote.numero_lote,
                    status: lote.status,
                    clientes: lote.clientes.length,
                    enviados: 0, // TODO: Calcular baseado nos disparos
                    falhas: 0, // TODO: Calcular baseado nos disparos
                    tempoProcessamento: 0 // TODO: Calcular baseado nos timestamps
                })),
                engajamento: campanhaData.relatorio.engajamento
            };
            return relatorio;
        }
        catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return null;
        }
    }
}
exports.CampaignService = CampaignService;
