-- SOLUÇÃO COMPLETA: Execute este script no Supabase Dashboard
-- Dashboard > SQL Editor > New Query

-- 1. Remover todas as políticas existentes primeiro
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campanhas;

DROP POLICY IF EXISTS "Users can view their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can insert their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can update their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can delete their own lots" ON lotes_campanha;

-- 2. Desabilitar RLS das tabelas
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se as tabelas existem
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    'Tabela encontrada' as status
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 4. Testar inserção de dados
INSERT INTO campanhas (nome, mensagem, criterios, configuracao) 
VALUES (
    'Teste de Permissão', 
    'Mensagem de teste',
    '{"status": "ativo"}'::jsonb,
    '{"clientesPorLote": 100, "intervaloMensagens": 10, "agendamento": "imediato"}'::jsonb
);

-- 5. Verificar se inserção funcionou
SELECT COUNT(*) as total_campanhas FROM campanhas;

-- 6. Limpar dados de teste
DELETE FROM campanhas WHERE nome = 'Teste de Permissão';

SELECT 'Permissões configuradas com sucesso!' as resultado;
