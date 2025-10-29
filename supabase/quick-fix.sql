-- SOLUÇÃO RÁPIDA: Execute este script no Supabase Dashboard
-- Dashboard > SQL Editor > New Query

-- Desabilitar RLS das tabelas
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT 'RLS desabilitado com sucesso!' as resultado;
