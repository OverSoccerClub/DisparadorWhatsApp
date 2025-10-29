-- ============================================================================
-- DISPARADOR WHATSAPP - SCHEMA COMPLETO DO BANCO DE DADOS
-- Execute este SQL em um servidor Supabase limpo
-- Versão: 2.0 - Completa e Otimizada
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES E CONFIGURAÇÕES
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto

-- ============================================================================
-- 2. TABELA: clientes
-- Armazena os contatos/clientes do sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at DESC);

-- Índice de busca de texto
CREATE INDEX IF NOT EXISTS idx_clientes_nome_trgm ON public.clientes USING gin(nome gin_trgm_ops);

COMMENT ON TABLE public.clientes IS 'Contatos/clientes do sistema';

-- ============================================================================
-- 3. TABELA: campanhas
-- Armazena as campanhas de envio de mensagens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    destinatarios JSONB DEFAULT '[]'::jsonb,
    criterios JSONB,
    configuracao JSONB,
    agendamento TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'pausada', 'cancelada')),
    progresso JSONB DEFAULT '{}'::jsonb,
    relatorio JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campanhas_user_id ON public.campanhas(user_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON public.campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_created_at ON public.campanhas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campanhas_agendamento ON public.campanhas(agendamento) WHERE agendamento IS NOT NULL;

COMMENT ON TABLE public.campanhas IS 'Campanhas de envio de mensagens WhatsApp';

-- ============================================================================
-- 4. TABELA: disparos
-- Armazena os envios individuais de mensagens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviando', 'enviado', 'entregue', 'lido', 'erro', 'falhou')),
    resposta TEXT,
    erro TEXT,
    instance_name VARCHAR(255),
    agendamento TIMESTAMP WITH TIME ZONE,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_disparos_campanha_id ON public.disparos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_disparos_user_id ON public.disparos(user_id);
CREATE INDEX IF NOT EXISTS idx_disparos_status ON public.disparos(status);
CREATE INDEX IF NOT EXISTS idx_disparos_telefone ON public.disparos(telefone);
CREATE INDEX IF NOT EXISTS idx_disparos_created_at ON public.disparos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disparos_enviado_em ON public.disparos(enviado_em DESC) WHERE enviado_em IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disparos_instance_name ON public.disparos(instance_name) WHERE instance_name IS NOT NULL;

COMMENT ON TABLE public.disparos IS 'Envios individuais de mensagens WhatsApp';

-- ============================================================================
-- 5. TABELA: lotes_campanha
-- Armazena os lotes de processamento das campanhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lotes_campanha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
    numero_lote INTEGER NOT NULL,
    clientes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    processado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lotes_campanha_id ON public.lotes_campanha(campanha_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes_campanha(status);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes_campanha(created_at DESC);

-- Constraint para evitar lotes duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_lotes_campanha_numero ON public.lotes_campanha(campanha_id, numero_lote);

COMMENT ON TABLE public.lotes_campanha IS 'Lotes de processamento de campanhas';

-- ============================================================================
-- 6. TABELA: evolution_configs
-- Armazena as configurações da Evolution API por usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evolution_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    api_url TEXT NOT NULL,
    global_api_key TEXT NOT NULL,
    webhook_url TEXT,
    webhook_events JSONB DEFAULT '[]'::jsonb,
    auto_create BOOLEAN DEFAULT false,
    qrcode_timeout INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evolution_configs_user_id ON public.evolution_configs(user_id);

COMMENT ON TABLE public.evolution_configs IS 'Configurações da Evolution API por usuário';

-- ============================================================================
-- 7. TABELA: evolution_instances
-- Armazena as instâncias WhatsApp criadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    phone_number VARCHAR(20),
    profile_name VARCHAR(255),
    profile_picture_url TEXT,
    qr_code TEXT,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evolution_instances_user_id ON public.evolution_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_instance_name ON public.evolution_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_status ON public.evolution_instances(status);

-- Constraint para evitar instâncias duplicadas por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_evolution_instances_user_instance ON public.evolution_instances(user_id, instance_name);

COMMENT ON TABLE public.evolution_instances IS 'Instâncias WhatsApp da Evolution API';

-- ============================================================================
-- 8. TABELA: waha_config
-- Armazena configuração global do WAHA (WhatsApp HTTP API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waha_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    api_url TEXT NOT NULL,
    api_key TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    enable_auto_reconnect BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_presence BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_waha_config_id ON public.waha_config(id);

COMMENT ON TABLE public.waha_config IS 'Configuração global do WAHA (WhatsApp HTTP API)';

-- ============================================================================
-- 9. DESABILITAR RLS (Row Level Security)
-- Para simplicidade, desabilitamos RLS. Em produção, configure políticas adequadas.
-- ============================================================================

ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disparos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_campanha DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha_config DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. PERMISSÕES
-- Conceder permissões necessárias
-- ============================================================================

-- Permissões para authenticated users
GRANT ALL ON public.clientes TO authenticated;
GRANT ALL ON public.campanhas TO authenticated;
GRANT ALL ON public.disparos TO authenticated;
GRANT ALL ON public.lotes_campanha TO authenticated;
GRANT ALL ON public.evolution_configs TO authenticated;
GRANT ALL ON public.evolution_instances TO authenticated;
GRANT ALL ON public.waha_config TO authenticated;

-- Permissões para service_role (usado pelas APIs)
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.campanhas TO service_role;
GRANT ALL ON public.disparos TO service_role;
GRANT ALL ON public.lotes_campanha TO service_role;
GRANT ALL ON public.evolution_configs TO service_role;
GRANT ALL ON public.evolution_instances TO service_role;
GRANT ALL ON public.waha_config TO service_role;

-- Permissões para anon (usuários não autenticados - apenas leitura pública se necessário)
GRANT SELECT ON public.waha_config TO anon;

-- ============================================================================
-- 11. FUNÇÕES ÚTEIS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_campanhas_updated_at ON public.campanhas;
CREATE TRIGGER update_campanhas_updated_at
    BEFORE UPDATE ON public.campanhas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_disparos_updated_at ON public.disparos;
CREATE TRIGGER update_disparos_updated_at
    BEFORE UPDATE ON public.disparos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evolution_configs_updated_at ON public.evolution_configs;
CREATE TRIGGER update_evolution_configs_updated_at
    BEFORE UPDATE ON public.evolution_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evolution_instances_updated_at ON public.evolution_instances;
CREATE TRIGGER update_evolution_instances_updated_at
    BEFORE UPDATE ON public.evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waha_config_updated_at ON public.waha_config;
CREATE TRIGGER update_waha_config_updated_at
    BEFORE UPDATE ON public.waha_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter estatísticas de clientes
CREATE OR REPLACE FUNCTION public.get_client_stats(user_uuid UUID)
RETURNS TABLE (
    total_clientes BIGINT,
    clientes_ativos BIGINT,
    clientes_inativos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
        COUNT(*) FILTER (WHERE status = 'inativo') as clientes_inativos
    FROM public.clientes 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de campanhas
CREATE OR REPLACE FUNCTION public.get_campaign_stats(user_uuid UUID)
RETURNS TABLE (
    total_campanhas BIGINT,
    campanhas_ativas BIGINT,
    mensagens_enviadas BIGINT,
    mensagens_pendentes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_campanhas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('agendada', 'enviando')) as campanhas_ativas,
        COUNT(d.id) FILTER (WHERE d.status IN ('enviado', 'entregue', 'lido')) as mensagens_enviadas,
        COUNT(d.id) FILTER (WHERE d.status = 'pendente') as mensagens_pendentes
    FROM public.campanhas c
    LEFT JOIN public.disparos d ON c.id = d.campanha_id
    WHERE c.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. DADOS INICIAIS (OPCIONAL)
-- ============================================================================

-- Inserir configuração padrão do WAHA (opcional - pode ser configurado pela interface)
-- Descomente e ajuste conforme necessário:
-- INSERT INTO public.waha_config (id, api_url, api_key)
-- VALUES (1, 'https://seu-servidor-waha.com', '')
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar todas as tabelas criadas
SELECT 
    '✅ SCHEMA CRIADO COM SUCESSO!' as status,
    'Verificando tabelas criadas...' as acao;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('clientes', 'campanhas', 'disparos', 'lotes_campanha', 'evolution_configs', 'evolution_instances', 'waha_config')
ORDER BY tablename;

-- Contar registros (deve ser 0 em banco novo)
SELECT 
    '📊 CONTAGEM DE REGISTROS:' as info;

SELECT 
    'clientes' as tabela, COUNT(*) as total FROM public.clientes
UNION ALL
SELECT 
    'campanhas' as tabela, COUNT(*) as total FROM public.campanhas
UNION ALL
SELECT 
    'disparos' as tabela, COUNT(*) as total FROM public.disparos
UNION ALL
SELECT 
    'lotes_campanha' as tabela, COUNT(*) as total FROM public.lotes_campanha
UNION ALL
SELECT 
    'evolution_configs' as tabela, COUNT(*) as total FROM public.evolution_configs
UNION ALL
SELECT 
    'evolution_instances' as tabela, COUNT(*) as total FROM public.evolution_instances
UNION ALL
SELECT 
    'waha_config' as tabela, COUNT(*) as total FROM public.waha_config;

SELECT 
    '🎉 BANCO DE DADOS PRONTO PARA USO!' as status;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

