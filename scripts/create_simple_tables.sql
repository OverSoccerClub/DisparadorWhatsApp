-- Script SIMPLES para criar tabelas sem restrições
-- Execute este script no SQL Editor do Supabase

-- Remover tabelas existentes (se existirem)
DROP TABLE IF EXISTS evolution_instances CASCADE;
DROP TABLE IF EXISTS evolution_configs CASCADE;

-- Criar tabela para configurações da Evolution API
CREATE TABLE evolution_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    api_url TEXT NOT NULL,
    global_api_key TEXT NOT NULL,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Criar tabela para instâncias criadas
CREATE TABLE evolution_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    instance_name VARCHAR(255) NOT NULL UNIQUE,
    connection_status VARCHAR(50) DEFAULT 'disconnected',
    phone_number VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Conceder TODAS as permissões para TODOS os usuários
GRANT ALL PRIVILEGES ON evolution_configs TO PUBLIC;
GRANT ALL PRIVILEGES ON evolution_instances TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Criar índices básicos
CREATE INDEX idx_evolution_configs_user_id ON evolution_configs(user_id);
CREATE INDEX idx_evolution_instances_user_id ON evolution_instances(user_id);
CREATE INDEX idx_evolution_instances_name ON evolution_instances(instance_name);

-- Mensagem de sucesso
SELECT 'Tabelas criadas com sucesso! Sem restrições de acesso.' as status;
