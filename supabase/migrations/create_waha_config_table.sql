-- Criar tabela para configurações do WAHA
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT waha_config_id_check CHECK (id = 1)
);

-- Adicionar comentário na tabela
COMMENT ON TABLE public.waha_config IS 'Configurações globais do WAHA (WhatsApp HTTP API)';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_waha_config_id ON public.waha_config(id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.waha_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados" ON public.waha_config
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados" ON public.waha_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Inserir configuração padrão (opcional - use variáveis de ambiente)
-- INSERT INTO public.waha_config (id, api_url, api_key)
-- VALUES (1, 'http://localhost:3001', '')
-- ON CONFLICT (id) DO NOTHING;
