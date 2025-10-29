# 🔧 CORREÇÃO URGENTE - Permissões WAHA

## ❌ Erros Identificados:

1. **`permission denied for table waha_config`** (código 42501)
2. **URL incorreta** - estava `http://localhost:3000` agora corrigido para `http://localhost:3001`

---

## ✅ SOLUÇÃO EM 2 PASSOS

### **PASSO 1: Corrigir Permissões no Supabase** (2 minutos)

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto
3. Clique em **"SQL Editor"** no menu lateral
4. Clique em **"New query"**
5. Cole o SQL abaixo:

```sql
-- ============================================================================
-- FIX PERMISSÕES DA TABELA waha_config
-- ============================================================================

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.waha_config;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable update for service role" ON public.waha_config;
DROP POLICY IF EXISTS "Enable delete for service role" ON public.waha_config;

-- 2. Criar políticas permissivas
CREATE POLICY "waha_config_select_policy" ON public.waha_config
    FOR SELECT
    USING (true);

CREATE POLICY "waha_config_insert_policy" ON public.waha_config
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "waha_config_update_policy" ON public.waha_config
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

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
```

6. Clique em **"Run"** ou pressione `Ctrl+Enter`
7. Deve aparecer: ✅ **"Permissões atualizadas com sucesso!"**

---

### **PASSO 2: Reiniciar Servidor Next.js** (1 minuto)

O código foi corrigido. Agora precisa reiniciar o servidor:

```powershell
# Parar o servidor (Ctrl+C no terminal)
# OU:
taskkill /F /IM node.exe

# Iniciar novamente:
npm run dev
```

---

## ✅ Verificar se Funcionou

Após executar os 2 passos:

### 1. Verificar no console do navegador (F12):
- **Antes:** `permission denied for table waha_config`
- **Depois:** Sem erros de permissão

### 2. Verificar URL:
- **Antes:** `Buscando sessões WAHA em: http://localhost:3000` ❌
- **Depois:** `Buscando sessões WAHA em: http://localhost:3001` ✅

### 3. Testar na interface:
```
http://localhost:3000/waha-sessions
```
- Não deve ter erro 404
- Não deve ter erro de permissão

---

## 📊 O Que Foi Corrigido

### Arquivo: `app/api/waha/sessions/route.ts`
**Mudança:**
```typescript
// ANTES (ERRADO):
apiUrl: process.env.WAHA_API_URL || 'http://localhost:3000'

// DEPOIS (CORRETO):
apiUrl: process.env.WAHA_API_URL || 'http://localhost:3001'
```

### Arquivo: `scripts/fix-waha-permissions.sql`
**Criado:** Script SQL para corrigir permissões

---

## 🔍 Entendendo o Problema

### Problema 1: Permissões
As políticas RLS (Row Level Security) do Supabase estavam muito restritivas:
- ❌ `auth.role() = 'authenticated'` - exigia autenticação específica
- ✅ `USING (true)` - permite acesso da API

### Problema 2: URL Incorreta
A porta padrão estava errada:
- ❌ `localhost:3000` - porta do Next.js
- ✅ `localhost:3001` - porta do WAHA (Docker)

---

## ⚠️ Ainda com Erro 404?

Se mesmo após os passos acima você ainda tiver erro 404:

### Verificar se WAHA está rodando:
```powershell
docker ps | findstr waha
```

**Se não aparecer nada:**
```powershell
# Iniciar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# Aguardar 10 segundos
Start-Sleep -Seconds 10

# Testar
Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing
```

### Verificar arquivo .env.local:
Deve conter:
```env
WAHA_API_URL=http://localhost:3001
WAHA_API_KEY=
```

---

## 🎯 Checklist Rápido

Execute em ordem:

- [ ] **SQL executado** no Supabase (`fix-waha-permissions.sql`)
- [ ] **Mensagem de sucesso** apareceu: "Permissões atualizadas com sucesso!"
- [ ] **WAHA rodando**: `docker ps | findstr waha` mostra container ativo
- [ ] **WAHA responde**: `curl http://localhost:3001/api/sessions` retorna `[]`
- [ ] **Servidor reiniciado**: Parou e iniciou `npm run dev`
- [ ] **Sem erros no console**: Abrir F12 e verificar
- [ ] **URL correta**: Console mostra `localhost:3001` (não 3000)
- [ ] **Página carrega**: http://localhost:3000/waha-sessions funciona

---

## 📚 Arquivos Relacionados

| Arquivo | Status |
|---------|--------|
| `scripts/fix-waha-permissions.sql` | ✅ Criado |
| `app/api/waha/sessions/route.ts` | ✅ Corrigido |
| `scripts/create-waha-config-table.sql` | ✅ Atualizado |

---

## 🚀 Resultado Esperado

Após executar os 2 passos, você deve ver no console:

```
🔍 Buscando sessões WAHA em: http://localhost:3001
✅ Sessões encontradas: 0
```

E na interface:
- ✅ Lista de sessões vazia (normal se não criou nenhuma)
- ✅ Botão "Nova Sessão" funcionando
- ✅ Sem erros no console (F12)

---

## ⏰ Tempo Total

**2-3 minutos** para resolver completamente! 🎉

---

## 📞 Próximos Passos

Depois de corrigir:

1. **Criar primeira sessão:**
   - Clicar em "Nova Sessão"
   - Digitar nome: `teste-001`
   - Clicar em "Criar"

2. **Ver QR Code:**
   - Aguardar alguns segundos
   - QR Code deve aparecer
   - Escanear com WhatsApp

3. **Pronto!** Sistema funcionando! 🎊

---

**👉 COMECE AGORA: Execute o PASSO 1 (SQL no Supabase)** ⬆️

