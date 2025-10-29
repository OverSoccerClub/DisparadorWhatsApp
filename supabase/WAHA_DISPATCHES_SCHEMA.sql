-- Schema para Sistema de Disparos WAHA
-- Baseado no sistema Evolution API existente

-- Tabela de campanhas WAHA
CREATE TABLE IF NOT EXISTS waha_campaigns (
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
CREATE TABLE IF NOT EXISTS waha_campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES waha_campaigns(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    nome VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disparos WAHA (execuções)
CREATE TABLE IF NOT EXISTS waha_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES waha_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sessão WAHA utilizada
    waha_server_id UUID NOT NULL REFERENCES waha_servers(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS waha_session_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waha_server_id UUID NOT NULL REFERENCES waha_servers(id) ON DELETE CASCADE,
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_waha_campaigns_user_id ON waha_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_campaigns_status ON waha_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_waha_campaign_contacts_campaign_id ON waha_campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_waha_campaign_contacts_status ON waha_campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_campaign_id ON waha_dispatches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_user_id ON waha_dispatches(user_id);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_status ON waha_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_waha_dispatches_scheduled_at ON waha_dispatches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_waha_session_stats_user_id ON waha_session_stats(user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waha_campaigns_updated_at BEFORE UPDATE ON waha_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waha_session_stats_updated_at BEFORE UPDATE ON waha_session_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE waha_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE waha_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waha_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE waha_session_stats ENABLE ROW LEVEL SECURITY;

-- Policies para waha_campaigns
CREATE POLICY "Users can view own waha campaigns" ON waha_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waha campaigns" ON waha_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waha campaigns" ON waha_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waha campaigns" ON waha_campaigns FOR DELETE USING (auth.uid() = user_id);

-- Policies para waha_campaign_contacts
CREATE POLICY "Users can view own waha campaign contacts" ON waha_campaign_contacts FOR SELECT USING (
    EXISTS (SELECT 1 FROM waha_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own waha campaign contacts" ON waha_campaign_contacts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM waha_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own waha campaign contacts" ON waha_campaign_contacts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM waha_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own waha campaign contacts" ON waha_campaign_contacts FOR DELETE USING (
    EXISTS (SELECT 1 FROM waha_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);

-- Policies para waha_dispatches
CREATE POLICY "Users can view own waha dispatches" ON waha_dispatches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waha dispatches" ON waha_dispatches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waha dispatches" ON waha_dispatches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waha dispatches" ON waha_dispatches FOR DELETE USING (auth.uid() = user_id);

-- Policies para waha_session_stats
CREATE POLICY "Users can view own waha session stats" ON waha_session_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waha session stats" ON waha_session_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waha session stats" ON waha_session_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waha session stats" ON waha_session_stats FOR DELETE USING (auth.uid() = user_id);
