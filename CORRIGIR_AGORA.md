# ⚡ CORREÇÃO RÁPIDA - WAHA REMOTO

## 🎯 Situação:

- ✅ WAHA instalado em **servidores remotos**
- ✅ Aplicação vai **conectar remotamente**
- ❌ Erro: `permission denied for table waha_config`

---

## ✅ SOLUÇÃO (2 minutos)

### **1. Execute este SQL no Supabase:**

1. Acesse: **https://supabase.com/dashboard**
2. SQL Editor > New query
3. Cole:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;

-- Criar políticas permissivas
CREATE POLICY "waha_config_select_policy" ON public.waha_config 
    FOR SELECT USING (true);

CREATE POLICY "waha_config_insert_policy" ON public.waha_config 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "waha_config_update_policy" ON public.waha_config 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "waha_config_delete_policy" ON public.waha_config 
    FOR DELETE USING (true);

-- Configurar servidor remoto
-- ⚠️ SUBSTITUA 'https://SEU-SERVIDOR-WAHA.COM' pela URL real!
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://SEU-SERVIDOR-WAHA.COM', '')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    updated_at = NOW();

SELECT * FROM public.waha_config;
```

4. **IMPORTANTE:** Substitua `https://SEU-SERVIDOR-WAHA.COM` pela URL real do seu servidor WAHA
5. Execute (Ctrl+Enter)

---

### **2. Reiniciar servidor:**

```powershell
# Ctrl+C no terminal
npm run dev
```

---

## ✅ PRONTO!

### Verificar:

```
http://localhost:3000/waha-sessions
```

Console deve mostrar:
```
✅ Buscando sessões WAHA em: https://seu-servidor-waha.com
✅ Sessões encontradas: X
```

---

## 📝 URLs de Exemplo

Substitua no SQL por uma destas (conforme seu caso):

```sql
-- Servidor com domínio
'https://waha.seudominio.com'

-- Servidor com IP e porta
'http://192.168.1.100:3000'

-- API com path
'https://api.seuservidor.com/waha'
```

---

## 🎯 Configurar Depois pela Interface

Após corrigir permissões, você pode mudar a URL em:

**http://localhost:3000/configuracoes** > Seção WAHA

---

## ⏰ Tempo: 2 minutos

1. SQL no Supabase (1 min)
2. Reiniciar servidor (30 seg)
3. Testar (30 seg)

---

**👉 EXECUTE O SQL AGORA!** ⬆️

**Lembre-se: Substitua a URL pela do seu servidor remoto!**

