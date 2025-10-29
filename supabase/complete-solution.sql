-- SOLUÇÃO COMPLETA PARA PERMISSÕES
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar todas as tabelas no banco
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename LIKE '%campanha%' OR tablename LIKE '%lote%';

-- 2. Verificar se as tabelas existem no schema public
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('campanhas', 'lotes_campanha');

-- 3. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  criterios JSONB NOT NULL,
  configuracao JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'rascunho',
  progresso JSONB DEFAULT '{}',
  relatorio JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lotes_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
  numero_lote INTEGER NOT NULL,
  clientes JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  processado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Desabilitar RLS
ALTER TABLE public.campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 5. Remover todas as políticas
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campanhas;

DROP POLICY IF EXISTS "Users can view their own lots" ON public.lotes_campanha;
DROP POLICY IF EXISTS "Users can insert their own lots" ON public.lotes_campanha;
DROP POLICY IF EXISTS "Users can update their own lots" ON public.lotes_campanha;
DROP POLICY IF EXISTS "Users can delete their own lots" ON public.lotes_campanha;

-- 6. Conceder permissões ao anon
GRANT ALL ON public.campanhas TO anon;
GRANT ALL ON public.lotes_campanha TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 7. Verificar permissões
SELECT 
    table_name,
    privilege_type,
    grantee
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

SELECT 'Solução completa aplicada!' as resultado;
