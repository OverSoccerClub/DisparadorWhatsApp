# 🌐 CONFIGURAÇÃO WAHA REMOTO

## ✅ Cenário Correto:

- **WAHA instalado:** Em servidores remotos (não local)
- **Aplicação:** Vai se conectar remotamente ao WAHA
- **Não precisa:** Docker local, instalação local, etc.

---

## ⚡ SOLUÇÃO EM 2 PASSOS (3 minutos)

### **PASSO 1: Corrigir Permissões no Supabase** (2 minutos)

Este é o problema principal que está causando o erro:
```
permission denied for table waha_config
```

#### Como corrigir:

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

-- Inserir/Atualizar com URL do servidor remoto
-- IMPORTANTE: Substitua pela URL real do seu servidor WAHA
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://seu-servidor-waha.com', 'sua-api-key-aqui')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    api_key = EXCLUDED.api_key;

-- Verificar configuração
SELECT * FROM public.waha_config;
```

6. **IMPORTANTE:** Antes de executar, **substitua** na última parte:
   - `https://seu-servidor-waha.com` → URL real do seu servidor WAHA
   - `sua-api-key-aqui` → API Key do WAHA (se tiver)

7. Clique em **"Run"** ou pressione **Ctrl+Enter**

---

### **PASSO 2: Reiniciar Servidor Next.js** (30 segundos)

No terminal onde está `npm run dev`:

1. Pressione **Ctrl+C**
2. Execute:
```powershell
npm run dev
```

---

## ✅ PRONTO! Sistema Configurado

Após executar os 2 passos, o sistema vai:

1. ✅ Conectar ao WAHA remoto automaticamente
2. ✅ Buscar sessões do servidor remoto
3. ✅ Criar sessões no servidor remoto
4. ✅ Gerenciar QR codes remotamente

---

## 📝 Exemplo de Configuração

### Se você tem múltiplos servidores WAHA:

Você pode configurar inicialmente um servidor principal:

```sql
-- Servidor principal
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://waha1.seuservidor.com', 'key123')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    api_key = EXCLUDED.api_key;
```

Depois, pode mudar pela interface em **Configurações > WAHA**.

---

## 🔍 Como Verificar se Funcionou

### 1. Console do servidor (terminal):
```
✅ Buscando sessões WAHA em: https://seu-servidor-waha.com
✅ Sessões encontradas: X
✅ Sem erro de permissão
```

### 2. Interface web:
- Acesse: http://localhost:3000/waha-sessions
- Não deve ter erro 404
- Deve listar as sessões do servidor remoto
- Console (F12) sem erros

---

## 📊 Estrutura de URLs

### URLs Corretas:

✅ **Produção:**
```
https://waha.seudominio.com
https://api.seuservidor.com/waha
http://ip-do-servidor:3000
```

❌ **URLs Incorretas (não use):**
```
http://localhost:3000  ← Este é do Next.js
http://localhost:3001  ← Seria WAHA local
```

---

## 🔧 Configurar Múltiplos Servidores

Se você tem vários servidores WAHA, pode:

### Opção 1: Pela Interface (Depois de corrigir permissões)

1. Acesse: http://localhost:3000/configuracoes
2. Vá até a seção **"WAHA"**
3. Configure:
   - **API URL:** https://seu-servidor-waha.com
   - **API Key:** (se tiver)
4. Clique em **"Testar Conexão"**
5. Clique em **"Salvar"**

### Opção 2: Diretamente no Banco

```sql
-- Atualizar configuração
UPDATE public.waha_config
SET 
    api_url = 'https://novo-servidor.com',
    api_key = 'nova-key',
    updated_at = NOW()
WHERE id = 1;
```

---

## ⚙️ Arquivo .env.local (Opcional)

Se preferir usar variáveis de ambiente em vez do banco:

Crie `.env.local` na raiz:

```env
# URL do servidor WAHA remoto
WAHA_API_URL=https://seu-servidor-waha.com

# API Key (se necessário)
WAHA_API_KEY=sua-api-key-aqui

# Webhook (opcional)
WAHA_WEBHOOK_URL=https://sua-app.com/webhook
WAHA_WEBHOOK_SECRET=seu-secret
```

**Prioridade:**
1. Configuração do banco (waha_config)
2. Variáveis de ambiente (.env.local)
3. Valores padrão

---

## 🧪 Testar Conexão

### Via Browser:
```
# Substitua pela sua URL real
https://seu-servidor-waha.com/api/sessions
```

Deve retornar um JSON com lista de sessões.

### Via PowerShell:
```powershell
# Testar servidor remoto
Invoke-WebRequest -Uri "https://seu-servidor-waha.com/api/sessions" -UseBasicParsing

# Com API Key
$headers = @{
    "X-Api-Key" = "sua-api-key"
}
Invoke-WebRequest -Uri "https://seu-servidor-waha.com/api/sessions" -Headers $headers -UseBasicParsing
```

---

## ⚠️ Checklist de Configuração

- [ ] **SQL executado** no Supabase (com URL correta do servidor remoto)
- [ ] **URL configurada** corretamente (https://seu-servidor-waha.com)
- [ ] **API Key configurada** (se o servidor exigir)
- [ ] **Servidor remoto acessível** (testar URL no navegador)
- [ ] **Next.js reiniciado** (Ctrl+C e npm run dev)
- [ ] **Interface carregando** (http://localhost:3000/waha-sessions)
- [ ] **Console sem erros** (F12 sem erros de permissão ou conexão)

---

## 🎯 Resumo

### O que você precisa fazer:

1. ✅ **Executar SQL no Supabase** (com URL do servidor remoto)
2. ✅ **Reiniciar servidor Next.js**

### O que NÃO precisa fazer:

- ❌ Instalar Docker localmente
- ❌ Rodar WAHA localmente
- ❌ Configurar nada local
- ❌ Abrir portas locais

---

## 📞 Próximos Passos

Após executar o SQL:

1. **Reiniciar servidor:** `npm run dev`
2. **Acessar interface:** http://localhost:3000/waha-sessions
3. **Criar sessão:** Botão "Nova Sessão"
4. **Ver sessões:** Lista todas as sessões do servidor remoto

---

## 🎉 Resultado Final

```
✅ Permissões corretas no banco
✅ URL do servidor remoto configurada
✅ Sistema conecta automaticamente ao WAHA remoto
✅ Gerencia sessões remotamente
✅ QR codes carregam do servidor remoto
✅ Tudo funcionando!
```

---

## 📚 Arquivos SQL Criados

- **`scripts/fix-waha-permissions.sql`** - Corrige permissões (use este!)
- **`scripts/create-waha-config-table.sql`** - Cria tabela (se não existir)

---

**👉 EXECUTE O SQL DO PASSO 1 AGORA!** ⬆️

**Lembre-se de substituir a URL pela do seu servidor remoto!**

