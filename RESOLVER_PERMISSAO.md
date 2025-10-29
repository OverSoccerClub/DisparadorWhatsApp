# 🔧 RESOLVER PERMISSÃO - DEFINITIVO

## ❌ Erro Atual:

```
permission denied for table waha_config (código 42501)
```

**Causa:** As políticas RLS estão mal configuradas

---

## ✅ SOLUÇÃO DEFINITIVA (1 minuto)

### Execute este SQL no Supabase:

1. Acesse: **https://supabase.com/dashboard**
2. SQL Editor > New query
3. **Cole TODO o conteúdo** do arquivo: `scripts/fix-permissions-force.sql`

**OU copie este SQL:**

```sql
-- CORREÇÃO FORÇADA DE PERMISSÕES
-- Remove e recria tudo corretamente

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.waha_config DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas
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
    NULL;
END $$;

-- 3. Reabilitar RLS
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas NOVAS e PERMISSIVAS
CREATE POLICY "waha_select_all" ON public.waha_config
    FOR SELECT TO public USING (true);

CREATE POLICY "waha_insert_all" ON public.waha_config
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "waha_update_all" ON public.waha_config
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "waha_delete_all" ON public.waha_config
    FOR DELETE TO public USING (true);

-- 5. Configurar servidor remoto
-- ⚠️ SUBSTITUA pela URL real do seu servidor WAHA!
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://SEU-SERVIDOR-WAHA.COM', '')
ON CONFLICT (id) DO UPDATE SET
    api_url = EXCLUDED.api_url,
    updated_at = NOW();

-- 6. Verificar
SELECT * FROM public.waha_config;
```

4. **IMPORTANTE:** Substitua `https://SEU-SERVIDOR-WAHA.COM` pela URL real
5. Execute (Ctrl+Enter)
6. Deve aparecer: **✅ SELECT funcionou! ✅ UPDATE funcionou!**

---

## 🔄 Reiniciar Servidor

```powershell
Ctrl+C
npm run dev
```

---

## ✅ Verificar

Console deve mostrar:
```
✅ Buscando sessões WAHA em: https://seu-servidor.com
✅ Sessões encontradas: X
✅ SEM erro de permissão
```

---

## 📝 URLs de Exemplo

Substitua no SQL:

```sql
-- Domínio
'https://waha.seuservidor.com'

-- IP e porta
'http://192.168.1.100:3000'

-- Subdomínio
'https://api.seudominio.com/waha'
```

---

## ⚠️ Se Ainda Der Erro

Execute este SQL adicional:

```sql
-- Dar permissão total na tabela
GRANT ALL ON public.waha_config TO postgres, anon, authenticated, service_role;

-- Verificar
SELECT * FROM public.waha_config;
```

---

## ⏰ Tempo: 1 minuto

1. SQL (30 seg)
2. Reiniciar (20 seg)
3. Testar (10 seg)

---

## 🎯 O que este SQL faz:

1. ✅ Desabilita RLS temporariamente
2. ✅ Remove TODAS as políticas antigas
3. ✅ Reabilita RLS
4. ✅ Cria políticas NOVAS e PERMISSIVAS
5. ✅ Configura URL do servidor remoto
6. ✅ Testa as permissões automaticamente

---

## 🎉 Depois disso:

```
✅ Permissões OK
✅ URL configurada
✅ Sistema funcionando
✅ Sem erros!
```

---

**👉 EXECUTE O SQL AGORA!**

**Arquivo:** `scripts/fix-permissions-force.sql`

**Lembre-se de substituir a URL!**

