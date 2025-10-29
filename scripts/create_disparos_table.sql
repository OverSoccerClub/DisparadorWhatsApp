-- Script para criar tabela de disparos
-- Execute este script no SQL Editor do Supabase

-- Remover tabela existente se existir (cuidado em produção!)
DROP TABLE IF EXISTS disparos CASCADE;

-- Criar tabela para disparos de mensagens
CREATE TABLE disparos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'falhou', 'cancelado')),
    instance_name VARCHAR(255), -- Nome da instância WhatsApp usada
    agendamento TIMESTAMP WITH TIME ZONE, -- Data/hora agendada para envio
    enviado_em TIMESTAMP WITH TIME ZONE, -- Data/hora que foi enviado
    entregue_em TIMESTAMP WITH TIME ZONE, -- Data/hora que foi entregue
    resposta TEXT, -- Resposta do destinatário (se houver)
    erro TEXT, -- Mensagem de erro se falhou
    tentativas INTEGER DEFAULT 0, -- Número de tentativas de envio
    max_tentativas INTEGER DEFAULT 3, -- Máximo de tentativas
    campanha_id UUID, -- ID da campanha (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_disparos_user_id ON disparos(user_id);
CREATE INDEX idx_disparos_status ON disparos(status);
CREATE INDEX idx_disparos_telefone ON disparos(telefone);
CREATE INDEX idx_disparos_instance_name ON disparos(instance_name);
CREATE INDEX idx_disparos_agendamento ON disparos(agendamento);
CREATE INDEX idx_disparos_campanha_id ON disparos(campanha_id);
CREATE INDEX idx_disparos_created_at ON disparos(created_at);

-- Criar índice composto para consultas frequentes
CREATE INDEX idx_disparos_user_status ON disparos(user_id, status);
CREATE INDEX idx_disparos_user_created ON disparos(user_id, created_at DESC);

-- Conceder permissões
GRANT ALL PRIVILEGES ON disparos TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_disparos_updated_at 
    BEFORE UPDATE ON disparos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo (opcional - remover em produção)
INSERT INTO disparos (user_id, telefone, mensagem, status, instance_name) VALUES
('92648299-39f8-48d6-957b-65b72091339d', '5584991053082', 'Mensagem de teste', 'pendente', 'inst_391c3d34'),
('92648299-39f8-48d6-957b-65b72091339d', '5584999727583', 'Mensagem de teste 2', 'pendente', 'inst_391c3d34');

-- Mensagem de sucesso
SELECT 'Tabela disparos criada com sucesso! Estrutura completa com índices e triggers.' as status;
