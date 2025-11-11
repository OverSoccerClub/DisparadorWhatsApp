-- Tabela para códigos de ativação de contas
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activation_codes_user_id ON public.activation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_email ON public.activation_codes(email);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_used ON public.activation_codes(used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON public.activation_codes(expires_at);

-- Adicionar campo phone na tabela auth.users (via metadata)
-- O telefone será armazenado em user_metadata do Supabase Auth

COMMENT ON TABLE public.activation_codes IS 'Códigos de ativação de contas de usuários';

