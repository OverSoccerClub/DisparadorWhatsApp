# 📱 Integração n8n + WhatsApp - Códigos de Ativação

## 🎯 Visão Geral

Este sistema envia códigos de ativação de conta via WhatsApp usando n8n como intermediário. O fluxo funciona da seguinte forma:

1. **Usuário se registra** → Sistema gera código de 6 dígitos
2. **Sistema chama webhook n8n** → Envia dados (nome, telefone, código)
3. **n8n recebe dados** → Processa e envia mensagem via WhatsApp
4. **Usuário recebe código** → Digita código no sistema para ativar conta

---

## 🔧 Configuração

### **1. Importar/Criar Workflow no n8n**

**Opção A: Importar Workflow (Recomendado)**
- Arquivo: `n8n-workflows/whatsapp-activation-code.json`
- Veja instruções detalhadas em: [`N8N_WORKFLOW_SETUP.md`](./N8N_WORKFLOW_SETUP.md)

**Opção B: Criar Manualmente**
- Veja instruções passo a passo em: [`N8N_WORKFLOW_SETUP.md`](./N8N_WORKFLOW_SETUP.md)

### **2. Variável de Ambiente**

Após criar/importar o workflow, adicione no `.env.local`:

```env
N8N_WEBHOOK_URL=https://mass-connect-n8n.zk02fr.easypanel.host/webhook/activation-code
```

**Onde obter a URL:**
- Acesse: `https://mass-connect-n8n.zk02fr.easypanel.host/`
- Abra o workflow criado
- Ative o workflow
- Copie a URL do webhook (aparece no nó Webhook)
- Cole no `.env.local`

---

## 📋 Estrutura do Payload

O sistema envia para o n8n o seguinte JSON:

```json
{
  "phone": "5511987654321",
  "message": "Olá João! 👋\n\nSeu código de ativação é: *123456*\n\n...",
  "code": "123456",
  "name": "João Silva",
  "email": "joao@example.com",
  "type": "activation_code",
  "timestamp": "2025-01-XX..."
}
```

### **Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `phone` | string | Telefone formatado (ex: 5511987654321) |
| `message` | string | Mensagem completa formatada |
| `code` | string | Código de 6 dígitos |
| `name` | string | Nome do usuário |
| `email` | string | Email do usuário (opcional) |
| `type` | string | Sempre `"activation_code"` |
| `timestamp` | string | ISO timestamp da requisição |

---

## 🔄 Workflow n8n Recomendado

### **Estrutura do Workflow:**

```
[Webhook] → [Function (Processar)] → [WhatsApp] → [Response]
```

### **1. Nó Webhook**

- **Método:** POST
- **Path:** `/webhook/activation-code` (ou o que você preferir)
- **Response Mode:** Respond When Last Node Finishes

### **2. Nó Function (Opcional - Processar Dados)**

```javascript
// Extrair dados do webhook
const phone = $input.item.json.phone;
const message = $input.item.json.message;
const code = $input.item.json.code;
const name = $input.item.json.name;

// Validar dados
if (!phone || !code) {
  throw new Error('Telefone e código são obrigatórios');
}

// Retornar dados formatados para WhatsApp
return {
  json: {
    phone: phone,
    message: message,
    code: code,
    name: name
  }
};
```

### **3. Nó WhatsApp**

Configure conforme seu provedor de WhatsApp:

**Opções comuns:**
- **Evolution API** (via HTTP Request)
- **WAHA** (via HTTP Request)
- **WhatsApp Business API** (via HTTP Request)
- **WhatsApp Cloud API** (via HTTP Request)

**Exemplo com Evolution API:**

```javascript
// HTTP Request Node
Method: POST
URL: https://sua-evolution-api.com/message/sendText
Headers:
  - apikey: sua-api-key
Body (JSON):
{
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

**Exemplo com WAHA:**

```javascript
// HTTP Request Node
Method: POST
URL: https://sua-waha.com/api/sendText
Headers:
  - Authorization: Bearer seu-token
Body (JSON):
{
  "chatId": "{{ $json.phone }}@c.us",
  "text": "{{ $json.message }}"
}
```

### **4. Nó Response**

```json
{
  "success": true,
  "message": "Código enviado com sucesso",
  "phone": "{{ $json.phone }}"
}
```

---

## 🧪 Testando o Webhook

### **1. Teste Manual via cURL**

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/send-activation-code \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "phone": "11987654321",
    "code": "123456",
    "email": "joao@example.com"
  }'
```

### **2. Teste no n8n**

1. Ative o workflow no n8n
2. Faça um registro de teste no sistema
3. Verifique se o webhook foi chamado
4. Verifique se a mensagem foi enviada via WhatsApp

---

## 📱 Formato da Mensagem WhatsApp

A mensagem enviada segue este formato:

```
Olá [Nome]! 👋

Seu código de ativação é: *[CÓDIGO]*

Use este código para ativar sua conta no Fluxus Message.

Este código expira em 24 horas.

_Se você não solicitou este código, ignore esta mensagem._
```

**Exemplo:**

```
Olá João Silva! 👋

Seu código de ativação é: *123456*

Use este código para ativar sua conta no Fluxus Message.

Este código expira em 24 horas.

_Se você não solicitou este código, ignore esta mensagem._
```

---

## 🔒 Segurança

### **Recomendações:**

1. **Autenticação no Webhook n8n**
   - Adicione autenticação no n8n (API Key, Basic Auth, etc.)
   - Valide a origem das requisições

2. **Rate Limiting**
   - Configure rate limiting no n8n
   - Limite tentativas de envio por telefone

3. **Validação de Dados**
   - Valide formato do telefone
   - Valide código (6 dígitos numéricos)
   - Sanitize dados antes de enviar

4. **Logs**
   - Mantenha logs de envios
   - Monitore falhas
   - Alerte em caso de problemas

---

## 🐛 Troubleshooting

### **Erro: "N8N_WEBHOOK_URL não configurada"**

**Solução:**
- Adicione `N8N_WEBHOOK_URL` no `.env.local`
- Reinicie o servidor

### **Erro: "n8n retornou status 404"**

**Solução:**
- Verifique se a URL do webhook está correta
- Verifique se o workflow está ativo no n8n
- Teste o webhook manualmente

### **Erro: "Erro ao conectar com n8n"**

**Solução:**
- Verifique conectividade de rede
- Verifique se o n8n está acessível
- Verifique firewall/proxy

### **Código não chega no WhatsApp**

**Solução:**
- Verifique logs do n8n
- Verifique configuração do nó WhatsApp
- Teste envio manual no n8n
- Verifique se o número está correto

---

## 📊 Monitoramento

### **Logs do Sistema**

O sistema registra:
- ✅ Sucesso: `Código enviado via WhatsApp com sucesso`
- ❌ Erro: `Erro ao enviar código via WhatsApp`
- ⚠️ Aviso: `N8N_WEBHOOK_URL não configurada`

### **Métricas Recomendadas**

- Taxa de sucesso de envios
- Tempo médio de entrega
- Taxa de falhas
- Códigos não utilizados

---

## 🚀 Próximos Passos

1. ✅ Configure o webhook no n8n
2. ✅ Adicione `N8N_WEBHOOK_URL` no `.env.local`
3. ✅ Teste o registro de um usuário
4. ✅ Verifique recebimento no WhatsApp
5. ✅ Configure monitoramento e alertas

---

## 📚 Recursos Adicionais

- [Documentação n8n](https://docs.n8n.io/)
- [Webhooks no n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Evolution API](https://doc.evolution-api.com/)
- [WAHA](https://waha.devlike.pro/)

---

**Última Atualização:** 2025  
**Status:** ✅ Sistema Implementado - Aguardando Configuração do n8n

