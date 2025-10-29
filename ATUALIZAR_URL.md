# ⚡ ATUALIZAR URL DO WAHA

## ✅ As permissões já estão corretas!

O erro `policy already exists` significa que as permissões já foram configuradas.

**Você só precisa atualizar a URL do servidor remoto!**

---

## 🎯 SOLUÇÃO (30 segundos)

### Execute este SQL no Supabase:

1. Acesse: **https://supabase.com/dashboard**
2. SQL Editor > New query
3. Cole:

```sql
-- Atualizar URL do servidor remoto
-- ⚠️ SUBSTITUA pela URL real do seu servidor WAHA!

UPDATE public.waha_config
SET 
    api_url = 'https://SEU-SERVIDOR-WAHA.COM',  -- ← MUDE AQUI
    api_key = '',                                -- ← API Key (opcional)
    updated_at = NOW()
WHERE id = 1;

-- Verificar
SELECT * FROM public.waha_config;
```

4. **Substitua:** `https://SEU-SERVIDOR-WAHA.COM` pela URL real
5. Execute (Ctrl+Enter)

---

### Exemplos de URLs válidas:

```sql
-- Com domínio
'https://waha.seuservidor.com'

-- Com IP e porta
'http://192.168.1.100:3000'

-- Com subpath
'https://api.seudominio.com/waha'
```

---

## 🔄 Reiniciar Servidor

```powershell
# No terminal do npm run dev:
Ctrl+C

# Depois:
npm run dev
```

---

## ✅ Testar

Acesse: http://localhost:3000/waha-sessions

Console deve mostrar:
```
✅ Buscando sessões WAHA em: https://seu-servidor-waha.com
✅ Sessões encontradas: X
```

---

## ⏰ Tempo: 30 segundos

1. SQL (10 seg)
2. Reiniciar (10 seg)
3. Testar (10 seg)

---

**👉 EXECUTE O SQL AGORA!**

**Lembre-se de substituir a URL pela do seu servidor remoto!**

