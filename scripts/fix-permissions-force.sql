-- ============================================================================
-- CORREÇÃO FORÇADA DE PERMISSÕES - WAHA
-- Este script remove e recria TUDO corretamente
-- ============================================================================

-- 1. DESABILITAR RLS temporariamente para limpar
ALTER TABLE public.waha_config DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS as políticas (mesmo que dê erro, continua)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
    DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
    DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
    DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
    DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
    DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
    DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;
    DROP POLICY IF EXISTS "waha_config_select_policy" ON public.waha_config;
    DROP POLICY IF EXISTS "waha_config_insert_policy" ON public.waha_config;
    DROP POLICY IF EXISTS "waha_config_update_policy" ON public.waha_config;
    DROP POLICY IF EXISTS "waha_config_delete_policy" ON public.waha_config;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Algumas políticas não existiam: %', SQLERRM;
END $$;

-- 3. REABILITAR RLS
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR políticas NOVAS e PERMISSIVAS
CREATE POLICY "waha_select_all" ON public.waha_config
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "waha_insert_all" ON public.waha_config
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "waha_update_all" ON public.waha_config
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "waha_delete_all" ON public.waha_config
    FOR DELETE
    TO public
    USING (true);

-- 5. GARANTIR que o registro existe
-- ⚠️ IMPORTANTE: Substitua a URL pela do seu servidor remoto!
INSERT INTO public.waha_config (
    id, 
    api_url, 
    api_key,
    timeout,
    retry_attempts,
    enable_auto_reconnect,
    enable_qr_code,
    enable_presence
)
VALUES (
    1,
    'https://SEU-SERVIDOR-WAHA.COM',  -- ← SUBSTITUA AQUI pela URL real!
    '',                                -- ← API Key (se tiver)
    30,
    3,
    true,
    true,
    true
)
ON CONFLICT (id) DO UPDATE SET
    api_url = EXCLUDED.api_url,
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- 6. TESTAR permissões
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Tentar ler
    SELECT * INTO test_record FROM public.waha_config WHERE id = 1;
    RAISE NOTICE '✅ SELECT funcionou!';
    
    -- Tentar atualizar
    UPDATE public.waha_config SET updated_at = NOW() WHERE id = 1;
    RAISE NOTICE '✅ UPDATE funcionou!';
    
    RAISE NOTICE '✅ Todas as permissões estão OK!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Ainda há problema: %', SQLERRM;
END $$;

-- 7. VERIFICAR configuração final
SELECT 
    '✅ CONFIGURAÇÃO COMPLETA!' as status,
    'Verifique a URL abaixo:' as aviso;

SELECT 
    id,
    api_url,
    api_key,
    timeout,
    retry_attempts,
    created_at,
    updated_at
FROM public.waha_config
WHERE id = 1;

-- 8. LISTAR políticas ativas
SELECT 
    '📋 Políticas ativas:' as info;

SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'waha_config'
ORDER BY policyname;

-- 9. PRÓXIMOS PASSOS
SELECT 
    '🔄 AGORA:' as passo,
    '1. Verifique se a URL está correta acima' as acao_1,
    '2. Reinicie o servidor: Ctrl+C e npm run dev' as acao_2,
    '3. Acesse: http://localhost:3000/waha-sessions' as acao_3;

