-- ============================================================================
-- TABELA: waha_campaigns e Tabelas Relacionadas
-- Criação das tabelas do sistema de disparos WAHA
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. FUNÇÃO PARA UPDATED_AT (se não existir)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. VERIFICAR SE waha_servers EXISTE (DEPENDÊNCIA)
-- ============================================================================

-- Nota: waha_servers deve existir antes de criar waha_campaigns
-- Se não existir, execute primeiro o script WAHA_DISPATCHES_COMPLETE.sql
-- ou crie a tabela waha_servers separadamente

-- ============================================================================
-- 4. TABELA: waha_campaigns
-- Armazena campanhas de disparo WhatsApp usando WAHA
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
-- 5. TABELA: waha_campaign_contacts
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
-- 6. TABELA: waha_dispatches
-- Histórico de disparos WAHA executados
-- ============================================================================

-- Nota: Requer waha_servers
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
-- 7. TABELA: waha_session_stats
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
-- 8. ÍNDICES PARA PERFORMANCE
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
-- 9. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Trigger para waha_campaigns
DROP TRIGGER IF EXISTS update_waha_campaigns_updated_at ON public.waha_campaigns;
CREATE TRIGGER update_waha_campaigns_updated_at 
    BEFORE UPDATE ON public.waha_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para waha_session_stats
DROP TRIGGER IF EXISTS update_waha_session_stats_updated_at ON public.waha_session_stats;
CREATE TRIGGER update_waha_session_stats_updated_at 
    BEFORE UPDATE ON public.waha_session_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.waha_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_session_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. POLICIES DE SEGURANÇA
-- ============================================================================

-- Remover policies existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can insert own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can update own waha campaigns" ON public.waha_campaigns;
DROP POLICY IF EXISTS "Users can delete own waha campaigns" ON public.waha_campaigns;

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

-- Remover policies existentes para waha_campaign_contacts
DROP POLICY IF EXISTS "Users can view own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can insert own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can update own waha campaign contacts" ON public.waha_campaign_contacts;
DROP POLICY IF EXISTS "Users can delete own waha campaign contacts" ON public.waha_campaign_contacts;

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

-- Remover policies existentes para waha_dispatches
DROP POLICY IF EXISTS "Users can view own waha dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can insert own waha dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can update own waha_dispatches" ON public.waha_dispatches;
DROP POLICY IF EXISTS "Users can delete own waha dispatches" ON public.waha_dispatches;

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

-- Remover policies existentes para waha_session_stats
DROP POLICY IF EXISTS "Users can view own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can insert own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can update own waha session stats" ON public.waha_session_stats;
DROP POLICY IF EXISTS "Users can delete own waha session stats" ON public.waha_session_stats;

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
-- 12. COMENTÁRIOS DAS TABELAS
-- ============================================================================

COMMENT ON TABLE public.waha_campaigns IS 'Campanhas de disparo WhatsApp usando WAHA';
COMMENT ON TABLE public.waha_campaign_contacts IS 'Contatos das campanhas WAHA';
COMMENT ON TABLE public.waha_dispatches IS 'Histórico de disparos WAHA executados';
COMMENT ON TABLE public.waha_session_stats IS 'Estatísticas de uso das sessões WAHA';

-- ============================================================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    'waha_campaigns' as tabela, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waha_campaigns') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'waha_campaign_contacts' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waha_campaign_contacts') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'waha_dispatches' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waha_dispatches') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'waha_session_stats' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waha_session_stats') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
