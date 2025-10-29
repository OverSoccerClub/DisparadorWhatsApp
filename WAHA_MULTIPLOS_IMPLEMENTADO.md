# Sistema de Múltiplos Servidores WAHA - Implementado ✅

## Visão Geral

O sistema foi atualizado para suportar **múltiplos servidores WAHA por usuário**, permitindo que cada usuário configure e gerencie vários servidores WAHA remotos para distribuição de carga e redundância.

## Arquitetura Implementada

### 1. Estrutura do Banco de Dados

**Tabela: `waha_servers`**

```sql
CREATE TABLE IF NOT EXISTS public.waha_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit INTEGER DEFAULT 100,
    prioridade INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 10,
    sessions_ativas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Principais campos:**
- `nome`: Identificador amigável do servidor
- `api_url`: URL da API WAHA remota
- `ativo`: Status do servidor (ativo/inativo)
- `prioridade`: Prioridade de uso (maior = mais prioritário)
- `max_sessions`: Capacidade máxima do servidor
- `sessions_ativas`: Contador de sessões ativas

### 2. Componentes Criados/Atualizados

#### `components/WahaServersManager.tsx` (NOVO)
Gerenciador completo de servidores WAHA com interface moderna:

**Funcionalidades:**
- ✅ Listar servidores configurados
- ✅ Adicionar novo servidor
- ✅ Editar servidor existente
- ✅ Excluir servidor
- ✅ Testar conexão individual
- ✅ Visualizar status e métricas em tempo real
- ✅ Modal de edição/criação completo
- ✅ Validações de formulário
- ✅ Feedback visual (status, tempo de resposta, instâncias ativas)

#### `components/ConfiguracoesPage.tsx` (ATUALIZADO)
- Substituída seção WAHA monolítica pelo novo componente `WahaServersManager`
- Removido estado antigo `wahaConfig` (configuração única)
- Adicionado import do novo componente
- Interface mais limpa e modular

### 3. APIs Implementadas

#### `POST /api/config/waha`
Cria ou atualiza um servidor WAHA.

**Request Body:**
```json
{
  "id": "uuid-opcional",
  "user_id": "uuid-obrigatorio",
  "name": "Nome do Servidor",
  "apiUrl": "https://waha.example.com",
  "apiKey": "optional-key",
  "webhookUrl": "https://yourapi.com/webhook",
  "webhookSecret": "secret",
  "timeout": 30,
  "retryAttempts": 3,
  "rateLimit": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Servidor WAHA criado/atualizado com sucesso",
  "data": { /* dados do servidor */ }
}
```

#### `GET /api/config/waha/list`
Lista todos os servidores WAHA do usuário autenticado.

**Response:**
```json
{
  "success": true,
  "servers": [
    {
      "id": "uuid",
      "name": "WAHA Servidor 1",
      "apiUrl": "https://waha1.example.com",
      "apiKey": "***",
      "webhookUrl": "https://yourapi.com/webhook",
      "timeout": 30,
      "retryAttempts": 3,
      "rateLimit": 100,
      "enableAutoReconnect": true,
      "enableQrCode": true,
      "enablePresence": true
    }
  ]
}
```

#### `DELETE /api/config/waha?id={uuid}`
Exclui um servidor WAHA.

**Response:**
```json
{
  "success": true,
  "message": "Servidor WAHA excluído com sucesso"
}
```

#### `POST /api/config/waha/test`
Testa conexão com servidor WAHA específico (mantida, funciona com qualquer servidor).

### 4. Esquema SQL Completo

O arquivo `supabase/DATABASE_COMPLETE_V2.sql` contém o schema completo incluindo:

- ✅ Tabela `waha_servers`
- ✅ Tabela `waha_sessions` (para rastrear sessões por servidor)
- ✅ Índices otimizados
- ✅ RLS (Row Level Security) policies
- ✅ Triggers para atualização automática de `updated_at`
- ✅ Função `get_available_waha_server()` para load balancing

## Fluxo de Uso

### 1. Configurar Servidores WAHA

1. Acessar `/configuracoes`
2. Na seção "Servidores WAHA", clicar em "Adicionar Servidor"
3. Preencher:
   - Nome (ex: "WAHA Servidor 1")
   - URL da API (ex: `https://waha1.example.com`)
   - API Key (opcional)
   - Configurações avançadas (timeout, retry, rate limit)
4. Clicar em "Salvar"
5. Testar conexão clicando no botão "Testar Conexão"

### 2. Gerenciar Servidores

**Editar:**
- Clicar no ícone de lápis no card do servidor
- Modificar configurações
- Salvar

**Excluir:**
- Clicar no ícone de lixeira
- Confirmar exclusão

**Testar:**
- Clicar em "Testar Conexão" no card
- Visualizar métricas: tempo de resposta, instâncias ativas, etc.

### 3. Usar em Campanhas (Próxima Etapa)

O sistema de campanhas/disparos será atualizado para:
1. Buscar servidor disponível via `get_available_waha_server()`
2. Distribuir carga entre servidores
3. Fazer failover automático se um servidor ficar indisponível

## Migrações

### Para Novos Projetos
Execute `supabase/DATABASE_COMPLETE_V2.sql` em um banco Supabase limpo.

### Para Projetos Existentes
Se você já tem a tabela `waha_config` (versão antiga):

```sql
-- 1. Migrar dados existentes (se necessário)
INSERT INTO public.waha_servers (user_id, nome, api_url, api_key, webhook_url, webhook_secret, timeout, retry_attempts, rate_limit)
SELECT 
    user_id,
    'WAHA Principal' as nome,
    api_url,
    api_key,
    webhook_url,
    webhook_secret,
    timeout,
    retry_attempts,
    rate_limit
FROM public.waha_config;

-- 2. Remover tabela antiga (CUIDADO: backup antes!)
DROP TABLE IF EXISTS public.waha_config;
```

## Benefícios da Nova Arquitetura

1. **Escalabilidade**: Adicione quantos servidores WAHA precisar
2. **Load Balancing**: Distribua carga automaticamente
3. **Redundância**: Failover automático se um servidor falhar
4. **Isolamento**: Cada usuário gerencia seus próprios servidores
5. **Priorização**: Defina prioridades entre servidores
6. **Monitoramento**: Métricas em tempo real de cada servidor
7. **Flexibilidade**: Configure diferentes servidores para diferentes propósitos

## Próximos Passos

- [ ] Integrar sistema de disparos para usar múltiplos servidores
- [ ] Implementar dashboard de monitoramento de servidores
- [ ] Adicionar alertas quando servidor ficar offline
- [ ] Implementar histórico de uso por servidor
- [ ] Criar relatórios de performance por servidor

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **UI Components**: Heroicons

## Notas Importantes

- ⚠️ Certifique-se de executar `DATABASE_COMPLETE_V2.sql` no seu banco Supabase
- ⚠️ Todos os servidores WAHA devem estar acessíveis via HTTPS para produção
- ⚠️ Recomenda-se usar API Keys para segurança adicional
- ⚠️ Configure Webhooks para receber eventos em tempo real dos servidores WAHA

## Suporte

Para problemas ou dúvidas, verifique:
1. Console do navegador para erros de frontend
2. Logs do Supabase para erros de backend
3. Documentação oficial do WAHA: https://waha.devlike.pro

---

**Versão:** 2.1  
**Data:** Outubro 2025  
**Status:** ✅ Implementado e Testado

