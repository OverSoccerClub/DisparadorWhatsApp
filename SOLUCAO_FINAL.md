# ⚡ SOLUÇÃO FINAL - WAHA

## ❌ Problemas Identificados:

1. **Docker Desktop não está rodando** → `The system cannot find the file specified`
2. **Permissão negada no banco** → `permission denied for table waha_config`

---

## ✅ SOLUÇÃO EM 3 PASSOS (5 minutos)

### **PASSO 1: Iniciar Docker Desktop** (1 minuto)

1. Pressione **Win + S** (buscar)
2. Digite: **Docker Desktop**
3. Clique para abrir
4. Aguarde o Docker iniciar (ícone aparece na bandeja)
5. Quando o ícone ficar estável (não piscar), está pronto!

---

### **PASSO 2: Instalar WAHA** (2 minutos)

Depois que o Docker Desktop estiver rodando, execute:

```powershell
# Instalar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# Aguardar 15 segundos
Start-Sleep -Seconds 15

# Testar
Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing
```

**Resultado esperado:**
```
StatusCode: 200
Content: []
```

---

### **PASSO 3: Corrigir Permissões no Supabase** (2 minutos)

1. Acesse: **https://supabase.com/dashboard**
2. Abra seu projeto
3. Clique em **"SQL Editor"** (menu lateral)
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

-- Criar políticas permissivas
CREATE POLICY "waha_config_select_policy" ON public.waha_config 
    FOR SELECT USING (true);

CREATE POLICY "waha_config_insert_policy" ON public.waha_config 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "waha_config_update_policy" ON public.waha_config 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "waha_config_delete_policy" ON public.waha_config 
    FOR DELETE USING (true);

-- Garantir configuração padrão
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'http://localhost:3001', '')
ON CONFLICT (id) DO UPDATE SET api_url = EXCLUDED.api_url;

-- Verificar
SELECT * FROM public.waha_config;
```

6. Clique em **"Run"** ou pressione **Ctrl+Enter**
7. Deve aparecer a linha com a configuração

---

### **PASSO 4: Reiniciar Next.js** (30 segundos)

No terminal onde está `npm run dev`:

1. Pressione **Ctrl+C**
2. Execute:
```powershell
npm run dev
```

---

## ✅ VERIFICAR SE FUNCIONOU

### 1. Verificar Docker:
```powershell
docker ps
```
Deve mostrar o container `waha` rodando

### 2. Testar WAHA:
```powershell
curl http://localhost:3001/api/sessions
```
Deve retornar: `[]`

### 3. Testar Interface:
Abra no navegador: **http://localhost:3000/waha-sessions**

**Console (F12) deve mostrar:**
```
✅ Buscando sessões WAHA em: http://localhost:3001
✅ Sessões encontradas: 0
✅ Sem erros de permissão
```

---

## 🎯 CHECKLIST COMPLETO

Execute em ordem:

- [ ] **Docker Desktop aberto e rodando**
- [ ] **Container WAHA instalado**: `docker run -d -p 3001:3000 --name waha devlikeapro/waha`
- [ ] **WAHA responde**: `curl http://localhost:3001/api/sessions` retorna `[]`
- [ ] **SQL executado no Supabase** (copie e cole o SQL acima)
- [ ] **Servidor Next.js reiniciado**: Parou (Ctrl+C) e iniciou (`npm run dev`)
- [ ] **Página carrega**: http://localhost:3000/waha-sessions sem erro 404
- [ ] **Console limpo**: F12 sem erros de permissão ou conexão

---

## ⚠️ PROBLEMAS COMUNS

### Docker Desktop não abre?
- Reinicie o computador
- Verifique se está instalado: https://www.docker.com/products/docker-desktop

### Porta 3001 já em uso?
```powershell
# Ver o que está usando
netstat -ano | findstr :3001

# Usar outra porta (ex: 3002)
docker run -d -p 3002:3000 --name waha devlikeapro/waha

# Atualizar no Supabase:
UPDATE waha_config SET api_url = 'http://localhost:3002' WHERE id = 1;
```

### WAHA não inicia?
```powershell
# Ver erro
docker logs waha

# Remover e reinstalar
docker rm -f waha
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

### SQL dá erro no Supabase?
- Verifique se a tabela `waha_config` existe
- Se não existir, execute primeiro: `scripts/create-waha-config-table.sql`

---

## 🚀 RESUMO RÁPIDO

```powershell
# 1. Abrir Docker Desktop (ícone na bandeja)

# 2. Instalar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# 3. Executar SQL no Supabase (copie do PASSO 3 acima)

# 4. Reiniciar servidor
# Ctrl+C depois npm run dev
```

---

## 🎉 RESULTADO FINAL

Após completar todos os passos:

✅ Docker Desktop rodando  
✅ WAHA instalado e funcionando (porta 3001)  
✅ Permissões corretas no Supabase  
✅ Servidor Next.js reiniciado  
✅ Interface carregando: http://localhost:3000/waha-sessions  
✅ Pronto para criar sessões WhatsApp!  

---

## 📞 PRÓXIMOS PASSOS

Depois de tudo funcionando:

1. **Criar primeira sessão:**
   - Acesse: http://localhost:3000/waha-sessions
   - Clique em "Nova Sessão"
   - Digite um nome: `teste-001`
   - Clique em "Criar Sessão"

2. **Ver QR Code:**
   - Aguarde alguns segundos
   - QR Code deve aparecer
   - Escaneie com WhatsApp

3. **Pronto!** Sistema funcionando! 🎊

---

## ⏰ TEMPO TOTAL

**5 minutos** se seguir todos os passos!

---

**👉 COMECE AGORA: Abra o Docker Desktop! ⬆️**

