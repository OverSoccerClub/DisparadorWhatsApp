-- Script para configurar permissões do usuário anônimo
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 2. Desabilitar RLS completamente
ALTER TABLE IF EXISTS campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campanhas;

DROP POLICY IF EXISTS "Users can view their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can insert their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can update their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can delete their own lots" ON lotes_campanha;

-- 4. Conceder permissões explícitas ao usuário anônimo
GRANT ALL ON campanhas TO anon;
GRANT ALL ON lotes_campanha TO anon;
GRANT ALL ON SEQUENCE campanhas_id_seq TO anon;
GRANT ALL ON SEQUENCE lotes_campanha_id_seq TO anon;

-- 5. Verificar permissões
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('campanhas', 'lotes_campanha')
AND grantee = 'anon';

-- 6. Teste final
SELECT 'Permissões configuradas!' as status;
