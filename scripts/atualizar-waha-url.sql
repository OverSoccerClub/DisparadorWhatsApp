-- ============================================================================
-- ATUALIZAR URL DO WAHA REMOTO
-- Execute este SQL se as políticas já existirem
-- ============================================================================

-- Simplesmente atualizar a URL do servidor remoto
-- ⚠️ IMPORTANTE: SUBSTITUA 'https://SEU-SERVIDOR-WAHA.COM' pela URL real!

UPDATE public.waha_config
SET 
    api_url = 'https://SEU-SERVIDOR-WAHA.COM',  -- ← SUBSTITUA AQUI
    api_key = '',                                -- ← API Key (se tiver)
    updated_at = NOW()
WHERE id = 1;

-- Se o registro não existir, criar
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://SEU-SERVIDOR-WAHA.COM', '')
ON CONFLICT (id) DO NOTHING;

-- Verificar configuração
SELECT 
    '✅ Configuração atualizada!' as status,
    'Verifique se a URL está correta:' as aviso;

SELECT 
    id,
    api_url,
    api_key,
    timeout,
    retry_attempts,
    updated_at
FROM public.waha_config
WHERE id = 1;

-- Próximos passos
SELECT 
    '🔄 PRÓXIMO PASSO:' as instrucao,
    'Reinicie o servidor: Ctrl+C e depois npm run dev' as acao;

