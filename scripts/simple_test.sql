-- Script MUITO SIMPLES para testar
-- Execute este script no SQL Editor do Supabase

-- Verificar se as tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('evolution_configs', 'evolution_instances');

-- Se as tabelas não existirem, criar uma tabela simples
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir um registro de teste
INSERT INTO test_table (name) VALUES ('teste') ON CONFLICT DO NOTHING;

-- Verificar se funcionou
SELECT * FROM test_table;

-- Mensagem de sucesso
SELECT 'Teste concluído com sucesso!' as status;
