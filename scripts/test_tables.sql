-- Script para testar se as tabelas existem e têm dados
-- Execute este script no SQL Editor do Supabase

-- Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('evolution_configs', 'evolution_instances')
ORDER BY table_name;

-- Verificar estrutura das tabelas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'evolution_configs'
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'evolution_instances'
ORDER BY ordinal_position;

-- Verificar se há dados nas tabelas
SELECT COUNT(*) as total_configs FROM evolution_configs;
SELECT COUNT(*) as total_instances FROM evolution_instances;

-- Verificar dados específicos
SELECT * FROM evolution_configs LIMIT 5;
SELECT * FROM evolution_instances LIMIT 5;

-- Verificar permissões
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('evolution_configs', 'evolution_instances')
ORDER BY table_name, grantee;
