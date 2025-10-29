-- Script para inserir dados de teste
-- Execute este script no SQL Editor do Supabase

-- Inserir configuração de teste
INSERT INTO evolution_configs (user_id, api_url, global_api_key, webhook_url)
VALUES (
    'user_001',
    'https://evolution.analome.com.br',
    '429683C4C977415CAAFCCE10F7D57E11',
    'https://webhook.site/test'
) ON CONFLICT (user_id) DO UPDATE SET
    api_url = EXCLUDED.api_url,
    global_api_key = EXCLUDED.global_api_key,
    webhook_url = EXCLUDED.webhook_url,
    updated_at = NOW();

-- Inserir instâncias de teste
INSERT INTO evolution_instances (user_id, instance_name, connection_status, phone_number, last_seen)
VALUES 
    ('user_001', 'user_user_001_instance_123456_abc123', 'disconnected', NULL, NULL),
    ('user_001', 'user_user_001_instance_789012_def456', 'disconnected', NULL, NULL),
    ('user_001', 'user_user_001_instance_345678_ghi789', 'disconnected', NULL, NULL)
ON CONFLICT (instance_name) DO UPDATE SET
    connection_status = EXCLUDED.connection_status,
    phone_number = EXCLUDED.phone_number,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();

-- Verificar se os dados foram inseridos
SELECT 'Configurações inseridas:' as status;
SELECT * FROM evolution_configs WHERE user_id = 'user_001';

SELECT 'Instâncias inseridas:' as status;
SELECT * FROM evolution_instances WHERE user_id = 'user_001';
