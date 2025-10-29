-- Script para criar tabela de configurações da Evolution API no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela para configurações da Evolution API
CREATE TABLE IF NOT EXISTS evolution_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    api_url TEXT NOT NULL,
    global_api_key TEXT NOT NULL,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Índices para performance
    CONSTRAINT unique_user_config UNIQUE(user_id)
);

-- Criar tabela para instâncias criadas
CREATE TABLE IF NOT EXISTS evolution_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    connection_status VARCHAR(50) DEFAULT 'disconnected',
    phone_number VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Índices para performance
    CONSTRAINT unique_instance_name UNIQUE(instance_name)
);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at (com verificação de existência)
DROP TRIGGER IF EXISTS update_evolution_configs_updated_at ON evolution_configs;
CREATE TRIGGER update_evolution_configs_updated_at 
    BEFORE UPDATE ON evolution_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evolution_instances_updated_at ON evolution_instances;
CREATE TRIGGER update_evolution_instances_updated_at 
    BEFORE UPDATE ON evolution_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS desabilitado - tabelas sem restrições de segurança
-- ALTER TABLE evolution_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_evolution_configs_user_id ON evolution_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_user_id ON evolution_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_status ON evolution_instances(connection_status);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_active ON evolution_instances(is_active);

-- Comentários para documentação
COMMENT ON TABLE evolution_configs IS 'Configurações da Evolution API por usuário';
COMMENT ON TABLE evolution_instances IS 'Instâncias da Evolution API criadas por usuário';

COMMENT ON COLUMN evolution_configs.user_id IS 'ID do usuário (sem restrições de acesso)';
COMMENT ON COLUMN evolution_configs.api_url IS 'URL da Evolution API';
COMMENT ON COLUMN evolution_configs.global_api_key IS 'Chave global da Evolution API';
COMMENT ON COLUMN evolution_configs.webhook_url IS 'URL do webhook (opcional)';

COMMENT ON COLUMN evolution_instances.user_id IS 'ID do usuário proprietário da instância (sem restrições)';
COMMENT ON COLUMN evolution_instances.instance_name IS 'Nome único da instância';
COMMENT ON COLUMN evolution_instances.connection_status IS 'Status da conexão (open, close, connecting)';
COMMENT ON COLUMN evolution_instances.phone_number IS 'Número de telefone conectado';
COMMENT ON COLUMN evolution_instances.last_seen IS 'Última vez que a instância foi vista';
