-- Execute este script no Supabase Dashboard
-- Vá em: Dashboard > SQL Editor > New Query
-- Cole este código e execute

-- 1. Desabilitar RLS (Row Level Security) das tabelas
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campanhas;

DROP POLICY IF EXISTS "Users can view their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can insert their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can update their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can delete their own lots" ON lotes_campanha;

-- 3. Verificar se as tabelas existem e estão acessíveis
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 4. Testar acesso às tabelas
SELECT 'Teste de acesso às tabelas' as status;
SELECT COUNT(*) as total_campanhas FROM campanhas;
SELECT COUNT(*) as total_lotes FROM lotes_campanha;
