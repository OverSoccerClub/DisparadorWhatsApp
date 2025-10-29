-- Script para corrigir permissões das tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Conceder permissões para a tabela evolution_configs
GRANT ALL ON evolution_configs TO authenticated;
GRANT ALL ON evolution_configs TO anon;
GRANT ALL ON evolution_configs TO service_role;

-- Conceder permissões para a tabela evolution_instances
GRANT ALL ON evolution_instances TO authenticated;
GRANT ALL ON evolution_instances TO anon;
GRANT ALL ON evolution_instances TO service_role;

-- Conceder permissões para as sequências (se existirem)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;

-- Verificar se as tabelas existem e suas permissões
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('evolution_configs', 'evolution_instances');

-- Verificar permissões específicas
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('evolution_configs', 'evolution_instances')
ORDER BY table_name, grantee;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Permissões das tabelas corrigidas com sucesso!';
END $$;
