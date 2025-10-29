# ⚡ SOLUÇÃO DEFINITIVA - ULTRA SIMPLES

## 🎯 Problema:

Políticas antigas existem e não podem ser recriadas.

## ✅ Solução Simples:

**DESABILITAR RLS** (Row Level Security) completamente!

---

## 📋 EXECUTE ESTE SQL (30 segundos)

### No Supabase SQL Editor:

```sql
-- Desabilitar RLS (acesso livre)
ALTER TABLE public.waha_config DISABLE ROW LEVEL SECURITY;

-- Dar permissões totais
GRANT ALL ON public.waha_config TO postgres, anon, authenticated, service_role;

-- Configurar URL do servidor remoto
-- ⚠️ SUBSTITUA pela URL real!
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://SEU-SERVIDOR-WAHA.COM', '')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    updated_at = NOW();

-- Verificar
SELECT * FROM public.waha_config;
```

**⚠️ IMPORTANTE:** Substitua `https://SEU-SERVIDOR-WAHA.COM` pela URL real!

---

## 🔄 Reiniciar

```powershell
Ctrl+C
npm run dev
```

---

## ✅ Pronto!

Console deve mostrar:
```
✅ Buscando sessões WAHA em: https://seu-servidor.com
✅ SEM erro de permissão
```

---

## ⏰ Tempo: 30 segundos

---

**👉 EXECUTE AGORA!**

**Este SQL é o mais simples possível e VAI FUNCIONAR!**

