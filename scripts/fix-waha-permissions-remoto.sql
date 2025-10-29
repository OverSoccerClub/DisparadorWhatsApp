-- ============================================================================
-- CORREÇÃO DE PERMISSÕES - WAHA REMOTO
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;

-- 2. Criar políticas permissivas (para desenvolvimento)
CREATE POLICY "waha_config_select_policy" ON public.waha_config 
    FOR SELECT USING (true);

CREATE POLICY "waha_config_insert_policy" ON public.waha_config 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "waha_config_update_policy" ON public.waha_config 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "waha_config_delete_policy" ON public.waha_config 
    FOR DELETE USING (true);

-- 3. Configurar servidor remoto
-- ⚠️ IMPORTANTE: SUBSTITUA OS VALORES ABAIXO PELOS SEUS!
-- 
-- Exemplos de URLs válidas:
-- - https://waha.seuservidor.com
-- - http://ip-do-servidor:3000
-- - https://api.seudominio.com/waha
--
INSERT INTO public.waha_config (
    id, 
    api_url, 
    api_key,
    webhook_url,
    webhook_secret,
    timeout,
    retry_attempts
)
VALUES (
    1,
    'https://SEU-SERVIDOR-WAHA.COM',  -- ← SUBSTITUA AQUI
    '',                                -- ← API Key (se tiver)
    '',                                -- ← URL do Webhook (opcional)
    '',                                -- ← Secret do Webhook (opcional)
    30,                                -- Timeout em segundos
    3                                  -- Número de tentativas
)
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    api_key = EXCLUDED.api_key,
    webhook_url = EXCLUDED.webhook_url,
    webhook_secret = EXCLUDED.webhook_secret,
    timeout = EXCLUDED.timeout,
    retry_attempts = EXCLUDED.retry_attempts,
    updated_at = NOW();

-- 4. Verificar configuração
SELECT 
    '✅ Permissões corrigidas com sucesso!' as status,
    'Verifique se a URL está correta abaixo:' as aviso;

SELECT * FROM public.waha_config;

-- 5. Instruções
SELECT 
    '⚠️ PRÓXIMO PASSO:' as instrucao,
    'Reinicie o servidor Next.js: Ctrl+C e depois npm run dev' as acao;

