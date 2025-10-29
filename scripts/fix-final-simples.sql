-- ============================================================================
-- CORREÇÃO FINAL SIMPLIFICADA
-- Desabilita RLS completamente (solução mais simples)
-- ============================================================================

-- OPÇÃO 1: DESABILITAR RLS COMPLETAMENTE (Mais simples)
-- Isso permite acesso total sem precisar de políticas
ALTER TABLE public.waha_config DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Dar permissões diretas na tabela
GRANT ALL ON public.waha_config TO postgres;
GRANT ALL ON public.waha_config TO anon;
GRANT ALL ON public.waha_config TO authenticated;
GRANT ALL ON public.waha_config TO service_role;

-- Configurar URL do servidor remoto
-- ⚠️ SUBSTITUA pela URL real do seu servidor WAHA!
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://SEU-SERVIDOR-WAHA.COM', '')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    updated_at = NOW();

-- Verificar
SELECT 
    '✅ RLS DESABILITADO - Acesso livre!' as status,
    'Verifique a URL abaixo:' as aviso;

SELECT * FROM public.waha_config;

-- Próximo passo
SELECT 
    '🔄 AGORA: Reinicie o servidor (Ctrl+C e npm run dev)' as proximo_passo;

