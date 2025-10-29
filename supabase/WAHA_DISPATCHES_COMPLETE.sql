-- ============================================================================
-- SCRIPT SQL COMPLETO - SISTEMA DE DISPAROS WAHA
-- Execute este script para criar TODAS as tabelas necessárias para disparos WAHA
-- Inclui: waha_servers + waha_campaigns + waha_dispatches + etc.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. FUNÇÃO PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 3. TABELA: waha_servers (DEPENDÊNCIA NECESSÁRIA)
-- ============================================================================

-- Tabela de servidores WAHA (múltiplos servidores por usuário)
CREATE TABLE IF NOT EXISTS public.waha_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    api_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500),
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    
    -- Configurações avançadas
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(500),
    timeout INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    prioridade INTEGER DEFAULT 1,
    max_sessions INTEGER DEFAULT 10,
    sessions_ativas INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar URLs duplicadas por usuário
    UNIQUE(user_id, api_url)
);

-- Índices para waha_servers
CREATE INDEX IF NOT EXISTS idx_waha_servers_user_id ON public.waha_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_servers_ativo ON public.waha_servers(ativo);
CREATE INDEX IF NOT EXISTS idx_waha_servers_prioridade ON public.waha_servers(prioridade);

-- Trigger para updated_at em waha_servers
CREATE TRIGGER update_waha_servers_updated_at 
    BEFORE UPDATE ON public.waha_servers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para waha_servers
ALTER TABLE public.waha_servers ENABLE ROW LEVEL SECURITY;

-- Policies para waha_servers
CREATE POLICY "Users can view own waha servers" 
    ON public.waha_servers FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waha servers" 
    ON public.waha_servers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waha servers" 
    ON public.waha_servers FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waha servers" 
    ON public.waha_servers FOR DELETE 
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.waha_servers IS 'Servidores WAHA configurados pelos usuários';

-- ============================================================================
-- 4. TABELAS DO SISTEMA DE DISPAROS WAHA
-- ============================================================================

-- Tabela de campanhas WAHA
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

-- Tabela de contatos para campanhas WAHA
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

-- Tabela de disparos WAHA (execuções)
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

-- Tabela de estatísticas de sessões WAHA
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
-- 5. ÍNDICES PARA PERFORMANCE
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
-- 6. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_waha_campaigns_updated_at 
    BEFORE UPDATE ON public.waha_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waha_session_stats_updated_at 
    BEFORE UPDATE ON public.waha_session_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.waha_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_session_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. POLICIES DE SEGURANÇA
-- ============================================================================

-- Policies para waha_campaigns
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
CREATE POLICY "Users can view own waha dispatches" 
    ON public.waha_dispatches FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waha dispatches" 
    ON public.waha_dispatches FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waha_dispatches" 
    ON public.waha_dispatches FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waha dispatches" 
    ON public.waha_dispatches FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies para waha_session_stats
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

-- ============================================================================
-- 9. COMENTÁRIOS DAS TABELAS
-- ============================================================================

COMMENT ON TABLE public.waha_servers IS 'Servidores WAHA configurados pelos usuários';
COMMENT ON TABLE public.waha_campaigns IS 'Campanhas de disparo WhatsApp usando WAHA';
COMMENT ON TABLE public.waha_campaign_contacts IS 'Contatos das campanhas WAHA';
COMMENT ON TABLE public.waha_dispatches IS 'Histórico de disparos WAHA executados';
COMMENT ON TABLE public.waha_session_stats IS 'Estatísticas de uso das sessões WAHA';

-- ============================================================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    'waha_servers' as tabela, COUNT(*) as total FROM public.waha_servers
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
    'waha_session_stats' as tabela, COUNT(*) as total FROM public.waha_session_stats;

-- Mensagem de sucesso
SELECT 
    '🎉 SISTEMA COMPLETO DE DISPAROS WAHA CRIADO COM SUCESSO!' as status,
    'Incluindo waha_servers + todas as tabelas de disparos' as detalhes;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
