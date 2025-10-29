-- Script para verificar e criar tabelas se necessário
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 2. Se as tabelas não existirem, criar
CREATE TABLE IF NOT EXISTS campanhas (
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

CREATE TABLE IF NOT EXISTS lotes_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  numero_lote INTEGER NOT NULL,
  clientes JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  processado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Desabilitar RLS
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 4. Conceder permissões
GRANT ALL ON campanhas TO anon;
GRANT ALL ON lotes_campanha TO anon;

-- 5. Verificar resultado
SELECT 'Tabelas criadas e permissões configuradas!' as resultado;
