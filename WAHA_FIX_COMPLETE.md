# 🔧 SOLUÇÃO COMPLETA - Erro WAHA 404

## 🎯 Problemas Identificados

1. ❌ Tabela `waha_config` não existe no Supabase
2. ❌ WAHA não está rodando

---

## ✅ SOLUÇÃO EM 4 PASSOS

### 📋 PASSO 1: Criar Tabela no Supabase

#### Opção A: Via SQL Editor (Recomendado)

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"New query"**
4. Cole o seguinte SQL:

```sql
-- Criar tabela waha_config
CREATE TABLE IF NOT EXISTS public.waha_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    api_url TEXT NOT NULL,
    api_key TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    enable_auto_reconnect BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_presence BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT waha_config_id_check CHECK (id = 1)
);

-- Habilitar RLS
ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura para todos" ON public.waha_config
    FOR SELECT USING (true);

CREATE POLICY "Permitir atualização para autenticados" ON public.waha_config
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para autenticados" ON public.waha_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Inserir configuração padrão
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'http://localhost:3001', '')
ON CONFLICT (id) DO NOTHING;
```

5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Verifique se apareceu: ✅ **Success. No rows returned**

#### Opção B: Usar o script criado

O script já está em: `scripts/create-waha-config-table.sql`

---

### 🐳 PASSO 2: Instalar e Rodar o WAHA

```bash
# Execute no terminal (PowerShell ou CMD)
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

**Aguarde 10-15 segundos** para o WAHA iniciar completamente.

#### Verificar se está rodando:
```bash
docker ps | findstr waha
```

Deve aparecer algo como:
```
abc123def456   devlikeapro/waha   Up 2 minutes   0.0.0.0:3001->3000/tcp
```

#### Testar no navegador:
Abra: http://localhost:3001/api/sessions

Deve ver: `[]` (lista vazia)

---

### ⚙️ PASSO 3: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# URL do WAHA
WAHA_API_URL=http://localhost:3001

# API Key (opcional - deixe vazio por enquanto)
WAHA_API_KEY=
```

---

### 🔄 PASSO 4: Reiniciar o Servidor

```bash
# 1. Parar o servidor Next.js
# Pressione Ctrl+C no terminal onde está rodando

# 2. Reiniciar
npm run dev
```

---

## ✅ VERIFICAR SE FUNCIONOU

### 1. Verificar Supabase:
```sql
-- Execute no SQL Editor do Supabase
SELECT * FROM public.waha_config;
```

Deve retornar:
```
id | api_url                  | api_key | ...
1  | http://localhost:3001    |         | ...
```

### 2. Verificar WAHA:
Abra: http://localhost:3001/api/sessions

Deve ver: `[]`

### 3. Verificar Sistema:
1. Acesse: http://localhost:3000/waha-sessions
2. Deve carregar sem erros 404
3. Clique em "Nova Sessão"
4. Crie uma sessão de teste

---

## 🆘 TROUBLESHOOTING

### Erro: "Could not find the table 'public.waha_config'"

**Solução:**
- Execute o SQL no Supabase novamente
- Verifique se está no projeto correto
- Aguarde 1-2 minutos após executar o SQL

### Erro: "404 Not Found" ao acessar WAHA

**Causa:** WAHA não está rodando

**Solução:**
```bash
# Ver se WAHA está rodando
docker ps | findstr waha

# Se não aparecer nada, iniciar:
docker start waha

# Se não existir, criar:
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

### Erro: "port 3001 is already allocated"

**Solução:** Use outra porta:
```bash
# Remover container antigo
docker rm -f waha

# Criar na porta 3002
docker run -d -p 3002:3000 --name waha devlikeapro/waha
```

E atualizar `.env.local`:
```env
WAHA_API_URL=http://localhost:3002
```

### WAHA não responde

**Solução:**
```bash
# Ver logs
docker logs waha

# Reiniciar
docker restart waha

# Se não funcionar, recriar:
docker rm -f waha
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

---

## 📊 Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Ver logs do WAHA
docker logs waha -f

# Parar WAHA
docker stop waha

# Iniciar WAHA
docker start waha

# Reiniciar WAHA
docker restart waha

# Remover WAHA
docker rm -f waha

# Testar API do WAHA
curl http://localhost:3001/api/sessions
```

---

## 🎯 Checklist Final

- [ ] Tabela `waha_config` criada no Supabase
- [ ] WAHA rodando no Docker (porta 3001)
- [ ] Arquivo `.env.local` configurado
- [ ] Servidor Next.js reiniciado
- [ ] http://localhost:3001/api/sessions retorna `[]`
- [ ] http://localhost:3000/waha-sessions carrega sem erros
- [ ] Consegue criar nova sessão

---

## 🎉 Pronto!

Agora o sistema de Sessões WAHA deve estar funcionando perfeitamente!

**Se ainda tiver problemas**, verifique:
1. Console do navegador (F12)
2. Terminal do Next.js
3. Logs do WAHA: `docker logs waha`

