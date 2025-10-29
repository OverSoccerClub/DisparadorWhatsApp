# 📡 WAHA com Múltiplos Servidores

## 🎯 Mudança Implementada

**Antes:** 1 servidor WAHA global (singleton)  
**Agora:** Múltiplos servidores WAHA por usuário

---

## 🗂️ Nova Estrutura do Banco

### Tabelas WAHA (V2.1)

#### 1. **waha_servers** (NOVA)
Gerencia múltiplos servidores WAHA por usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do servidor |
| `user_id` | UUID | Dono do servidor |
| `nome` | VARCHAR(255) | Nome amigável (ex: "Servidor Principal") |
| `api_url` | TEXT | URL do servidor WAHA |
| `api_key` | TEXT | Chave API |
| `descricao` | TEXT | Descrição opcional |
| `ativo` | BOOLEAN | Se está ativo |
| `webhook_url` | TEXT | URL do webhook |
| `webhook_secret` | TEXT | Secret do webhook |
| `timeout` | INTEGER | Timeout (segundos) |
| `retry_attempts` | INTEGER | Tentativas de retry |
| `rate_limit` | INTEGER | Limite de req/min |
| `prioridade` | INTEGER | Prioridade (maior = preferencial) |
| `max_sessions` | INTEGER | Máximo de sessões |
| `sessions_ativas` | INTEGER | Sessões ativas atuais |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

**Índices:**
- user_id
- ativo
- prioridade

**Constraints:**
- UNIQUE (user_id, api_url) - Evita URLs duplicadas

#### 2. **waha_sessions** (NOVA)
Gerencia sessões WhatsApp em cada servidor WAHA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID da sessão |
| `user_id` | UUID | Dono da sessão |
| `waha_server_id` | UUID | Servidor WAHA usado |
| `session_name` | VARCHAR(255) | Nome da sessão |
| `status` | VARCHAR(50) | Status da conexão |
| `phone_number` | VARCHAR(20) | Número WhatsApp |
| `profile_name` | VARCHAR(255) | Nome do perfil |
| `qr_code` | TEXT | QR Code (base64) |
| `last_connected_at` | TIMESTAMP | Última conexão |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

**Índices:**
- user_id
- waha_server_id
- status
- session_name

**Constraints:**
- UNIQUE (waha_server_id, session_name) - Evita sessões duplicadas por servidor

---

## ✨ Funcionalidades Novas

### 1. Load Balancing Automático
```sql
-- Função que retorna o melhor servidor disponível
SELECT * FROM get_available_waha_server('user-uuid');
```

**Critérios:**
1. Prioridade (campo `prioridade`)
2. Carga (sessões_ativas / max_sessions)
3. Status ativo

### 2. Múltiplos Servidores por Usuário
- Cadastre quantos servidores WAHA quiser
- Cada um com configurações independentes
- Ative/desative conforme necessário

### 3. Distribuição Inteligente
- Sistema escolhe automaticamente o melhor servidor
- Balanceamento de carga
- Fallback automático

---

## 🚀 Como Usar

### 1. Criar Novo Servidor WAHA

```sql
INSERT INTO public.waha_servers (
    user_id,
    nome,
    api_url,
    api_key,
    descricao,
    prioridade,
    max_sessions
) VALUES (
    'user-uuid-aqui',
    'Servidor Principal',
    'https://waha1.seudominio.com',
    'sua-api-key',
    'Servidor principal de produção',
    10, -- Prioridade alta
    50  -- Máximo 50 sessões
);
```

### 2. Adicionar Mais Servidores

```sql
-- Servidor Secundário
INSERT INTO public.waha_servers (
    user_id,
    nome,
    api_url,
    prioridade,
    max_sessions
) VALUES (
    'user-uuid-aqui',
    'Servidor Backup',
    'https://waha2.seudominio.com',
    5,  -- Prioridade média
    30
);

-- Servidor de Testes
INSERT INTO public.waha_servers (
    user_id,
    nome,
    api_url,
    ativo,
    max_sessions
) VALUES (
    'user-uuid-aqui',
    'Servidor de Teste',
    'https://waha-test.seudominio.com',
    false, -- Desativado por padrão
    10
);
```

### 3. Listar Servidores do Usuário

```sql
SELECT 
    nome,
    api_url,
    ativo,
    sessions_ativas,
    max_sessions,
    prioridade
FROM public.waha_servers
WHERE user_id = 'user-uuid-aqui'
ORDER BY prioridade DESC, nome;
```

### 4. Obter Melhor Servidor Disponível

```sql
SELECT * FROM public.get_available_waha_server('user-uuid-aqui');
```

### 5. Criar Sessão em Servidor Específico

```sql
INSERT INTO public.waha_sessions (
    user_id,
    waha_server_id,
    session_name,
    status
) VALUES (
    'user-uuid-aqui',
    'server-uuid-aqui',
    'sessao-cliente-001',
    'connecting'
);

-- Atualizar contador de sessões ativas
UPDATE public.waha_servers
SET sessions_ativas = sessions_ativas + 1
WHERE id = 'server-uuid-aqui';
```

---

## 🔧 Interface de Configuração

### Tela: Configurações > Servidores WAHA

**Lista de Servidores:**
```
┌──────────────────────────────────────────────────────┐
│ Meus Servidores WAHA                    [+ Adicionar]│
├──────────────────────────────────────────────────────┤
│ 🟢 Servidor Principal                                │
│    https://waha1.seudominio.com                      │
│    Sessões: 15/50  |  Prioridade: 10  |  [Editar]   │
├──────────────────────────────────────────────────────┤
│ 🟢 Servidor Backup                                   │
│    https://waha2.seudominio.com                      │
│    Sessões: 8/30   |  Prioridade: 5   |  [Editar]   │
├──────────────────────────────────────────────────────┤
│ 🔴 Servidor de Teste                                 │
│    https://waha-test.seudominio.com                  │
│    Desativado      |  Prioridade: 0   |  [Editar]   │
└──────────────────────────────────────────────────────┘
```

**Formulário de Adicionar/Editar:**
```
┌──────────────────────────────────────┐
│ Adicionar Servidor WAHA              │
├──────────────────────────────────────┤
│ Nome: [_________________________]    │
│ URL:  [_________________________]    │
│ API Key: [_____________________]     │
│ Descrição: [____________________]    │
│                                      │
│ ☑ Servidor Ativo                     │
│                                      │
│ Prioridade: [__5__] (0-10)           │
│ Max Sessões: [__50__]                │
│                                      │
│ [Testar Conexão]  [Cancelar] [Salvar]│
└──────────────────────────────────────┘
```

---

## 📊 Exemplos de Uso

### Cenário 1: Produção com Backup
```sql
-- Servidor Principal (alta prioridade)
INSERT INTO waha_servers VALUES (
    gen_random_uuid(), 'user-id', 'Principal',
    'https://waha-prod.com', 'key1',
    'Servidor principal', true,
    NULL, NULL, 30, 3, 100, 10, 100, 0,
    NOW(), NOW()
);

-- Servidor Backup (prioridade menor)
INSERT INTO waha_servers VALUES (
    gen_random_uuid(), 'user-id', 'Backup',
    'https://waha-backup.com', 'key2',
    'Servidor de backup', true,
    NULL, NULL, 30, 3, 100, 5, 50, 0,
    NOW(), NOW()
);
```

**Resultado:**
- Sistema usa Principal primeiro
- Se Principal atingir limite, usa Backup
- Se Principal falhar, fallback para Backup

### Cenário 2: Múltiplos Servidores Regionais
```sql
-- Servidor Brasil
INSERT INTO waha_servers VALUES (..., 'Brasil', 'https://waha-br.com', ..., 10, ...);

-- Servidor EUA
INSERT INTO waha_servers VALUES (..., 'EUA', 'https://waha-us.com', ..., 8, ...);

-- Servidor Europa
INSERT INTO waha_servers VALUES (..., 'Europa', 'https://waha-eu.com', ..., 6, ...);
```

### Cenário 3: Teste e Produção
```sql
-- Produção (ativo, prioridade alta)
INSERT INTO waha_servers VALUES (..., 'Produção', ..., true, ..., 10, ...);

-- Teste (desativado por padrão)
INSERT INTO waha_servers VALUES (..., 'Teste', ..., false, ..., 0, ...);
```

---

## 🔄 Migração do Schema Antigo

### Se já tem `waha_config` (singleton):

```sql
-- 1. Migrar dados antigos para waha_servers
INSERT INTO public.waha_servers (
    user_id,
    nome,
    api_url,
    api_key,
    webhook_url,
    webhook_secret,
    timeout,
    retry_attempts,
    rate_limit,
    prioridade,
    max_sessions
)
SELECT 
    'SEU-USER-ID-AQUI' as user_id,
    'Servidor Padrão' as nome,
    api_url,
    api_key,
    webhook_url,
    webhook_secret,
    timeout,
    retry_attempts,
    rate_limit,
    10 as prioridade, -- Alta prioridade
    50 as max_sessions
FROM public.waha_config
WHERE id = 1;

-- 2. (OPCIONAL) Remover tabela antiga
-- DROP TABLE public.waha_config;
```

---

## 🔧 Alterações Necessárias no Código

### API Routes

#### Antes (V1):
```typescript
// Buscar config global
const { data } = await supabase
  .from('waha_config')
  .select('*')
  .eq('id', 1)
  .single()
```

#### Depois (V2):
```typescript
// Buscar servidores do usuário
const { data: servers } = await supabase
  .from('waha_servers')
  .select('*')
  .eq('user_id', userId)
  .eq('ativo', true)
  .order('prioridade', { ascending: false })

// OU usar função de load balancing
const { data: bestServer } = await supabase
  .rpc('get_available_waha_server', { user_uuid: userId })
```

---

## 📈 Vantagens

### ✅ Escalabilidade
- Adicione servidores conforme demanda
- Distribua carga entre múltiplos servidores

### ✅ Alta Disponibilidade
- Fallback automático
- Redundância

### ✅ Flexibilidade
- Servidores regionais
- Ambientes (prod/dev/test)
- Priorização customizada

### ✅ Performance
- Load balancing inteligente
- Melhor utilização de recursos

### ✅ Gestão
- Controle granular por servidor
- Ativar/desativar facilmente
- Monitoramento independente

---

## 📝 SQL para Executar

### Banco Novo:
```sql
-- Execute supabase/DATABASE_COMPLETE_V2.sql
```

### Banco Existente:
```sql
-- 1. Criar tabelas novas
CREATE TABLE public.waha_servers (...);
CREATE TABLE public.waha_sessions (...);

-- 2. Migrar dados (se existir waha_config)
-- Ver seção "Migração do Schema Antigo"

-- 3. Atualizar permissões
GRANT ALL ON public.waha_servers TO authenticated, service_role;
GRANT ALL ON public.waha_sessions TO authenticated, service_role;
```

---

## 🎯 Resumo

### Mudanças Principais:
1. ❌ Removido: `waha_config` (tabela singleton)
2. ✅ Adicionado: `waha_servers` (múltiplos por usuário)
3. ✅ Adicionado: `waha_sessions` (sessões por servidor)
4. ✅ Adicionado: Função `get_available_waha_server()`

### Compatibilidade:
- ✅ Todas as funcionalidades existentes preservadas
- ✅ APIs Evolution intactas
- ✅ Sistema de disparos inalterado
- ✅ Campanhas funcionando normalmente

### Próximos Passos:
1. Executar `DATABASE_COMPLETE_V2.sql` em novo servidor
2. Atualizar código das APIs para usar `waha_servers`
3. Criar interface de gestão de servidores
4. Testar load balancing

---

**Versão:** 2.1  
**Data:** 28/10/2025  
**Schema SQL:** `supabase/DATABASE_COMPLETE_V2.sql`

