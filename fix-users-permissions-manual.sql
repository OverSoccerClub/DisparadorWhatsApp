-- ========================================
-- SCRIPT PARA CORRIGIR PERMISSÕES DA TABELA USERS
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Este script irá corrigir os problemas de permissão da tabela users

-- 1. DESABILITAR RLS NA TABELA USERS
-- Isso permite acesso total à tabela (apenas para desenvolvimento)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Public users access" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

-- 3. GARANTIR QUE A TABELA USERS EXISTE COM ESTRUTURA CORRETA
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 5. CRIAR FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CRIAR TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. INSERIR USUÁRIO ADMINISTRADOR PADRÃO (senha: admin123)
-- Hash da senha 'admin123' usando bcrypt
INSERT INTO users (email, password_hash, name, is_admin, is_active) 
VALUES (
    'admin@dispatcher.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Administrador', 
    true, 
    true
) ON CONFLICT (email) DO NOTHING;

-- 8. VERIFICAR SE A TABELA ESTÁ ACESSÍVEL
SELECT 'Tabela users configurada com sucesso' as status;

-- 9. TESTAR ACESSO À TABELA
SELECT COUNT(*) as total_users FROM users;

-- 10. MOSTRAR USUÁRIOS EXISTENTES
SELECT id, email, name, is_admin, is_active, created_at FROM users ORDER BY created_at;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Copie todo este script
-- 2. Vá para o Supabase Dashboard
-- 3. Acesse SQL Editor
-- 4. Cole o script e execute
-- 5. Verifique se não há erros
-- 6. Teste o login com admin@dispatcher.com / admin123
