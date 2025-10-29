-- ============================================================================
-- TABELA: disparos_sms
-- Tabela legada para armazenar dados de disparos SMS/WhatsApp
-- Compatível com o código existente que usa DisparosSMSService
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disparos_sms (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagens TEXT,
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente', 'enviado', 'entregue', 'erro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_disparos_sms_telefone ON public.disparos_sms(telefone);
CREATE INDEX IF NOT EXISTS idx_disparos_sms_status ON public.disparos_sms(status);
CREATE INDEX IF NOT EXISTS idx_disparos_sms_created_at ON public.disparos_sms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disparos_sms_nome ON public.disparos_sms(nome);

-- Índice de busca de texto para nome (se pg_trgm estiver habilitado)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS idx_disparos_sms_nome_trgm ON public.disparos_sms USING gin(nome gin_trgm_ops);
    END IF;
END $$;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_disparos_sms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_disparos_sms_updated_at
    BEFORE UPDATE ON public.disparos_sms
    FOR EACH ROW
    EXECUTE FUNCTION update_disparos_sms_updated_at();

-- Comentário na tabela
COMMENT ON TABLE public.disparos_sms IS 'Tabela legada para armazenar dados de disparos SMS/WhatsApp';
COMMENT ON COLUMN public.disparos_sms.id IS 'ID único do registro (auto-incremento)';
COMMENT ON COLUMN public.disparos_sms.nome IS 'Nome do contato/cliente';
COMMENT ON COLUMN public.disparos_sms.telefone IS 'Número de telefone do contato';
COMMENT ON COLUMN public.disparos_sms.mensagens IS 'Mensagens enviadas (texto livre)';
COMMENT ON COLUMN public.disparos_sms.status IS 'Status do registro (ativo, inativo, pendente, enviado, entregue, erro)';
COMMENT ON COLUMN public.disparos_sms.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.disparos_sms.updated_at IS 'Data de última atualização do registro';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS na tabela
ALTER TABLE public.disparos_sms ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para todos (usado por supabaseSimple sem autenticação)
CREATE POLICY disparos_sms_select_policy ON public.disparos_sms
    FOR SELECT
    USING (true);

-- Política: Permitir inserção para todos
CREATE POLICY disparos_sms_insert_policy ON public.disparos_sms
    FOR INSERT
    WITH CHECK (true);

-- Política: Permitir atualização para todos
CREATE POLICY disparos_sms_update_policy ON public.disparos_sms
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política: Permitir exclusão para todos
CREATE POLICY disparos_sms_delete_policy ON public.disparos_sms
    FOR DELETE
    USING (true);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
