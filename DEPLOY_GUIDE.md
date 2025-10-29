# 🚀 Guia de Deploy - Disparador WhatsApp

## 📋 Índice
1. [Requisitos](#requisitos)
2. [Novo Servidor Supabase](#novo-servidor-supabase)
3. [Configuração do Banco](#configuração-do-banco)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Deploy da Aplicação](#deploy-da-aplicação)
6. [Configurações Pós-Deploy](#configurações-pós-deploy)
7. [Verificação](#verificação)

---

## ✅ Requisitos

### Antes de Começar
- [ ] Conta no Supabase (https://supabase.com)
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Servidor WAHA ou Evolution API configurado

---

## 🗄️ Novo Servidor Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `disparador-whatsapp` (ou nome de sua escolha)
   - **Database Password:** Crie uma senha segura (anote!)
   - **Region:** Escolha a região mais próxima
   - **Pricing Plan:** Free (ou conforme necessidade)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos (criação do banco)

### Passo 2: Obter Credenciais

Na página do projeto, vá em **Settings > API**:

Anote estas informações:
- **Project URL:** `https://[seu-projeto].supabase.co`
- **anon/public key:** `eyJhbG...` (chave pública)
- **service_role key:** `eyJhbG...` (chave privada - NUNCA exponha!)

---

## 📊 Configuração do Banco

### Passo 1: Executar Schema Completo

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo: **`supabase/DATABASE_COMPLETE.sql`**
4. Copie **TODO o conteúdo** do arquivo
5. Cole no SQL Editor
6. Clique em **"Run"** ou pressione `Ctrl+Enter`
7. Aguarde ~30 segundos
8. Deve aparecer: ✅ **"BANCO DE DADOS PRONTO PARA USO!"**

### Verificação das Tabelas

Execute este SQL para verificar:

```sql
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Deve mostrar 7 tabelas:
- ✅ campanhas
- ✅ clientes
- ✅ disparos
- ✅ evolution_configs
- ✅ evolution_instances
- ✅ lotes_campanha
- ✅ waha_config

---

## 🔐 Variáveis de Ambiente

### Passo 1: Criar arquivo `.env.local`

Na raiz do projeto, crie/edite o arquivo `.env.local`:

```env
# ============================================================================
# SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...sua-chave-privada

# ============================================================================
# WAHA (WhatsApp HTTP API) - OPCIONAL
# ============================================================================
# Configure APENAS se usar WAHA
WAHA_API_URL=https://seu-servidor-waha.com
WAHA_API_KEY=sua-api-key-waha

# ============================================================================
# EVOLUTION API - OPCIONAL
# ============================================================================
# Configurado por usuário na interface (tabela evolution_configs)
# Não precisa variável de ambiente

# ============================================================================
# GEMINI API (Geração de Variações de Mensagens) - OPCIONAL
# ============================================================================
GEMINI_API_KEY=sua-chave-gemini-api

# ============================================================================
# NEXT.JS
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================================
# PRODUÇÃO (quando fizer deploy)
# ============================================================================
# NODE_ENV=production
# NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Passo 2: Não Commitar Credenciais

Verifique se `.env.local` está no `.gitignore`:

```bash
# Ver .gitignore
cat .gitignore | grep env.local

# Se não estiver, adicione:
echo ".env.local" >> .gitignore
```

---

## 🚀 Deploy da Aplicação

### Opção 1: Local (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Acessar
# http://localhost:3000
```

### Opção 2: Vercel (Recomendado para Produção)

1. **Criar conta na Vercel:**
   - Acesse: https://vercel.com
   - Faça login com GitHub

2. **Import do Projeto:**
   - Clique em **"New Project"**
   - Import seu repositório GitHub
   - Clique em **"Import"**

3. **Configurar Variáveis de Ambiente:**
   - Em **Environment Variables**, adicione:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `WAHA_API_URL` (se usar WAHA)
     - `WAHA_API_KEY` (se usar WAHA)
     - `GEMINI_API_KEY` (se usar Gemini)

4. **Deploy:**
   - Clique em **"Deploy"**
   - Aguarde ~2-3 minutos
   - Anote a URL: `https://seu-projeto.vercel.app`

### Opção 3: Docker

```bash
# Build da imagem
docker build -t disparador-whatsapp .

# Executar container
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name disparador-whatsapp \
  disparador-whatsapp

# Verificar
docker ps | grep disparador
docker logs disparador-whatsapp
```

---

## ⚙️ Configurações Pós-Deploy

### 1. Criar Primeiro Usuário

1. Acesse a aplicação
2. Vá em **"Cadastrar"** ou **"/auth/signup"**
3. Crie sua conta:
   - Email
   - Senha (mínimo 6 caracteres)
4. Confirme o email (verifique caixa de entrada)
5. Faça login

### 2. Configurar WAHA (Se Usar)

1. Acesse: **Configurações > WAHA**
2. Preencha:
   - **API URL:** `https://seu-servidor-waha.com`
   - **API Key:** (se tiver)
3. Clique em **"Testar Conexão"**
4. Se OK, clique em **"Salvar"**

**OU execute SQL diretamente:**

```sql
INSERT INTO public.waha_config (id, api_url, api_key)
VALUES (1, 'https://seu-servidor-waha.com', 'sua-key')
ON CONFLICT (id) DO UPDATE SET 
    api_url = EXCLUDED.api_url,
    api_key = EXCLUDED.api_key;
```

### 3. Configurar Evolution API

1. Acesse: **Configurações > Evolution API**
2. Preencha:
   - **URL da API:** `https://seu-servidor-evolution.com`
   - **API Key Global:** Sua chave da Evolution
3. Clique em **"Testar Conexão"**
4. Se OK, clique em **"Salvar"**

### 4. Criar Primeira Instância WhatsApp

**Via WAHA:**
1. Acesse: **Sessões WAHA**
2. Clique em **"Nova Sessão"**
3. Digite um nome: `whats-principal`
4. Clique em **"Criar Sessão"**
5. Escaneie o QR Code com WhatsApp

**Via Evolution:**
1. Acesse: **Dashboard**
2. Seção **"Instâncias Evolution"**
3. Clique em **"+ Criar Instância"**
4. Escaneie o QR Code com WhatsApp

---

## ✅ Verificação

### Checklist Pós-Deploy

- [ ] Aplicação acessível (URL funciona)
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Consegue criar clientes
- [ ] Consegue criar campanhas
- [ ] WAHA/Evolution configurado
- [ ] Instância WhatsApp conectada
- [ ] Consegue enviar mensagem de teste

### Teste Completo

1. **Criar Cliente:**
   - Vá em **Clientes**
   - Adicione um contato de teste
   - Verifique se aparece na lista

2. **Enviar Mensagem:**
   - Vá em **Disparos**
   - Clique em **"Novo Disparo"**
   - Selecione o cliente de teste
   - Digite uma mensagem
   - Envie
   - Verifique se chegou no WhatsApp

3. **Criar Campanha:**
   - Vá em **Campanhas**
   - Crie uma campanha de teste
   - Adicione destinatários
   - Envie
   - Acompanhe o progresso

---

## 🐛 Troubleshooting

### Erro: "Supabase connection failed"
**Solução:**
- Verifique as variáveis de ambiente
- Confirme Project URL e API Keys corretos
- Teste conexão: `curl https://[seu-projeto].supabase.co`

### Erro: "WAHA connection refused"
**Solução:**
- Verifique se o servidor WAHA está rodando
- Teste: `curl https://seu-servidor-waha.com/api/sessions`
- Verifique firewall/portas abertas

### Erro: "Table does not exist"
**Solução:**
- Execute novamente `DATABASE_COMPLETE.sql`
- Verifique se todas as 7 tabelas foram criadas
- SQL: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`

### Erro: "Permission denied"
**Solução:**
- Execute no Supabase SQL Editor:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

---

## 📚 Arquivos Importantes

| Arquivo | Uso |
|---------|-----|
| `supabase/DATABASE_COMPLETE.sql` | ⭐ Schema completo do banco |
| `DATABASE_DOCUMENTATION.md` | 📖 Documentação das tabelas |
| `DEPLOY_GUIDE.md` | 🚀 Este guia |
| `.env.local` | 🔐 Variáveis de ambiente (LOCAL) |
| `.env.example` | 📝 Exemplo de configuração |

---

## 📊 Monitoramento

### Logs no Vercel
```
https://vercel.com/[seu-usuario]/[seu-projeto]/deployments
```

### Logs no Supabase
```
Dashboard > Logs > API Logs
Dashboard > Logs > Database Logs
```

### Logs Docker
```bash
docker logs -f disparador-whatsapp
```

---

## 🔄 Atualização

### Deploy de Nova Versão

**Vercel (Automático):**
```bash
git add .
git commit -m "Nova versão"
git push origin main
# Vercel faz deploy automático
```

**Docker:**
```bash
# Rebuild
docker build -t disparador-whatsapp .

# Parar e remover antigo
docker stop disparador-whatsapp
docker rm disparador-whatsapp

# Iniciar novo
docker run -d -p 3000:3000 --env-file .env.local --name disparador-whatsapp disparador-whatsapp
```

---

## 📞 Suporte

- **Documentação do Banco:** `DATABASE_DOCUMENTATION.md`
- **Schema SQL:** `supabase/DATABASE_COMPLETE.sql`
- **Supabase Docs:** https://supabase.com/docs
- **Evolution API Docs:** https://doc.evolution-api.com/
- **WAHA Docs:** https://waha.devlike.pro/

---

## 🎉 Conclusão

Seu sistema **Disparador WhatsApp** está pronto para uso!

**Próximos passos:**
1. ✅ Adicione seus clientes
2. ✅ Configure mensagens
3. ✅ Crie campanhas
4. ✅ Monitore envios
5. ✅ Analise relatórios

---

**Versão:** 2.0  
**Última Atualização:** 28/10/2025  
**Compatibilidade:** Next.js 14+, Supabase, PostgreSQL 14+

