# 📝 Criar Workflow n8n - Passo a Passo Detalhado

## 🎯 Objetivo

Criar um workflow no n8n que recebe dados do sistema e envia código de ativação via WhatsApp.

---

## 🚀 Passo a Passo Completo

### **Passo 1: Acessar n8n**

1. Abra: `https://mass-connect-n8n.zk02fr.easypanel.host/`
2. Faça login no n8n

### **Passo 2: Criar Novo Workflow**

1. Clique em **"Workflows"** no menu lateral
2. Clique no botão **"+"** ou **"Add Workflow"**
3. Nomeie: `WhatsApp - Envio de Código de Ativação`

---

### **Passo 3: Adicionar Nó Webhook**

1. No canvas, clique em **"+"** ou arraste um nó
2. Procure por **"Webhook"** e selecione
3. Configure o nó Webhook:

   **Aba "Parameters":**
   - **HTTP Method:** `POST`
   - **Path:** `activation-code`
   - **Respond:** `When Last Node Finishes`
   - **Response Data:** `First Entry JSON`

   **Resultado:** O webhook estará pronto e mostrará uma URL como:
   ```
   https://mass-connect-n8n.zk02fr.easypanel.host/webhook/activation-code
   ```

---

### **Passo 4: Adicionar Nó Code (Processar Dados)**

1. Clique no **"+"** após o nó Webhook
2. Procure por **"Code"** e selecione
3. Renomeie para: `Processar Dados`
4. Na aba **"Code"**, cole este código:

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

5. Clique em **"Execute Node"** para testar (opcional)

---

### **Passo 5: Adicionar Nó IF (Escolher Provedor)**

1. Clique no **"+"** após o nó "Processar Dados"
2. Procure por **"IF"** e selecione
3. Renomeie para: `Escolher Provedor`
4. Configure:

   **Condition 1:**
   - **Value 1:** `={{ $env.WHATSAPP_PROVIDER || 'evolution' }}`
   - **Operation:** `equals`
   - **Value 2:** `evolution`

   Isso fará com que o workflow escolha entre Evolution API ou WAHA baseado na variável de ambiente.

---

### **Passo 6: Adicionar Nó HTTP Request (Evolution API)**

1. Clique no **"+"** na saída **TRUE** do nó IF
2. Procure por **"HTTP Request"** e selecione
3. Renomeie para: `Enviar via Evolution API`
4. Configure:

   **Aba "Parameters":**
   - **Method:** `POST`
   - **URL:** `={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE_NAME }}`
   
   **Aba "Authentication":**
   - **Authentication:** `Header Auth`
   - **Name:** `apikey`
   - **Value:** `={{ $env.EVOLUTION_API_KEY }}`
   
   **Aba "Body":**
   - **Send Body:** ✅ (marcado)
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

---

### **Passo 7: Adicionar Nó HTTP Request (WAHA)**

1. Clique no **"+"** na saída **FALSE** do nó IF
2. Procure por **"HTTP Request"** e selecione
3. Renomeie para: `Enviar via WAHA`
4. Configure:

   **Aba "Parameters":**
   - **Method:** `POST`
   - **URL:** `={{ $env.WAHA_API_URL }}/api/sendText`
   
   **Aba "Authentication":**
   - **Authentication:** `Header Auth`
   - **Name:** `Authorization`
   - **Value:** `Bearer {{ $env.WAHA_API_KEY }}`
   
   **Aba "Body":**
   - **Send Body:** ✅ (marcado)
   - **Body Content Type:** `JSON`
   - **JSON Body:**
   ```json
   {
     "session": "{{ $env.WAHA_SESSION_NAME }}",
     "chatId": "{{ $json.phone }}@c.us",
     "text": "{{ $json.message }}"
   }
   ```

---

### **Passo 8: Adicionar Nó Respond to Webhook**

1. Clique no **"+"** após o nó "Enviar via Evolution API"
2. Procure por **"Respond to Webhook"** e selecione
3. Renomeie para: `Resposta de Sucesso`
4. Configure:

   **Aba "Parameters":**
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

5. **IMPORTANTE:** Conecte também o nó "Enviar via WAHA" ao mesmo nó "Resposta de Sucesso"

---

### **Passo 9: Conectar Todos os Nós**

Verifique se as conexões estão assim:

```
[Webhook] 
    ↓
[Processar Dados]
    ↓
[Escolher Provedor]
    ├─ TRUE → [Enviar via Evolution API]
    └─ FALSE → [Enviar via WAHA]
    ↓
[Resposta de Sucesso] ← Ambos conectam aqui
```

**Para conectar:**
- Arraste da saída de um nó até a entrada do próximo
- Ou clique no nó e depois no próximo

---

### **Passo 10: Configurar Variáveis de Ambiente**

1. No n8n, vá em **Settings** (⚙️) > **Environment Variables**
2. Adicione as variáveis:

**Para usar Evolution API:**
```
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_INSTANCE_NAME=default
EVOLUTION_API_KEY=sua-api-key-aqui
```

**OU para usar WAHA:**
```
WHATSAPP_PROVIDER=waha
WAHA_API_URL=https://sua-waha.com
WAHA_SESSION_NAME=default
WAHA_API_KEY=seu-token-aqui
```

---

### **Passo 11: Salvar e Ativar Workflow**

1. Clique em **"Save"** (💾) no canto superior direito
2. Clique no botão **"Active"** (toggle) para ativar o workflow
3. **Copie a URL do webhook** que aparece no nó Webhook

---

### **Passo 12: Configurar no Sistema**

Adicione no `.env.local` do seu projeto:

```env
N8N_WEBHOOK_URL=https://mass-connect-n8n.zk02fr.easypanel.host/webhook/activation-code
```

**Substitua pela URL real do seu webhook!**

---

## 🧪 Testar o Workflow

### **1. Teste Manual no n8n**

1. Clique no nó **"Webhook"**
2. Clique em **"Test URL"** ou copie a URL
3. Use um cliente HTTP (Postman, Insomnia, ou curl):

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

### **2. Verificar Execução**

1. Vá em **"Executions"** no menu lateral
2. Verifique se a execução apareceu
3. Clique na execução para ver detalhes
4. Verifique se a mensagem foi enviada no WhatsApp

---

## ✅ Checklist Final

- [ ] Workflow criado e nomeado
- [ ] Nó Webhook configurado (POST, path: activation-code)
- [ ] Nó Code adicionado com código de processamento
- [ ] Nó IF configurado para escolher provedor
- [ ] Nó HTTP Request (Evolution API) configurado
- [ ] Nó HTTP Request (WAHA) configurado
- [ ] Nó Respond to Webhook configurado
- [ ] Todos os nós conectados corretamente
- [ ] Variáveis de ambiente configuradas
- [ ] Workflow salvo e ativado
- [ ] URL do webhook copiada
- [ ] URL adicionada no `.env.local`
- [ ] Teste realizado com sucesso

---

## 🐛 Troubleshooting

### **Webhook não recebe dados**
- Verifique se o workflow está **ativo**
- Verifique se o path está correto (`activation-code`)
- Verifique a URL completa

### **Erro ao processar dados**
- Verifique o código no nó Code
- Verifique se os dados estão chegando corretamente
- Use "Execute Node" para debugar

### **Erro ao enviar via Evolution API**
- Verifique se `EVOLUTION_API_URL` está correto
- Verifique se `EVOLUTION_INSTANCE_NAME` existe
- Verifique se `EVOLUTION_API_KEY` está válida
- Verifique se a instância está conectada

### **Erro ao enviar via WAHA**
- Verifique se `WAHA_API_URL` está correto
- Verifique se `WAHA_SESSION_NAME` existe
- Verifique se `WAHA_API_KEY` está válida
- Verifique se a sessão está ativa

---

## 📸 Estrutura Visual Esperada

```
┌─────────────┐
│   Webhook   │
│  (POST)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Processar   │
│   Dados     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Escolher    │
│  Provedor   │
└───┬─────┬───┘
    │     │
 TRUE│     │FALSE
    │     │
    ▼     ▼
┌─────┐ ┌─────┐
│ Evo │ │WAHA │
│ API │ │ API │
└──┬──┘ └──┬──┘
   │       │
   └───┬───┘
       │
       ▼
┌─────────────┐
│  Resposta   │
│   Sucesso   │
└─────────────┘
```

---

**Última Atualização:** 2025  
**Status:** ✅ Guia Completo - Siga os passos acima!

