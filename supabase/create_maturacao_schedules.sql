-- ============================================================================
-- TABELA: maturacao_schedules
-- Armazena agendamentos de maturação de chips
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maturacao_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Configuração da maturação
    sessions JSONB NOT NULL, -- Array de sessões selecionadas
    cadence_seconds INTEGER DEFAULT 60,
    message_templates TEXT,
    number_of_rounds INTEGER DEFAULT 1,
    minutes_per_round INTEGER DEFAULT 10,
    pause_minutes_between_rounds INTEGER DEFAULT 5,
    
    -- Agendamento
    scheduled_start_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Data/hora de início agendada
    scheduled_end_at TIMESTAMP WITH TIME ZONE, -- Data/hora final calculada (opcional, pode ser calculada dinamicamente)
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'executando', 'concluido', 'cancelado', 'pausado', 'erro')),
    maturation_id VARCHAR(255), -- ID da maturação quando executada
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE, -- Quando foi executado
    error_message TEXT -- Mensagem de erro se houver falha
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_user_id ON public.maturacao_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_status ON public.maturacao_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_start_at ON public.maturacao_schedules(scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_created_at ON public.maturacao_schedules(created_at DESC);

-- Índice composto para busca eficiente de agendamentos pendentes
CREATE INDEX IF NOT EXISTS idx_maturacao_schedules_pending ON public.maturacao_schedules(status, scheduled_start_at) 
    WHERE status = 'agendado';

COMMENT ON TABLE public.maturacao_schedules IS 'Agendamentos de maturação de chips';
COMMENT ON COLUMN public.maturacao_schedules.sessions IS 'Array de sessões WAHA no formato ["serverId:sessionName", ...]';
COMMENT ON COLUMN public.maturacao_schedules.scheduled_end_at IS 'Data/hora final calculada baseada nas configurações de tempo';

-- Desabilitar RLS (ou configurar políticas conforme necessário)
ALTER TABLE public.maturacao_schedules DISABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_maturacao_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maturacao_schedules_updated_at
    BEFORE UPDATE ON public.maturacao_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_maturacao_schedules_updated_at();

