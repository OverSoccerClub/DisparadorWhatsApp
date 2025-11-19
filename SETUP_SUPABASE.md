# 🚀 Guia de Configuração do Supabase - Reinstalação

Este guia ajudará você a configurar o Supabase após uma reinstalação.

## 📋 Passo 1: Atualizar Variáveis de Ambiente

As credenciais do Supabase foram atualizadas no arquivo `.env.local`. Verifique se o arquivo contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.innovarecode.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

## 📋 Passo 2: Executar Script SQL

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.innovarecode.com.br
   - Faça login com suas credenciais

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New Query"**

3. **Execute o Script:**
   - Abra o arquivo `supabase/MIGRATION_COMPLETE.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifique o Resultado:**
   - O script deve executar sem erros
   - Você verá mensagens de confirmação para cada tabela criada
   - No final, verá uma lista de todas as tabelas criadas

### Opção 2: Via CLI do Supabase (Avançado)

Se você tem o Supabase CLI instalado:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Vincular ao projeto
supabase link --project-ref seu-project-ref

# Executar o script SQL
supabase db execute -f supabase/MIGRATION_COMPLETE.sql
```

## 📋 Passo 3: Verificar Configuração

Após executar o script SQL, verifique se tudo está funcionando:

```bash
# Executar diagnóstico
npm run check-supabase
```

Este comando verificará:
- ✅ Se as variáveis de ambiente estão configuradas
- ✅ Se a URL do Supabase é válida
- ✅ Se a conexão com o banco está funcionando
- ✅ Se o Service Role Key está correto

## 📋 Passo 4: Testar a Aplicação

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Teste o login:**
   - Acesse http://localhost:3000/auth
   - Tente fazer login ou criar uma nova conta
   - Se funcionar, o banco está configurado corretamente!

## ⚠️ Troubleshooting

### Erro: "Database error querying schema"
- **Causa:** O script SQL não foi executado ou foi executado parcialmente
- **Solução:** Execute o script SQL completo novamente no SQL Editor

### Erro: "permission denied for table"
- **Causa:** As permissões RLS (Row Level Security) não foram configuradas
- **Solução:** Certifique-se de executar TODO o script SQL, incluindo as seções de permissões

### Erro: "relation does not exist"
- **Causa:** Alguma tabela não foi criada
- **Solução:** Execute o script SQL novamente. O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar múltiplas vezes

### Erro: "invalid credentials"
- **Causa:** As credenciais no `.env.local` estão incorretas
- **Solução:** Verifique se copiou as credenciais corretas do dashboard do Supabase

## 📝 Estrutura do Banco de Dados

O script SQL cria as seguintes tabelas principais:

- ✅ `clientes` - Contatos/clientes do sistema
- ✅ `campanhas` - Campanhas de envio de mensagens
- ✅ `disparos` - Histórico de disparos
- ✅ `evolution_configs` - Configurações da Evolution API
- ✅ `evolution_instances` - Instâncias da Evolution API
- ✅ `waha_servers` - Servidores WAHA
- ✅ `waha_sessions` - Sessões WAHA
- ✅ `waha_dispatches` - Disparos via WAHA
- ✅ `telegram_bots` - Bots do Telegram
- ✅ `activation_codes` - Códigos de ativação
- ✅ `maturacao_schedules` - Agendamentos de maturação

## ✅ Checklist Final

- [ ] Arquivo `.env.local` atualizado com as novas credenciais
- [ ] Script SQL executado no SQL Editor do Supabase
- [ ] Diagnóstico executado (`npm run check-supabase`) sem erros
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Login testado com sucesso

## 🎉 Pronto!

Se todos os itens do checklist estiverem marcados, seu Supabase está configurado e pronto para uso!

