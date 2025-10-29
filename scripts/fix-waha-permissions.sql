-- ============================================================================
-- FIX PERMISSÕES DA TABELA waha_config
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;

-- 2. Criar políticas permissivas (para desenvolvimento)
-- ATENÇÃO: Em produção, considere políticas mais restritivas

-- Permitir SELECT para todos
CREATE POLICY "waha_config_select_policy" ON public.waha_config
    FOR SELECT
    USING (true);

-- Permitir INSERT para todos
CREATE POLICY "waha_config_insert_policy" ON public.waha_config
    FOR INSERT
    WITH CHECK (true);

-- Permitir UPDATE para todos
CREATE POLICY "waha_config_update_policy" ON public.waha_config
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE para todos
CREATE POLICY "waha_config_delete_policy" ON public.waha_config
    FOR DELETE
    USING (true);

-- 3. Garantir que a configuração padrão existe
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'http://localhost:3001', '')
ON CONFLICT (id) DO UPDATE SET
    api_url = EXCLUDED.api_url;

-- 4. Verificar
SELECT 'Permissões atualizadas com sucesso!' as status;
SELECT * FROM public.waha_config;

