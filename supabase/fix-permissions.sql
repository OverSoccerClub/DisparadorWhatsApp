-- Script para remover permissões RLS das tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS nas tabelas
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

-- 3. Garantir que as tabelas existem com a estrutura correta
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_created_at ON campanhas(created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_campanha_id ON lotes_campanha(campanha_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes_campanha(status);

-- 5. Verificar se as tabelas estão acessíveis
SELECT 'Tabelas criadas com sucesso' as status;
