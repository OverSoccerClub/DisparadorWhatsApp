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

