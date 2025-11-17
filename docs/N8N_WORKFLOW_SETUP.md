# 🚀 Configuração do Workflow n8n - Códigos de Ativação via WhatsApp

## 📋 Visão Geral

Este guia mostra como configurar o workflow n8n para receber códigos de ativação do sistema e enviá-los via WhatsApp usando Evolution API ou WAHA.

---

## 🔧 Método 1: Importar Workflow JSON (Recomendado)

### **1. Acessar n8n**

1. Acesse: `https://mass-connect-n8n.zk02fr.easypanel.host/`
2. Faça login no n8n

### **2. Importar Workflow**

1. Clique em **"Workflows"** no menu lateral
2. Clique em **"Import from File"** ou **"Import from URL"**
3. Selecione o arquivo: `n8n-workflows/whatsapp-activation-code.json`
4. Clique em **"Import"**

### **3. Configurar Variáveis de Ambiente**

No n8n, vá em **Settings > Environment Variables** e adicione:

**Para Evolution API:**
```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_INSTANCE_NAME=default
EVOLUTION_API_KEY=sua-api-key-aqui
WHATSAPP_PROVIDER=evolution
```

**Para WAHA:**
```env
WAHA_API_URL=https://sua-waha.com
WAHA_SESSION_NAME=default
WAHA_API_KEY=seu-token-aqui
WHATSAPP_PROVIDER=waha
```

### **4. Ativar Workflow**

1. Abra o workflow importado
2. Clique no botão **"Active"** no canto superior direito
3. Copie a URL do webhook (aparece no nó Webhook)

### **5. Configurar no Sistema**

Adicione a URL do webhook no `.env.local`:

```env
N8N_WEBHOOK_URL=https://mass-connect-n8n.zk02fr.easypanel.host/webhook/activation-code
```

---

## 🔧 Método 2: Criar Workflow Manualmente

### **Passo 1: Criar Novo Workflow**

1. Clique em **"Workflows"** > **"Add Workflow"**
2. Nomeie: `WhatsApp - Envio de Código de Ativação`

### **Passo 2: Adicionar Nó Webhook**

1. Arraste o nó **"Webhook"** para o canvas
2. Configure:
   - **HTTP Method:** `POST`
   - **Path:** `activation-code`
   - **Respond:** `When Last Node Finishes`
   - **Response Data:** `First Entry JSON`

### **Passo 3: Adicionar Nó Code (Processar Dados)**

1. Arraste o nó **"Code"** após o Webhook
2. Cole o código:

```javascript
// Extrair dados do webhook
const phone = $input.item.json.phone;
const message = $input.item.json.message;
const code = $input.item.json.code;
const name = $input.item.json.name;
const email = $input.item.json.email || '';

// Validar dados obrigatórios
if (!phone || !code) {
  throw new Error('Telefone e código são obrigatórios');
}

// Normalizar telefone (remover caracteres não numéricos, exceto +)
let normalizedPhone = phone.replace(/[^\d+]/g, '');

// Garantir formato internacional se necessário
if (normalizedPhone.length === 11 && !normalizedPhone.startsWith('+')) {
  // Número brasileiro: adicionar código do país
  normalizedPhone = `55${normalizedPhone}`;
}

// Retornar dados formatados
return {
  json: {
    phone: normalizedPhone,
    message: message,
    code: code,
    name: name || 'Usuário',
    email: email,
    originalPhone: phone
  }
};
```

### **Passo 4: Adicionar Nó IF (Escolher Provedor)**

1. Arraste o nó **"IF"** após o Code
2. Configure:
   - **Condition:** `{{ $env.WHATSAPP_PROVIDER || 'evolution' }} equals evolution`

### **Passo 5: Adicionar Nó HTTP Request (Evolution API)**

1. Arraste o nó **"HTTP Request"** na saída TRUE do IF
2. Configure:
   - **Method:** `POST`
   - **URL:** `={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE_NAME }}`
   - **Authentication:** `Header Auth`
   - **Header Name:** `apikey`
   - **Header Value:** `={{ $env.EVOLUTION_API_KEY }}`
   - **Send Body:** `Yes`
   - **Body Content Type:** `JSON`
   - **JSON Body:**
   ```json
   {
     "number": "{{ $json.phone }}",
     "text": "{{ $json.message }}",
     "delay": 1200,
     "linkPreview": false
   }
   ```

### **Passo 6: Adicionar Nó HTTP Request (WAHA)**

1. Arraste o nó **"HTTP Request"** na saída FALSE do IF
2. Configure:
   - **Method:** `POST`
   - **URL:** `={{ $env.WAHA_API_URL }}/api/sendText`
   - **Authentication:** `Header Auth`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer {{ $env.WAHA_API_KEY }}`
   - **Send Body:** `Yes`
   - **Body Content Type:** `JSON`
   - **JSON Body:**
   ```json
   {
     "session": "{{ $env.WAHA_SESSION_NAME }}",
     "chatId": "{{ $json.phone }}@c.us",
     "text": "{{ $json.message }}"
   }
   ```

### **Passo 7: Adicionar Nó Respond to Webhook**

1. Arraste o nó **"Respond to Webhook"** após ambos os HTTP Request
2. Configure:
   - **Respond With:** `JSON`
   - **Response Body:**
   ```json
   {
     "success": true,
     "message": "Código enviado com sucesso",
     "phone": "{{ $('Processar Dados').item.json.phone }}",
     "code": "{{ $('Processar Dados').item.json.code }}",
     "timestamp": "{{ $now }}"
   }
   ```

### **Passo 8: Conectar Todos os Nós**

Conecte os nós nesta ordem:
1. **Webhook** → **Code**
2. **Code** → **IF**
3. **IF (TRUE)** → **HTTP Request (Evolution)**
4. **IF (FALSE)** → **HTTP Request (WAHA)**
5. **HTTP Request (Evolution)** → **Respond to Webhook**
6. **HTTP Request (WAHA)** → **Respond to Webhook**

---

## 🧪 Testar o Workflow

### **1. Ativar o Workflow**

1. Clique no botão **"Active"** no canto superior direito
2. Copie a URL do webhook (aparece no nó Webhook)

### **2. Testar via cURL**

```bash
curl -X POST https://mass-connect-n8n.zk02fr.easypanel.host/webhook/activation-code \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "phone": "11987654321",
    "code": "123456",
    "email": "joao@example.com"
  }'
```

### **3. Verificar Execuções**

1. Vá em **"Executions"** no menu lateral
2. Verifique se a execução foi bem-sucedida
3. Verifique se a mensagem foi enviada no WhatsApp

---

## 🔍 Troubleshooting

### **Erro: "Webhook não encontrado"**

**Solução:**
- Verifique se o workflow está ativo
- Verifique se o path está correto (`activation-code`)
- Verifique a URL completa do webhook

### **Erro: "Variável de ambiente não encontrada"**

**Solução:**
- Configure as variáveis de ambiente no n8n
- Verifique os nomes das variáveis (case-sensitive)
- Reinicie o workflow após adicionar variáveis

### **Erro: "Falha ao enviar via Evolution API"**

**Solução:**
- Verifique se `EVOLUTION_API_URL` está correto
- Verifique se `EVOLUTION_INSTANCE_NAME` existe
- Verifique se `EVOLUTION_API_KEY` está válida
- Verifique se a instância está conectada

### **Erro: "Falha ao enviar via WAHA"**

**Solução:**
- Verifique se `WAHA_API_URL` está correto
- Verifique se `WAHA_SESSION_NAME` existe
- Verifique se `WAHA_API_KEY` está válida
- Verifique se a sessão está ativa

---

## 📊 Estrutura do Workflow

```
[Webhook] 
    ↓
[Code - Processar Dados]
    ↓
[IF - Escolher Provedor]
    ├─ TRUE → [HTTP Request - Evolution API]
    └─ FALSE → [HTTP Request - WAHA]
    ↓
[Respond to Webhook]
```

---

## 🔐 Segurança

### **Recomendações:**

1. **Autenticação no Webhook**
   - Adicione autenticação no nó Webhook (Query Auth, Header Auth)
   - Use tokens secretos

2. **Rate Limiting**
   - Configure rate limiting no n8n
   - Limite tentativas por IP/telefone

3. **Validação de Dados**
   - Valide formato do telefone
   - Valide código (6 dígitos)
   - Sanitize mensagens

4. **Logs**
   - Mantenha logs de execuções
   - Monitore falhas
   - Configure alertas

---

## 📚 Recursos Adicionais

- [Documentação n8n](https://docs.n8n.io/)
- [Webhooks no n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Evolution API](https://doc.evolution-api.com/)
- [WAHA](https://waha.devlike.pro/)

---

**Última Atualização:** 2025  
**Status:** ✅ Workflow Pronto para Importação

