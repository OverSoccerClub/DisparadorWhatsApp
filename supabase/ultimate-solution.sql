-- SOLUÇÃO ULTIMATE - CONFIGURAR PERMISSÕES COMPLETAS
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar usuário atual e permissões
SELECT current_user, session_user;

-- 2. Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 3. Verificar permissões do anon
SELECT 
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('campanhas', 'lotes_campanha')
AND grantee = 'anon';

-- 4. Conceder permissões no schema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 5. Conceder permissões específicas nas tabelas
GRANT ALL PRIVILEGES ON public.campanhas TO anon;
GRANT ALL PRIVILEGES ON public.lotes_campanha TO anon;

-- 6. Desabilitar RLS
ALTER TABLE public.campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 7. Verificar permissões após concessão
SELECT 
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('campanhas', 'lotes_campanha')
AND grantee = 'anon';

-- 8. Teste de inserção
INSERT INTO public.campanhas (nome, mensagem, criterios, configuracao) 
VALUES (
    'Teste Final', 
    'Mensagem de teste',
    '{"status": "ativo"}'::jsonb,
    '{"clientesPorLote": 100, "intervaloMensagens": 10, "agendamento": "imediato"}'::jsonb
);

-- 9. Verificar inserção
SELECT COUNT(*) as total_campanhas FROM public.campanhas;

-- 10. Limpar teste
DELETE FROM public.campanhas WHERE nome = 'Teste Final';

SELECT 'Permissões configuradas com sucesso!' as resultado;