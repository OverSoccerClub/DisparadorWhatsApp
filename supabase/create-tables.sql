-- Script completo para criar tabelas e configurar permissões
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Criar tabela campanhas se não existir
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

-- 2. Criar tabela lotes_campanha se não existir
CREATE TABLE IF NOT EXISTS lotes_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  numero_lote INTEGER NOT NULL,
  clientes JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  processado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_created_at ON campanhas(created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_campanha_id ON lotes_campanha(campanha_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes_campanha(status);

-- 4. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campanhas;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campanhas;

DROP POLICY IF EXISTS "Users can view their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can insert their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can update their own lots" ON lotes_campanha;
DROP POLICY IF EXISTS "Users can delete their own lots" ON lotes_campanha;

-- 5. Desabilitar RLS
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_campanha DISABLE ROW LEVEL SECURITY;

-- 6. Verificar tabelas
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    'Tabela configurada' as status
FROM pg_tables 
WHERE tablename IN ('campanhas', 'lotes_campanha');

-- 7. Teste de inserção
INSERT INTO campanhas (nome, mensagem, criterios, configuracao) 
VALUES (
    'Teste de Permissão', 
    'Mensagem de teste',
    '{"status": "ativo"}'::jsonb,
    '{"clientesPorLote": 100, "intervaloMensagens": 10, "agendamento": "imediato"}'::jsonb
);

-- 8. Verificar inserção
SELECT COUNT(*) as total_campanhas FROM campanhas;

-- 9. Limpar teste
DELETE FROM campanhas WHERE nome = 'Teste de Permissão';

SELECT 'Tabelas criadas e permissões configuradas com sucesso!' as resultado;
