# 🔧 Como Atualizar o Arquivo .env.local

## 📋 Passo 1: Criar/Atualizar o arquivo .env.local

Crie ou edite o arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# ============================================================================
# VARIÁVEIS DE AMBIENTE PARA DESENVOLVIMENTO
# ============================================================================

NODE_ENV=development

# ============================================================================
# CONFIGURAÇÕES DO SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://supabase.innovarecode.com.br

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# ============================================================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================================
# CONFIGURAÇÕES DO N8N (OPCIONAL)
# ============================================================================
N8N_WEBHOOK_URL=your_n8n_webhook_url_here

# ============================================================================
# CONFIGURAÇÕES DE EMAIL (OPCIONAL)
# ============================================================================
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# ============================================================================
# CONFIGURAÇÕES DO GEMINI AI (OPCIONAL)
# ============================================================================
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================================================
# CONFIGURAÇÕES DO REDIS (OPCIONAL)
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# CONFIGURAÇÕES DE LOGS
# ============================================================================
LOG_LEVEL=3
LOG_FORMAT=text
```

## 📝 Passo 2: Executar o Script SQL no Supabase

### Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.innovarecode.com.br
   - Faça login com suas credenciais

2. **Navegue até o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Ou acesse diretamente: https://supabase.innovarecode.com.br/project/_/sql

3. **Crie uma nova query:**
   - Clique no botão **"New query"** ou **"Nova consulta"**

4. **Copie e cole o conteúdo do arquivo SQL:**
   - Abra o arquivo: `supabase/MIGRATION_COMPLETE.sql`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   - Cole no SQL Editor do Supabase (Ctrl+V)

5. **Execute o script:**
   - Clique no botão **"Run"** ou **"Executar"**
   - Aguarde a execução completar (pode levar alguns minutos)

6. **Verifique o resultado:**
   - Você deve ver mensagens de sucesso para cada tabela criada
   - No final, deve aparecer: `✅ MIGRAÇÃO COMPLETA - SCHEMA V3.0 CRIADO COM SUCESSO!`

## ✅ Passo 3: Verificar a Configuração

Após executar o SQL, verifique se tudo está funcionando:

```bash
npm run check-supabase
```

Este script irá:
- ✅ Verificar se as variáveis de ambiente estão configuradas
- ✅ Testar a conexão com o Supabase
- ✅ Verificar se o banco de dados está acessível
- ✅ Validar as credenciais

## 🚀 Passo 4: Testar o Sistema

Após configurar tudo:

```bash
npm run dev
```

Acesse http://localhost:3000/auth e tente fazer login.

## 📊 Tabelas que serão criadas

O script `MIGRATION_COMPLETE.sql` cria as seguintes tabelas:

1. **clientes** - Contatos/clientes do sistema
2. **campanhas** - Campanhas de envio de mensagens
3. **disparos** - Envios individuais de mensagens
4. **lotes_campanha** - Lotes de envio por campanha
5. **evolution_configs** - Configurações da Evolution API
6. **evolution_instances** - Instâncias da Evolution API
7. **waha_servers** - Servidores WAHA configurados
8. **waha_sessions** - Sessões WAHA ativas
9. **waha_campaigns** - Campanhas WAHA
10. **waha_campaign_contacts** - Contatos das campanhas WAHA
11. **waha_dispatches** - Disparos WAHA
12. **waha_session_stats** - Estatísticas das sessões WAHA
13. **waha_config** - Configurações gerais do WAHA
14. **telegram_bots** - Bots do Telegram configurados
15. **activation_codes** - Códigos de ativação de usuários
16. **maturacao_schedules** - Agendamentos de maturação de chips

## ⚠️ Importante

- **Não execute o script duas vezes** - Ele usa `CREATE TABLE IF NOT EXISTS`, mas pode gerar erros se as tabelas já existirem
- **Faça backup** - Se você já tem dados no banco, faça backup antes de executar
- **Verifique permissões** - O script configura RLS (Row Level Security) e permissões adequadas

## 🐛 Troubleshooting

### Erro: "permission denied"
- Verifique se você está usando a `SUPABASE_SERVICE_ROLE_KEY` correta
- Certifique-se de que tem permissões de administrador no projeto

### Erro: "relation already exists"
- Algumas tabelas já existem - isso é normal se você executar o script novamente
- O script usa `IF NOT EXISTS`, então deve ser seguro executar novamente

### Erro: "extension does not exist"
- O script tenta criar extensões (`uuid-ossp`, `pg_trgm`)
- Se der erro, você pode precisar de permissões de superusuário
- Contate o administrador do Supabase se necessário

