# 📊 Documentação do Banco de Dados - Disparador WhatsApp

## 📋 Visão Geral

Este documento descreve a estrutura completa do banco de dados do sistema **Disparador WhatsApp**.

**Versão:** 2.0  
**SGBD:** PostgreSQL (Supabase)  
**Total de Tabelas:** 7 principais + auth.users (Supabase)

---

## 🗂️ Estrutura de Tabelas

### 1. **clientes**
Armazena os contatos/clientes do sistema.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `nome` | VARCHAR(255) | Nome do cliente | NOT NULL |
| `telefone` | VARCHAR(20) | Número de telefone | NOT NULL |
| `email` | VARCHAR(255) | E-mail do cliente | NULL |
| `status` | VARCHAR(20) | Status do cliente | DEFAULT 'ativo', CHECK IN ('ativo', 'inativo') |
| `observacoes` | TEXT | Observações adicionais | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |
| `user_id` | UUID | ID do usuário proprietário | NOT NULL, FK → auth.users |

**Índices:**
- `idx_clientes_telefone` (telefone)
- `idx_clientes_user_id` (user_id)
- `idx_clientes_status` (status)
- `idx_clientes_created_at` (created_at DESC)
- `idx_clientes_nome_trgm` (nome) - busca de texto

**Relacionamentos:**
- Pertence a um usuário (`user_id` → `auth.users.id`)
- Pode ter vários disparos

---

### 2. **campanhas**
Armazena as campanhas de envio de mensagens.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `nome` | VARCHAR(255) | Nome da campanha | NOT NULL |
| `mensagem` | TEXT | Mensagem a ser enviada | NOT NULL |
| `destinatarios` | JSONB | Lista de destinatários | DEFAULT '[]' |
| `criterios` | JSONB | Critérios de segmentação | NULL |
| `configuracao` | JSONB | Configurações da campanha | NULL |
| `agendamento` | TIMESTAMP | Data/hora de agendamento | NULL |
| `status` | VARCHAR(50) | Status da campanha | DEFAULT 'rascunho', CHECK |
| `progresso` | JSONB | Progresso da campanha | DEFAULT '{}' |
| `relatorio` | JSONB | Relatório de envios | DEFAULT '{}' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |
| `user_id` | UUID | ID do usuário proprietário | NOT NULL, FK → auth.users |

**Status possíveis:**
- `rascunho` - Campanha em criação
- `agendada` - Campanha agendada
- `enviando` - Em processo de envio
- `concluida` - Envio concluído
- `pausada` - Campanha pausada
- `cancelada` - Campanha cancelada

**Índices:**
- `idx_campanhas_user_id` (user_id)
- `idx_campanhas_status` (status)
- `idx_campanhas_created_at` (created_at DESC)
- `idx_campanhas_agendamento` (agendamento) WHERE NOT NULL

**Relacionamentos:**
- Pertence a um usuário (`user_id` → `auth.users.id`)
- Tem vários disparos
- Tem vários lotes

---

### 3. **disparos**
Armazena os envios individuais de mensagens.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `campanha_id` | UUID | ID da campanha | NULL, FK → campanhas.id |
| `cliente_id` | UUID | ID do cliente | NULL, FK → clientes.id |
| `telefone` | VARCHAR(20) | Número de telefone | NOT NULL |
| `mensagem` | TEXT | Mensagem enviada | NOT NULL |
| `status` | VARCHAR(20) | Status do envio | DEFAULT 'pendente', CHECK |
| `resposta` | TEXT | Resposta recebida | NULL |
| `erro` | TEXT | Mensagem de erro | NULL |
| `instance_name` | VARCHAR(255) | Nome da instância usada | NULL |
| `agendamento` | TIMESTAMP | Data/hora agendada | NULL |
| `enviado_em` | TIMESTAMP | Data/hora do envio | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |
| `user_id` | UUID | ID do usuário proprietário | NOT NULL, FK → auth.users |

**Status possíveis:**
- `pendente` - Aguardando envio
- `enviando` - Em processo de envio
- `enviado` - Enviado com sucesso
- `entregue` - Entregue ao destinatário
- `lido` - Lido pelo destinatário
- `erro` - Erro no envio
- `falhou` - Falhou após tentativas

**Índices:**
- `idx_disparos_campanha_id` (campanha_id)
- `idx_disparos_user_id` (user_id)
- `idx_disparos_status` (status)
- `idx_disparos_telefone` (telefone)
- `idx_disparos_created_at` (created_at DESC)
- `idx_disparos_enviado_em` (enviado_em DESC) WHERE NOT NULL
- `idx_disparos_instance_name` (instance_name) WHERE NOT NULL

**Relacionamentos:**
- Pertence a uma campanha (`campanha_id` → `campanhas.id`)
- Pode referenciar um cliente (`cliente_id` → `clientes.id`)
- Pertence a um usuário (`user_id` → `auth.users.id`)

---

### 4. **lotes_campanha**
Armazena os lotes de processamento das campanhas.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `campanha_id` | UUID | ID da campanha | NOT NULL, FK → campanhas.id |
| `numero_lote` | INTEGER | Número do lote | NOT NULL |
| `clientes` | JSONB | Lista de clientes do lote | NOT NULL, DEFAULT '[]' |
| `status` | VARCHAR(50) | Status do lote | DEFAULT 'pendente', CHECK |
| `processado_at` | TIMESTAMP | Data/hora de processamento | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |

**Status possíveis:**
- `pendente` - Aguardando processamento
- `processando` - Em processamento
- `concluido` - Processado com sucesso
- `erro` - Erro no processamento

**Índices:**
- `idx_lotes_campanha_id` (campanha_id)
- `idx_lotes_status` (status)
- `idx_lotes_created_at` (created_at DESC)
- `idx_lotes_campanha_numero` (campanha_id, numero_lote) UNIQUE

**Relacionamentos:**
- Pertence a uma campanha (`campanha_id` → `campanhas.id`)

---

### 5. **evolution_configs**
Armazena as configurações da Evolution API por usuário.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID do usuário | NOT NULL, UNIQUE, FK → auth.users |
| `api_url` | TEXT | URL da Evolution API | NOT NULL |
| `global_api_key` | TEXT | Chave global da API | NOT NULL |
| `webhook_url` | TEXT | URL do webhook | NULL |
| `webhook_events` | JSONB | Eventos do webhook | DEFAULT '[]' |
| `auto_create` | BOOLEAN | Auto-criar instâncias | DEFAULT false |
| `qrcode_timeout` | INTEGER | Timeout do QR Code (segundos) | DEFAULT 60 |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |

**Índices:**
- `idx_evolution_configs_user_id` (user_id)

**Relacionamentos:**
- Pertence a um usuário (`user_id` → `auth.users.id`)
- Um usuário tem apenas uma configuração

---

### 6. **evolution_instances**
Armazena as instâncias WhatsApp criadas.

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID do usuário | NOT NULL, FK → auth.users |
| `instance_name` | VARCHAR(255) | Nome da instância | NOT NULL |
| `status` | VARCHAR(50) | Status da conexão | DEFAULT 'disconnected', CHECK |
| `phone_number` | VARCHAR(20) | Número do telefone | NULL |
| `profile_name` | VARCHAR(255) | Nome do perfil | NULL |
| `profile_picture_url` | TEXT | URL da foto de perfil | NULL |
| `qr_code` | TEXT | QR Code (base64) | NULL |
| `last_connected_at` | TIMESTAMP | Última conexão | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |

**Status possíveis:**
- `connected` - Conectado
- `disconnected` - Desconectado
- `connecting` - Conectando
- `error` - Erro

**Índices:**
- `idx_evolution_instances_user_id` (user_id)
- `idx_evolution_instances_instance_name` (instance_name)
- `idx_evolution_instances_status` (status)
- `idx_evolution_instances_user_instance` (user_id, instance_name) UNIQUE

**Relacionamentos:**
- Pertence a um usuário (`user_id` → `auth.users.id`)
- Um usuário pode ter várias instâncias
- Nome da instância deve ser único por usuário

---

### 7. **waha_config**
Armazena configuração global do WAHA (WhatsApp HTTP API).

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | INTEGER | Identificador único | PRIMARY KEY, DEFAULT 1, CHECK (id = 1) |
| `api_url` | TEXT | URL do servidor WAHA | NOT NULL |
| `api_key` | TEXT | Chave API do WAHA | NULL |
| `webhook_url` | TEXT | URL do webhook | NULL |
| `webhook_secret` | TEXT | Secret do webhook | NULL |
| `timeout` | INTEGER | Timeout em segundos | DEFAULT 30 |
| `retry_attempts` | INTEGER | Tentativas de retry | DEFAULT 3 |
| `rate_limit` | INTEGER | Limite de requisições/min | DEFAULT 100 |
| `enable_auto_reconnect` | BOOLEAN | Auto-reconectar | DEFAULT true |
| `enable_qr_code` | BOOLEAN | Habilitar QR Code | DEFAULT true |
| `enable_presence` | BOOLEAN | Habilitar presença | DEFAULT true |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT NOW(), AUTO-UPDATE |

**Observação:** Esta tabela tem apenas **um registro** (singleton) com `id = 1`.

**Índices:**
- `idx_waha_config_id` (id)

---

## 🔗 Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    ├── clientes (1:N)
    ├── campanhas (1:N)
    │   ├── disparos (1:N)
    │   └── lotes_campanha (1:N)
    ├── disparos (1:N)
    ├── evolution_configs (1:1)
    └── evolution_instances (1:N)

waha_config (Singleton - 1 registro global)
```

---

## 🔐 Segurança e Permissões

### Row Level Security (RLS)
**Status:** DESABILITADO para todas as tabelas

**Motivo:** Simplificação durante desenvolvimento. Em produção, considere habilitar RLS.

### Permissões Configuradas

| Tabela | authenticated | service_role | anon |
|--------|---------------|--------------|------|
| clientes | ALL | ALL | - |
| campanhas | ALL | ALL | - |
| disparos | ALL | ALL | - |
| lotes_campanha | ALL | ALL | - |
| evolution_configs | ALL | ALL | - |
| evolution_instances | ALL | ALL | - |
| waha_config | ALL | ALL | SELECT |

---

## ⚙️ Funções e Triggers

### Triggers
- **update_updated_at_column()**: Atualiza automaticamente `updated_at` em todas as tabelas relevantes

### Funções Estatísticas
1. **get_client_stats(user_uuid)**
   - Retorna estatísticas de clientes do usuário
   - Campos: total_clientes, clientes_ativos, clientes_inativos

2. **get_campaign_stats(user_uuid)**
   - Retorna estatísticas de campanhas do usuário
   - Campos: total_campanhas, campanhas_ativas, mensagens_enviadas, mensagens_pendentes

---

## 📝 Convenções Utilizadas

- **IDs:** UUID gerado automaticamente com `gen_random_uuid()`
- **Timestamps:** Sempre WITH TIME ZONE
- **Nomes:** snake_case para tabelas e colunas
- **Status:** VARCHAR com CHECK constraints para valores permitidos
- **JSON:** JSONB para melhor performance e indexação
- **Soft Delete:** Não implementado (DELETE CASCADE)

---

## 🚀 Como Usar Este Schema

### 1. Novo Servidor Supabase
Execute o arquivo completo:
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: supabase/DATABASE_COMPLETE.sql
```

### 2. Atualizar Servidor Existente
Não recomendado. Crie um novo servidor e migre os dados.

### 3. Backup
```bash
# Via Supabase Dashboard
# Settings > Database > Backups
```

---

## 📊 Estimativa de Tamanho

### Por 1000 Usuários Ativos
- clientes: ~100K registros (10 MB)
- campanhas: ~5K registros (2 MB)
- disparos: ~500K registros (200 MB)
- lotes_campanha: ~10K registros (5 MB)
- evolution_configs: ~1K registros (<1 MB)
- evolution_instances: ~3K registros (1 MB)
- waha_config: 1 registro (<1 KB)

**Total Estimado:** ~220 MB

---

## 🔧 Manutenção

### Limpeza Periódica
```sql
-- Remover disparos antigos (> 6 meses)
DELETE FROM public.disparos 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Remover campanhas concluídas antigas
DELETE FROM public.campanhas 
WHERE status = 'concluida' 
  AND created_at < NOW() - INTERVAL '1 year';
```

### Reindexação
```sql
-- Reindexar tabelas grandes
REINDEX TABLE public.disparos;
REINDEX TABLE public.campanhas;
```

### Vacuum
```sql
-- Limpar espaço
VACUUM ANALYZE public.disparos;
VACUUM ANALYZE public.campanhas;
```

---

## 📚 Referências

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Evolution API:** https://doc.evolution-api.com/
- **WAHA:** https://waha.devlike.pro/

---

## 📞 Suporte

Para dúvidas sobre o schema:
1. Consulte esta documentação
2. Veja o arquivo `DATABASE_COMPLETE.sql`
3. Verifique os tipos de dados no código da aplicação

---

**Última Atualização:** 28/10/2025  
**Versão do Schema:** 2.0  
**Compatibilidade:** PostgreSQL 14+ (Supabase)

