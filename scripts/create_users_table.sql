-- Script para criar tabela de usuários
-- Execute este script no Supabase SQL Editor

-- Criar tabela de usuários
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário administrador padrão (senha: admin123)
-- Hash da senha 'admin123' usando bcrypt
INSERT INTO users (email, password_hash, name, is_admin, is_active) 
VALUES (
    'admin@dispatcher.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Administrador', 
    true, 
    true
) ON CONFLICT (email) DO NOTHING;

-- Comentários sobre a estrutura:
-- - id: UUID único para cada usuário
-- - email: Email único para login
-- - password_hash: Hash da senha usando bcrypt
-- - name: Nome completo do usuário
-- - avatar_url: URL da foto de perfil (opcional)
-- - is_active: Se o usuário está ativo
-- - is_admin: Se o usuário é administrador
-- - last_login: Último login do usuário
-- - created_at/updated_at: Timestamps automáticos
