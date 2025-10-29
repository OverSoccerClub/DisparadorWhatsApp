-- Script para criar a tabela waha_config no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela waha_config
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

-- 2. Adicionar comentário
COMMENT ON TABLE public.waha_config IS 'Configurações globais do WAHA (WhatsApp HTTP API)';

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_waha_config_id ON public.waha_config(id);

-- 4. Habilitar RLS
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;

-- 6. Criar políticas de acesso mais permissivas
-- Permitir SELECT para service_role (usado pela API)
CREATE POLICY "Enable read access for service role" ON public.waha_config
    FOR SELECT
    USING (true);

-- Permitir INSERT para service_role
CREATE POLICY "Enable insert for service role" ON public.waha_config
    FOR INSERT
    WITH CHECK (true);

-- Permitir UPDATE para service_role
CREATE POLICY "Enable update for service role" ON public.waha_config
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE para service_role (caso necessário)
CREATE POLICY "Enable delete for service role" ON public.waha_config
    FOR DELETE
    USING (true);

-- 7. Inserir configuração padrão
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'http://localhost:3001', '')
ON CONFLICT (id) DO NOTHING;

-- 8. Verificar se foi criado
SELECT * FROM public.waha_config;
