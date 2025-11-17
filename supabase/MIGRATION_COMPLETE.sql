-- ============================================================================
-- DISPARADOR WHATSAPP - MIGRAÇÃO COMPLETA PARA NOVO SERVIDOR SUPABASE
-- Execute este SQL no SQL Editor do Supabase: https://supabase.innovarecode.com.br
-- Versão: 3.0 - Schema Completo com Todas as Funcionalidades
-- Data: 2025
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES E CONFIGURAÇÕES
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto

-- ============================================================================
-- 2. TABELA: clientes
-- Armazena os contatos/clientes do sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_nome_trgm ON public.clientes USING gin(nome gin_trgm_ops);

COMMENT ON TABLE public.clientes IS 'Contatos/clientes do sistema';

-- ============================================================================
-- 3. TABELA: campanhas
-- Armazena as campanhas de envio de mensagens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    destinatarios JSONB DEFAULT '[]'::jsonb,
    criterios JSONB,
    configuracao JSONB,
    agendamento TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'pausada', 'cancelada')),
    progresso JSONB DEFAULT '{}'::jsonb,
    relatorio JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campanhas_user_id ON public.campanhas(user_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON public.campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_created_at ON public.campanhas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campanhas_agendamento ON public.campanhas(agendamento) WHERE agendamento IS NOT NULL;

COMMENT ON TABLE public.campanhas IS 'Campanhas de envio de mensagens WhatsApp';

-- ============================================================================
-- 4. TABELA: disparos
-- Armazena os envios individuais de mensagens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviando', 'enviado', 'entregue', 'lido', 'erro', 'falhou')),
    resposta TEXT,
    erro TEXT,
    instance_name VARCHAR(255),
    agendamento TIMESTAMP WITH TIME ZONE,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_disparos_campanha_id ON public.disparos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_disparos_user_id ON public.disparos(user_id);
CREATE INDEX IF NOT EXISTS idx_disparos_status ON public.disparos(status);
CREATE INDEX IF NOT EXISTS idx_disparos_telefone ON public.disparos(telefone);
CREATE INDEX IF NOT EXISTS idx_disparos_created_at ON public.disparos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disparos_enviado_em ON public.disparos(enviado_em DESC) WHERE enviado_em IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disparos_instance_name ON public.disparos(instance_name) WHERE instance_name IS NOT NULL;

COMMENT ON TABLE public.disparos IS 'Envios individuais de mensagens WhatsApp';

-- ============================================================================
-- 5. TABELA: lotes_campanha
-- Armazena os lotes de processamento das campanhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lotes_campanha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
    numero_lote INTEGER NOT NULL,
    clientes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    processado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lotes_campanha_id ON public.lotes_campanha(campanha_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes_campanha(status);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes_campanha(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lotes_campanha_numero ON public.lotes_campanha(campanha_id, numero_lote);

COMMENT ON TABLE public.lotes_campanha IS 'Lotes de processamento de campanhas';

-- ============================================================================
-- 6. TABELA: evolution_configs
-- Armazena as configurações da Evolution API por usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evolution_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    api_url TEXT NOT NULL,
    global_api_key TEXT NOT NULL,
    webhook_url TEXT,
    webhook_events JSONB DEFAULT '[]'::jsonb,
    auto_create BOOLEAN DEFAULT false,
    qrcode_timeout INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evolution_configs_user_id ON public.evolution_configs(user_id);

COMMENT ON TABLE public.evolution_configs IS 'Configurações da Evolution API por usuário';

-- ============================================================================
-- 7. TABELA: evolution_instances
-- Armazena as instâncias WhatsApp criadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    phone_number VARCHAR(20),
    profile_name VARCHAR(255),
    profile_picture_url TEXT,
    qr_code TEXT,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evolution_instances_user_id ON public.evolution_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_instance_name ON public.evolution_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_status ON public.evolution_instances(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evolution_instances_user_instance ON public.evolution_instances(user_id, instance_name);

COMMENT ON TABLE public.evolution_instances IS 'Instâncias WhatsApp da Evolution API';

-- ============================================================================
-- 8. TABELA: waha_servers
-- Armazena múltiplos servidores WAHA por usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    prioridade INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 10,
    sessions_ativas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_waha_servers_user_id ON public.waha_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_servers_ativo ON public.waha_servers(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_waha_servers_prioridade ON public.waha_servers(prioridade DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waha_servers_user_url ON public.waha_servers(user_id, api_url);

COMMENT ON TABLE public.waha_servers IS 'Múltiplos servidores WAHA por usuário';
COMMENT ON COLUMN public.waha_servers.prioridade IS 'Prioridade de uso (maior = mais prioritário)';
COMMENT ON COLUMN public.waha_servers.max_sessions IS 'Máximo de sessões permitidas neste servidor';
COMMENT ON COLUMN public.waha_servers.sessions_ativas IS 'Número atual de sessões ativas';

-- ============================================================================
-- 9. TABELA: waha_sessions
-- Armazena sessões WhatsApp de cada servidor WAHA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    waha_server_id UUID REFERENCES public.waha_servers(id) ON DELETE CASCADE NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error', 'stopped')),
    phone_number VARCHAR(20),
    profile_name VARCHAR(255),
    qr_code TEXT,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_waha_sessions_user_id ON public.waha_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_sessions_server_id ON public.waha_sessions(waha_server_id);
CREATE INDEX IF NOT EXISTS idx_waha_sessions_status ON public.waha_sessions(status);
CREATE INDEX IF NOT EXISTS idx_waha_sessions_session_name ON public.waha_sessions(session_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waha_sessions_server_session ON public.waha_sessions(waha_server_id, session_name);

COMMENT ON TABLE public.waha_sessions IS 'Sessões WhatsApp em servidores WAHA';

-- ============================================================================
-- 10. TABELA: waha_campaigns
-- Campanhas de disparo WhatsApp usando WAHA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    mensagem TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Configurações de timing
    delay_min INTEGER DEFAULT 5,
    delay_max INTEGER DEFAULT 15,
    messages_per_minute INTEGER DEFAULT 10,
    
    -- Configurações de variação
    enable_variations BOOLEAN DEFAULT false,
    variation_prompt TEXT,
    variation_count INTEGER DEFAULT 3,
    
    -- Configurações de balanceamento
    load_balancing_strategy VARCHAR(50) DEFAULT 'round_robin' CHECK (load_balancing_strategy IN ('round_robin', 'least_connections', 'random')),
    
    -- Estatísticas
    total_contacts INTEGER DEFAULT 0,
    sent_messages INTEGER DEFAULT 0,
    failed_messages INTEGER DEFAULT 0,
    pending_messages INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 11. TABELA: waha_campaign_contacts
-- Contatos das campanhas WAHA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.waha_campaigns(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    nome VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. TABELA: waha_dispatches
-- Histórico de disparos WAHA executados
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.waha_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sessão WAHA utilizada
    waha_server_id UUID NOT NULL REFERENCES public.waha_servers(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    
    -- Configurações do disparo
    mensagem TEXT NOT NULL,
    variation_index INTEGER DEFAULT 0,
    
    -- Status e timing
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,
    
    -- Resultado
    success BOOLEAN,
    error_message TEXT,
    whatsapp_message_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 13. TABELA: waha_session_stats
-- Estatísticas de uso das sessões WAHA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_session_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waha_server_id UUID NOT NULL REFERENCES public.waha_servers(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contadores
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    
    -- Timestamps
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(waha_server_id, session_name, user_id)
);

-- ============================================================================
-- 14. TABELA: waha_config
-- Configurações globais do WAHA (singleton)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    api_url TEXT NOT NULL,
    api_key TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    enable_auto_reconnect BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_presence BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT waha_config_id_check CHECK (id = 1)
);

CREATE INDEX IF NOT EXISTS idx_waha_config_id ON public.waha_config(id);
COMMENT ON TABLE public.waha_config IS 'Configurações globais do WAHA (WhatsApp HTTP API)';

-- ============================================================================
-- 15. TABELA: telegram_bots
-- Bots do Telegram configurados por usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.telegram_bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    bot_token TEXT NOT NULL,
    bot_username VARCHAR(255),
    numero_remetente VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_bot_name UNIQUE(user_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_telegram_bots_user_id ON public.telegram_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_status ON public.telegram_bots(status);
COMMENT ON TABLE public.telegram_bots IS 'Bots do Telegram configurados por usuário';

-- ============================================================================
-- 16. TABELA: maturacao_schedules
-- Armazena agendamentos de maturação de chips
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maturacao_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Configuração da maturação
    sessions JSONB NOT NULL, -- Array de sessões selecionadas
    cadence_seconds INTEGER DEFAULT 60,
    message_templates TEXT,
    number_of_rounds INTEGER DEFAULT 1,
    minutes_per_round INTEGER DEFAULT 10,
    pause_minutes_between_rounds INTEGER DEFAULT 5,
    
    -- Agendamento
    scheduled_start_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Data/hora de início agendada
    scheduled_end_at TIMESTAMP WITH TIME ZONE, -- Data/hora final calculada (opcional)
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'executando', 'concluido', 'cancelado', 'pausado', 'erro')),
    maturation_id VARCHAR(255), -- ID da maturação quando executada
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE, -- Quando foi executado
    error_message TEXT -- Mensagem de erro se houver falha
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_user_id ON public.maturacao_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_status ON public.maturacao_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_start_at ON public.maturacao_schedules(scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_created_at ON public.maturacao_schedules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_pending ON public.maturacao_schedules(status, scheduled_start_at) 
    WHERE status = 'agendado';

COMMENT ON TABLE public.maturacao_schedules IS 'Agendamentos de maturação de chips';
COMMENT ON COLUMN public.maturacao_schedules.sessions IS 'Array de sessões WAHA no formato ["serverId:sessionName", ...]';

-- ============================================================================
-- 17. TABELA: activation_codes
-- Códigos de ativação de contas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_user_id ON public.activation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_email ON public.activation_codes(email);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_used ON public.activation_codes(used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON public.activation_codes(expires_at);
COMMENT ON TABLE public.activation_codes IS 'Códigos de ativação de contas de usuários';

-- ============================================================================
-- 17. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índices para waha_campaigns
CREATE INDEX IF NOT EXISTS idx_waha_campaigns_user_id ON public.waha_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_campaigns_status ON public.waha_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_waha_campaigns_created_at ON public.waha_campaigns(created_at DESC);

-- Índices para waha_campaign_contacts
CREATE INDEX IF NOT EXISTS idx_waha_campaign_contacts_campaign_id ON public.waha_campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_waha_campaign_contacts_status ON public.waha_campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_waha_campaign_contacts_phone ON public.waha_campaign_contacts(phone_number);

-- Índices para waha_dispatches
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_campaign_id ON public.waha_dispatches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_user_id ON public.waha_dispatches(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_status ON public.waha_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_scheduled_at ON public.waha_dispatches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_waha_server_id ON public.waha_dispatches(waha_server_id);

-- Índices para waha_session_stats
CREATE INDEX IF NOT EXISTS idx_waha_session_stats_user_id ON public.waha_session_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_session_stats_waha_server_id ON public.waha_session_stats(waha_server_id);
CREATE INDEX IF NOT EXISTS idx_waha_session_stats_last_activity ON public.waha_session_stats(last_activity DESC);

-- ============================================================================
-- 18. FUNÇÕES ÚTEIS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at do telegram_bots
CREATE OR REPLACE FUNCTION update_telegram_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para obter estatísticas de clientes
CREATE OR REPLACE FUNCTION public.get_client_stats(user_uuid UUID)
RETURNS TABLE (
    total_clientes BIGINT,
    clientes_ativos BIGINT,
    clientes_inativos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
        COUNT(*) FILTER (WHERE status = 'inativo') as clientes_inativos
    FROM public.clientes 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de campanhas
CREATE OR REPLACE FUNCTION public.get_campaign_stats(user_uuid UUID)
RETURNS TABLE (
    total_campanhas BIGINT,
    campanhas_ativas BIGINT,
    mensagens_enviadas BIGINT,
    mensagens_pendentes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_campanhas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('agendada', 'enviando')) as campanhas_ativas,
        COUNT(d.id) FILTER (WHERE d.status IN ('enviado', 'entregue', 'lido')) as mensagens_enviadas,
        COUNT(d.id) FILTER (WHERE d.status = 'pendente') as mensagens_pendentes
    FROM public.campanhas c
    LEFT JOIN public.disparos d ON c.id = d.campanha_id
    WHERE c.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter servidor WAHA disponível (load balancing)
CREATE OR REPLACE FUNCTION public.get_available_waha_server(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    api_url TEXT,
    api_key TEXT,
    sessions_ativas INTEGER,
    max_sessions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.id,
        ws.nome,
        ws.api_url,
        ws.api_key,
        ws.sessions_ativas,
        ws.max_sessions
    FROM public.waha_servers ws
    WHERE ws.user_id = user_uuid
      AND ws.ativo = true
      AND ws.sessions_ativas < ws.max_sessions
    ORDER BY 
        ws.prioridade DESC,
        (CAST(ws.sessions_ativas AS FLOAT) / NULLIF(ws.max_sessions, 0)) ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_available_waha_server IS 'Retorna o servidor WAHA mais adequado com base em prioridade e carga';

-- ============================================================================
-- 19. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Triggers para todas as tabelas com updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_campanhas_updated_at ON public.campanhas;
CREATE TRIGGER update_campanhas_updated_at
    BEFORE UPDATE ON public.campanhas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_disparos_updated_at ON public.disparos;
CREATE TRIGGER update_disparos_updated_at
    BEFORE UPDATE ON public.disparos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evolution_configs_updated_at ON public.evolution_configs;
CREATE TRIGGER update_evolution_configs_updated_at
    BEFORE UPDATE ON public.evolution_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evolution_instances_updated_at ON public.evolution_instances;
CREATE TRIGGER update_evolution_instances_updated_at
    BEFORE UPDATE ON public.evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waha_servers_updated_at ON public.waha_servers;
CREATE TRIGGER update_waha_servers_updated_at
    BEFORE UPDATE ON public.waha_servers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waha_sessions_updated_at ON public.waha_sessions;
CREATE TRIGGER update_waha_sessions_updated_at
    BEFORE UPDATE ON public.waha_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waha_campaigns_updated_at ON public.waha_campaigns;
CREATE TRIGGER update_waha_campaigns_updated_at
    BEFORE UPDATE ON public.waha_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waha_session_stats_updated_at ON public.waha_session_stats;
CREATE TRIGGER update_waha_session_stats_updated_at
    BEFORE UPDATE ON public.waha_session_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_telegram_bots_updated_at ON public.telegram_bots;
CREATE TRIGGER update_telegram_bots_updated_at
    BEFORE UPDATE ON public.telegram_bots
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_bots_updated_at();

DROP TRIGGER IF EXISTS trigger_update_maturacao_schedules_updated_at ON public.maturacao_schedules;
CREATE TRIGGER trigger_update_maturacao_schedules_updated_at
    BEFORE UPDATE ON public.maturacao_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 20. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Desabilitar RLS para tabelas principais (conforme configuração original)
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disparos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_campanha DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_servers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturacao_schedules DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS para tabelas WAHA e Telegram
ALTER TABLE public.waha_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 21. POLICIES DE SEGURANÇA (RLS)
-- ============================================================================

-- Policies para waha_campaigns
DROP POLICY IF EXISTS "Users can view own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can insert own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can update own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can delete own waha campaigns" ON public.waha_campaigns;

CREATE POLICY "Users can view own waha campaigns" 
    ON public.waha_campaigns FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waha campaigns" 
    ON public.waha_campaigns FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waha campaigns" 
    ON public.waha_campaigns FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waha campaigns" 
    ON public.waha_campaigns FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies para waha_campaign_contacts
DROP POLICY IF EXISTS "Users can view own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can insert own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can update own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can delete own waha campaign contacts" ON public.waha_campaign_contacts;

CREATE POLICY "Users can view own waha campaign contacts" 
    ON public.waha_campaign_contacts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.waha_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own waha campaign contacts" 
    ON public.waha_campaign_contacts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.waha_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own waha campaign contacts" 
    ON public.waha_campaign_contacts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.waha_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own waha campaign contacts" 
    ON public.waha_campaign_contacts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.waha_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

-- Policies para waha_dispatches
DROP POLICY IF EXISTS "Users can view own waha dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can insert own waha dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can update own waha dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can delete own waha dispatches" ON public.waha_dispatches;

CREATE POLICY "Users can view own waha dispatches" 
    ON public.waha_dispatches FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waha dispatches" 
    ON public.waha_dispatches FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waha dispatches" 
    ON public.waha_dispatches FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waha dispatches" 
    ON public.waha_dispatches FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies para waha_session_stats
DROP POLICY IF EXISTS "Users can view own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can insert own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can update own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can delete own waha session stats" ON public.waha_session_stats;

CREATE POLICY "Users can view own waha session stats" 
    ON public.waha_session_stats FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waha session stats" 
    ON public.waha_session_stats FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waha session stats" 
    ON public.waha_session_stats FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waha session stats" 
    ON public.waha_session_stats FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies para waha_config
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;

CREATE POLICY "Permitir leitura para usuários autenticados" ON public.waha_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização para usuários autenticados" ON public.waha_config
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.waha_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policies para telegram_bots
DROP POLICY IF EXISTS "Users can view their own telegram bots" ON public.telegram_bots;
DROP POLICY IF EXISTS "Users can insert their own telegram bots" ON public.telegram_bots;
DROP POLICY IF EXISTS "Users can update their own telegram bots" ON public.telegram_bots;
DROP POLICY IF EXISTS "Users can delete their own telegram bots" ON public.telegram_bots;

CREATE POLICY "Users can view their own telegram bots"
    ON public.telegram_bots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram bots"
    ON public.telegram_bots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram bots"
    ON public.telegram_bots FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram bots"
    ON public.telegram_bots FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 22. PERMISSÕES
-- ============================================================================

-- Permissões para authenticated users
GRANT ALL ON public.clientes TO authenticated;
GRANT ALL ON public.campanhas TO authenticated;
GRANT ALL ON public.disparos TO authenticated;
GRANT ALL ON public.lotes_campanha TO authenticated;
GRANT ALL ON public.evolution_configs TO authenticated;
GRANT ALL ON public.evolution_instances TO authenticated;
GRANT ALL ON public.waha_servers TO authenticated;
GRANT ALL ON public.waha_sessions TO authenticated;
GRANT ALL ON public.waha_campaigns TO authenticated;
GRANT ALL ON public.waha_campaign_contacts TO authenticated;
GRANT ALL ON public.waha_dispatches TO authenticated;
GRANT ALL ON public.waha_session_stats TO authenticated;
GRANT ALL ON public.waha_config TO authenticated;
GRANT ALL ON public.telegram_bots TO authenticated;
GRANT ALL ON public.activation_codes TO authenticated;
GRANT ALL ON public.maturacao_schedules TO authenticated;

-- Permissões para service_role (usado pelas APIs)
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.campanhas TO service_role;
GRANT ALL ON public.disparos TO service_role;
GRANT ALL ON public.lotes_campanha TO service_role;
GRANT ALL ON public.evolution_configs TO service_role;
GRANT ALL ON public.evolution_instances TO service_role;
GRANT ALL ON public.waha_servers TO service_role;
GRANT ALL ON public.waha_sessions TO service_role;
GRANT ALL ON public.waha_campaigns TO service_role;
GRANT ALL ON public.waha_campaign_contacts TO service_role;
GRANT ALL ON public.waha_dispatches TO service_role;
GRANT ALL ON public.waha_session_stats TO service_role;
GRANT ALL ON public.waha_config TO service_role;
GRANT ALL ON public.telegram_bots TO service_role;
GRANT ALL ON public.activation_codes TO service_role;
GRANT ALL ON public.maturacao_schedules TO service_role;

-- Permissões para anon (apenas leitura em waha_servers)
GRANT SELECT ON public.waha_servers TO anon;

-- ============================================================================
-- 23. VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar todas as tabelas criadas
SELECT 
    '✅ MIGRAÇÃO COMPLETA - SCHEMA V3.0 CRIADO COM SUCESSO!' as status,
    'Verificando tabelas criadas...' as acao;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes', 'campanhas', 'disparos', 'lotes_campanha',
    'evolution_configs', 'evolution_instances',
    'waha_servers', 'waha_sessions', 'waha_campaigns',
    'waha_campaign_contacts', 'waha_dispatches', 'waha_session_stats',
    'waha_config', 'telegram_bots', 'activation_codes', 'maturacao_schedules'
  )
ORDER BY tablename;

-- Contar registros (deve ser 0 em banco novo)
SELECT 
    '📊 CONTAGEM DE REGISTROS:' as info;

SELECT 
    'clientes' as tabela, COUNT(*) as total FROM public.clientes
UNION ALL
SELECT 
    'campanhas' as tabela, COUNT(*) as total FROM public.campanhas
UNION ALL
SELECT 
    'disparos' as tabela, COUNT(*) as total FROM public.disparos
UNION ALL
SELECT 
    'lotes_campanha' as tabela, COUNT(*) as total FROM public.lotes_campanha
UNION ALL
SELECT 
    'evolution_configs' as tabela, COUNT(*) as total FROM public.evolution_configs
UNION ALL
SELECT 
    'evolution_instances' as tabela, COUNT(*) as total FROM public.evolution_instances
UNION ALL
SELECT 
    'waha_servers' as tabela, COUNT(*) as total FROM public.waha_servers
UNION ALL
SELECT 
    'waha_sessions' as tabela, COUNT(*) as total FROM public.waha_sessions
UNION ALL
SELECT 
    'waha_campaigns' as tabela, COUNT(*) as total FROM public.waha_campaigns
UNION ALL
SELECT 
    'waha_campaign_contacts' as tabela, COUNT(*) as total FROM public.waha_campaign_contacts
UNION ALL
SELECT 
    'waha_dispatches' as tabela, COUNT(*) as total FROM public.waha_dispatches
UNION ALL
SELECT 
    'waha_session_stats' as tabela, COUNT(*) as total FROM public.waha_session_stats
UNION ALL
SELECT 
    'waha_config' as tabela, COUNT(*) as total FROM public.waha_config
UNION ALL
SELECT 
    'telegram_bots' as tabela, COUNT(*) as total FROM public.telegram_bots
UNION ALL
SELECT 
    'activation_codes' as tabela, COUNT(*) as total FROM public.activation_codes
UNION ALL
SELECT 
    'maturacao_schedules' as tabela, COUNT(*) as total FROM public.maturacao_schedules;

SELECT 
    '🎉 BANCO DE DADOS V3.0 PRONTO!' as status,
    'Servidor: https://supabase.innovarecode.com.br' as servidor,
    '16 tabelas criadas com sucesso!' as tabelas,
    'Todas as funcionalidades estão disponíveis!' as funcionalidades;

-- ============================================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- ============================================================================

