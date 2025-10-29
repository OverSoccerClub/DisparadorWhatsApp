-- Script para debugar e corrigir problemas de permissões
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    'Tabela encontrada' as status
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 2. Verificar permissões atuais
SELECT 
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('campanhas', 'lotes_campanha');

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 4. Desabilitar RLS se estiver habilitado
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 5. Conceder todas as permissões ao anon
GRANT ALL PRIVILEGES ON campanhas TO anon;
GRANT ALL PRIVILEGES ON lotes_campanha TO anon;

-- 6. Conceder permissões no schema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 7. Verificar permissões após concessão
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('campanhas', 'lotes_campanha')
AND grantee = 'anon';

-- 8. Teste de inserção
INSERT INTO campanhas (nome, mensagem, criterios, configuracao) 
VALUES (
    'Teste Final', 
    'Mensagem de teste',
    '{"status": "ativo"}'::jsonb,
    '{"clientesPorLote": 100, "intervaloMensagens": 10, "agendamento": "imediato"}'::jsonb
);

-- 9. Verificar se inserção funcionou
SELECT COUNT(*) as total_campanhas FROM campanhas;

-- 10. Limpar teste
DELETE FROM campanhas WHERE nome = 'Teste Final';

SELECT 'Debug concluído - verifique os resultados acima' as resultado;
