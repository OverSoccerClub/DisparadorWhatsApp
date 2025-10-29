# ⚡ SOLUÇÃO RÁPIDA - 3 Comandos

## 🎯 Problemas Identificados:

1. ❌ **WAHA não está rodando** (`ECONNREFUSED` porta 3001)
2. ❌ **Permissão negada** no banco (`permission denied for table waha_config`)

---

## ✅ SOLUÇÃO AUTOMÁTICA

### Execute este comando:

```powershell
npm run fix-waha
```

Este script vai:
- ✅ Verificar e instalar Docker
- ✅ Instalar e iniciar WAHA na porta 3001
- ✅ Testar se WAHA está funcionando
- ✅ Abrir o arquivo SQL para você executar no Supabase

---

## 📋 PASSO A PASSO MANUAL

Se preferir fazer manualmente:

### 1️⃣ Iniciar WAHA (2 minutos)

```powershell
# Instalar e iniciar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# Aguardar 15 segundos
Start-Sleep -Seconds 15

# Testar
Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing
```

**Deve retornar:** Status 200 com `[]`

---

### 2️⃣ Corrigir Permissões no Supabase (2 minutos)

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto
3. Clique em **"SQL Editor"**
4. Clique em **"New query"**
5. Cole este SQL:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;

-- Criar novas políticas (permissivas)
CREATE POLICY "waha_config_select_policy" ON public.waha_config FOR SELECT USING (true);
CREATE POLICY "waha_config_insert_policy" ON public.waha_config FOR INSERT WITH CHECK (true);
CREATE POLICY "waha_config_update_policy" ON public.waha_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "waha_config_delete_policy" ON public.waha_config FOR DELETE USING (true);

-- Garantir configuração padrão
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'http://localhost:3001', '')
ON CONFLICT (id) DO UPDATE SET api_url = EXCLUDED.api_url;

-- Verificar
SELECT 'OK' as status, * FROM public.waha_config;
```

6. Clique em **"Run"** (Ctrl+Enter)
7. Deve aparecer: ✅ Status OK

---

### 3️⃣ Reiniciar Next.js (1 minuto)

```powershell
# No terminal onde está rodando npm run dev:
# Pressione Ctrl+C

# Depois:
npm run dev
```

---

## ✅ Verificar se Funcionou

### Console do servidor (terminal):
```
✅ Sem erro "permission denied"
🔍 Buscando sessões WAHA em: http://localhost:3001
✅ Sessões encontradas: 0
```

### Navegador:
```
http://localhost:3000/waha-sessions
```
- ✅ Página carrega sem erro 404
- ✅ Console (F12) sem erros
- ✅ Botão "Nova Sessão" funcionando

---

## 🔍 Diagnóstico

Execute para ver o status:

```powershell
# Verificar se WAHA está rodando
docker ps | findstr waha

# Ver logs do WAHA
docker logs waha --tail 50

# Testar WAHA diretamente
curl http://localhost:3001/api/sessions

# Testar script de diagnóstico
node test-waha-setup.js
```

---

## ⚠️ Problemas Comuns

### Docker não instalado?
```powershell
# Baixar e instalar:
# https://www.docker.com/products/docker-desktop
# Reiniciar computador
```

### Porta 3001 já em uso?
```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3001

# Usar outra porta
docker rm -f waha
docker run -d -p 3002:3000 --name waha devlikeapro/waha

# Atualizar no Supabase:
# UPDATE waha_config SET api_url = 'http://localhost:3002' WHERE id = 1;
```

### WAHA não inicia?
```powershell
# Ver erro
docker logs waha

# Remover e reinstalar
docker rm -f waha
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

---

## 📊 Checklist

Execute em ordem:

- [ ] **Docker instalado**: `docker --version`
- [ ] **WAHA rodando**: `docker ps | findstr waha`
- [ ] **WAHA responde**: `curl http://localhost:3001/api/sessions`
- [ ] **SQL executado** no Supabase
- [ ] **Servidor reiniciado**: Parou e iniciou `npm run dev`
- [ ] **Página carrega**: http://localhost:3000/waha-sessions
- [ ] **Console limpo**: Sem erros no F12

---

## ⏰ Tempo Total

**5 minutos** para resolver tudo!

---

## 🚀 Começar Agora

### Opção 1 - Automático (Recomendado):
```powershell
npm run fix-waha
```

### Opção 2 - Manual:
Execute os 3 passos acima ⬆️

---

## 📚 Mais Informações

- **Guia Completo:** `FIX_PERMISSIONS_AGORA.md`
- **SQL das Permissões:** `scripts/fix-waha-permissions.sql`
- **Setup Completo:** `WAHA_README.md`
- **Troubleshooting:** `WAHA_TROUBLESHOOTING.md`

---

## 🎯 Resultado Final

Após executar tudo:

```
✅ WAHA rodando na porta 3001
✅ Permissões do banco corretas
✅ Servidor Next.js funcionando
✅ Interface http://localhost:3000/waha-sessions carregando
✅ Pronto para criar sessões WhatsApp!
```

---

**👉 EXECUTE AGORA: `npm run fix-waha`** 🚀

