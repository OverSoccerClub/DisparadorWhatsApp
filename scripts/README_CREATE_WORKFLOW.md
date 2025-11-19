# 🚀 Criar Workflow n8n via Script

## ⚡ Método Rápido (Recomendado)

### **1. Obter API Key do n8n**

1. Acesse: `https://mass-connect-n8n.zk02fr.easypanel.host/`
2. Vá em **Settings** (⚙️) > **API**
3. Clique em **"Create API Key"**
4. Copie a API Key gerada

### **2. Executar Script**

**Windows PowerShell:**
```powershell
$env:N8N_API_URL="https://mass-connect-n8n.zk02fr.easypanel.host"
$env:N8N_API_KEY="sua-api-key-aqui"
node scripts/create-n8n-workflow.js
```

**Linux/Mac:**
```bash
export N8N_API_URL="https://mass-connect-n8n.zk02fr.easypanel.host"
export N8N_API_KEY="sua-api-key-aqui"
node scripts/create-n8n-workflow.js
```

**Ou edite o script diretamente:**

1. Abra: `scripts/create-n8n-workflow.js`
2. Altere as linhas 10-11:
   ```javascript
   const N8N_API_URL = 'https://mass-connect-n8n.zk02fr.easypanel.host';
   const N8N_API_KEY = 'sua-api-key-aqui';
   ```
3. Execute: `node scripts/create-n8n-workflow.js`

---

## ✅ O Que o Script Faz

1. ✅ Cria workflow completo no n8n
2. ✅ Configura webhook (POST, path: activation-code)
3. ✅ Adiciona nó Code para processar dados
4. ✅ Adiciona nó HTTP Request para Evolution API
5. ✅ Adiciona nó Respond to Webhook
6. ✅ Conecta todos os nós
7. ✅ Retorna URL do webhook

---

## 📋 Após Executar o Script

### **1. Configurar Variáveis de Ambiente no n8n**

No n8n, vá em **Settings > Environment Variables** e adicione:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_INSTANCE_NAME=default
EVOLUTION_API_KEY=sua-api-key
```

### **2. Ativar Workflow**

1. Abra o workflow criado no n8n
2. Clique no botão **"Active"** (toggle)
3. Copie a URL do webhook

### **3. Configurar no Sistema**

Adicione no `.env.local`:

```env
N8N_WEBHOOK_URL=https://mass-connect-n8n.zk02fr.easypanel.host/webhook/SEU_WEBHOOK_ID
```

*(Substitua SEU_WEBHOOK_ID pela URL real retornada pelo script)*

---

## 🧪 Testar

```bash
curl -X POST https://mass-connect-n8n.zk02fr.easypanel.host/webhook/SEU_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "phone": "11987654321",
    "code": "123456",
    "email": "joao@example.com"
  }'
```

---

## 🐛 Troubleshooting

### **Erro: "Failed to authenticate"**
- Verifique se a API Key está correta
- Verifique se copiou a API Key completa

### **Erro: "ECONNREFUSED"**
- Verifique se a URL do n8n está correta
- Verifique se o servidor n8n está acessível

### **Erro: "Cannot find module"**
- Execute: `npm install` no diretório do projeto

---

**Última Atualização:** 2025  
**Status:** ✅ Script Pronto para Usar




# Waha
WAHA_API_KEY=051d8e33d2584e73a10b13ac6c51ee7f
WAHA_API_KEY_PLAIN=alguma_chave_secreta
WAHA_APPS_ENABLED=true
WAHA_BACKEND_ENGINE=gows
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=d8a15fd9bd4044b3aade8979c521f6e0
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=d8a15fd9bd4044b3aade8979c521f6e0

# Configuração Redis (USE APENAS ESTA FORMA)
REDIS_URL=redis://:2fe89a68ec3c2f6c51dd@redis:6379

############
# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
############

POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated
SECRET_KEY_BASE=UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
VAULT_ENC_KEY=your-encryption-key-32-chars-min
NEXT_PUBLIC_SUPABASE_URL=https://supabase.innovarecode.com.br

############
# Database - You can change these to any PostgreSQL database that has logical replication enabled.
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
# default user is postgres


############
# Supavisor -- Database pooler
############
# Port Supavisor listens on for transaction pooling connections
POOLER_PROXY_PORT_TRANSACTION=6543
# Maximum number of PostgreSQL connections Supavisor opens per pool
POOLER_DEFAULT_POOL_SIZE=20
# Maximum number of client connections Supavisor accepts per pool
POOLER_MAX_CLIENT_CONN=100
# Unique tenant identifier
POOLER_TENANT_ID=your-tenant-id
# Pool size for internal metadata storage used by Supavisor
# This is separate from client connections and used only by Supavisor itself
POOLER_DB_POOL_SIZE=5


############
# API Proxy - Configuration for the Kong Reverse proxy.
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443
KONG_HOST=supabase.innovarecode.com.br
KONG_PROXY_SSL_ENABLED=true

############
# API - Configuration for PostgREST.
############

PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth - Configuration for the GoTrue authentication server.
############

## General
SITE_URL=https://supabase.innovarecode.com.br
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://supabase.innovarecode.com.br

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

## Phone auth
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true


############
# Studio - Configuration for the Dashboard
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project

STUDIO_PORT=3000
# replace if you intend to use Studio outside of localhost
SUPABASE_PUBLIC_URL=https://supabase.innovarecode.com.br

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Add your OpenAI API key to enable SQL Editor Assistant
OPENAI_API_KEY=


############
# Functions - Configuration for Functions
############
# NOTE: VERIFY_JWT applies to all functions. Per-function VERIFY_JWT is not supported yet.
FUNCTIONS_VERIFY_JWT=false


############
# Logs - Configuration for Analytics
# Please refer to https://supabase.com/docs/reference/self-hosting-analytics/introduction
############

# Change vector.toml sinks to reflect this change
# these cannot be the same value
LOGFLARE_PUBLIC_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-public
LOGFLARE_PRIVATE_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-private

# Docker socket location - this value will differ depending on your OS
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# Google Cloud Project details
GOOGLE_PROJECT_ID=GOOGLE_PROJECT_ID
GOOGLE_PROJECT_NUMBER=GOOGLE_PROJECT_NUMBER
