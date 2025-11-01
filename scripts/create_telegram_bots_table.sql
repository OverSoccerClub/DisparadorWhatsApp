-- Script para criar tabela de bots do Telegram no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela para bots do Telegram
CREATE TABLE IF NOT EXISTS telegram_bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    bot_token TEXT NOT NULL,
    bot_username VARCHAR(255),
    numero_remetente VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT unique_user_bot_name UNIQUE(user_id, nome)
);

-- Adicionar coluna numero_remetente se a tabela já existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'telegram_bots' AND column_name = 'numero_remetente'
    ) THEN
        ALTER TABLE telegram_bots ADD COLUMN numero_remetente VARCHAR(50);
    END IF;
END $$;

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_telegram_bots_user_id ON telegram_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_status ON telegram_bots(status);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_telegram_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_telegram_bots_updated_at ON telegram_bots;
CREATE TRIGGER update_telegram_bots_updated_at 
    BEFORE UPDATE ON telegram_bots 
    FOR EACH ROW EXECUTE FUNCTION update_telegram_bots_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;

-- Criar política RLS: usuários podem ver apenas seus próprios bots
CREATE POLICY "Users can view their own telegram bots"
    ON telegram_bots FOR SELECT
    USING (auth.uid() = user_id);

-- Criar política RLS: usuários podem inserir seus próprios bots
CREATE POLICY "Users can insert their own telegram bots"
    ON telegram_bots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Criar política RLS: usuários podem atualizar seus próprios bots
CREATE POLICY "Users can update their own telegram bots"
    ON telegram_bots FOR UPDATE
    USING (auth.uid() = user_id);

-- Criar política RLS: usuários podem deletar seus próprios bots
CREATE POLICY "Users can delete their own telegram bots"
    ON telegram_bots FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE telegram_bots IS 'Bots do Telegram configurados por usuário';

