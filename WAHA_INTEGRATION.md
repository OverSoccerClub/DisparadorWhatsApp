# 📱 Guia de Integração WAHA - WhatsApp HTTP API

## 🎯 O que é WAHA?

**WAHA (WhatsApp HTTP API)** é uma solução open-source que permite conectar e gerenciar múltiplas sessões do WhatsApp através de uma API HTTP. É uma alternativa ao Evolution API e oferece recursos similares.

---

## ✨ Funcionalidades Implementadas

### 1. **Menu Lateral**
✅ Novo item "Sessões WAHA" no menu lateral
✅ Ícone de celular para fácil identificação

### 2. **Página de Gerenciamento**
✅ Listar todas as sessões WAHA
✅ Criar novas sessões
✅ Visualizar QR Code para autenticação
✅ Reiniciar sessões
✅ Excluir sessões
✅ Status em tempo real (atualiza a cada 5 segundos)

### 3. **API Routes Criadas**
✅ `GET /api/waha/sessions` - Listar sessões
✅ `POST /api/waha/sessions` - Criar sessão
✅ `GET /api/waha/sessions/[sessionName]` - Detalhes da sessão
✅ `DELETE /api/waha/sessions/[sessionName]` - Excluir sessão
✅ `GET /api/waha/sessions/[sessionName]/qr` - Obter QR Code
✅ `POST /api/waha/sessions/[sessionName]/restart` - Reiniciar sessão

---

## 🚀 Como Configurar o WAHA

### Opção 1: Usar WAHA em Docker (Recomendado)

```bash
# 1. Baixar e executar WAHA
docker run -d -p 3000:3000 --name waha devlikeapro/waha

# 2. Ou com persistência de dados
docker run -d \
  -p 3000:3000 \
  -v $PWD/.waha:/app/.waha \
  --name waha \
  devlikeapro/waha

# 3. Com API Key
docker run -d \
  -p 3000:3000 \
  -e WHATSAPP_API_KEY=seu-api-key-secreto \
  --name waha \
  devlikeapro/waha
```

### Opção 2: Docker Compose

Crie um arquivo `docker-compose.waha.yml`:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WHATSAPP_API_KEY=seu-api-key-secreto
    volumes:
      - waha_data:/app/.waha
    restart: unless-stopped

volumes:
  waha_data:
```

Execute:
```bash
docker-compose -f docker-compose.waha.yml up -d
```

---

## ⚙️ Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env` ou `.env.local`:

```env
# URL do WAHA API
WAHA_API_URL=http://localhost:3000

# API Key do WAHA (se configurado)
WAHA_API_KEY=seu-api-key-secreto
```

Para produção:
```env
# URL do WAHA API (produção)
WAHA_API_URL=https://waha.seu-dominio.com

# API Key do WAHA
WAHA_API_KEY=sua-chave-super-secreta
```

---

## 📋 Como Usar

### 1. **Acessar a Página**
- Clique em "Sessões WAHA" no menu lateral
- Ou acesse: `http://localhost:3000/waha-sessions`

### 2. **Criar Nova Sessão**
1. Clique em "Nova Sessão"
2. Digite um nome (ex: `minha-sessao`)
3. Clique em "Criar Sessão"
4. Se disponível, o QR Code será exibido automaticamente

### 3. **Conectar WhatsApp**
1. Abra o WhatsApp no seu celular
2. Vá em Configurações → Aparelhos conectados
3. Clique em "Conectar um aparelho"
4. Escaneie o QR Code exibido na tela

### 4. **Gerenciar Sessões**
- **Status Verde (Conectado)**: Sessão funcionando normalmente
- **Status Amarelo (Aguardando QR)**: Precisa escanear o QR Code
- **Status Azul (Iniciando)**: Sessão está sendo inicializada
- **Status Cinza (Parado)**: Sessão não está ativa
- **Status Vermelho (Erro)**: Problema na sessão

### 5. **Ações Disponíveis**
- **Ver QR**: Exibir QR Code novamente (quando aguardando)
- **Reiniciar**: Reiniciar a sessão (quando conectada)
- **Excluir**: Remover a sessão permanentemente

---

## 🔧 Integração com o Sistema

### Usar WAHA para Enviar Mensagens

As sessões WAHA podem ser usadas para enviar mensagens através da API:

```javascript
// Exemplo de envio de mensagem
const response = await fetch(`${WAHA_API_URL}/api/minha-sessao/sendText`, {
  method: 'POST',
  headers: {
    'X-Api-Key': WAHA_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatId: '5511999999999@c.us',
    text: 'Olá! Esta é uma mensagem de teste.'
  })
})
```

### Webhooks do WAHA

Configure webhooks para receber eventos:

```javascript
// Criar sessão com webhook
const response = await fetch('/api/waha/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'minha-sessao',
    config: {
      webhooks: [
        {
          url: 'https://seu-dominio.com/api/webhooks/waha',
          events: ['message', 'session.status']
        }
      ]
    }
  })
})
```

---

## 📊 Status das Sessões

### Possíveis Status:
- **STOPPED**: Sessão parada
- **STARTING**: Sessão iniciando
- **SCAN_QR_CODE**: Aguardando leitura do QR Code
- **WORKING**: Conectado e funcionando
- **FAILED**: Erro na sessão

---

## 🔒 Segurança

### Boas Práticas:
1. **Use API Key**: Sempre configure uma API Key forte
2. **HTTPS**: Use HTTPS em produção
3. **Firewall**: Restrinja acesso ao WAHA apenas do servidor da aplicação
4. **Backups**: Faça backup dos dados das sessões

### Exemplo de Configuração Segura:
```env
# API Key forte (32+ caracteres)
WAHA_API_KEY=sua-chave-super-secreta-com-minimo-32-caracteres

# URL segura (HTTPS)
WAHA_API_URL=https://waha.seu-dominio.com

# Webhook seguro
WAHA_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/waha
WAHA_WEBHOOK_SECRET=seu-secret-para-validar-webhooks
```

---

## 🆚 WAHA vs Evolution API

### Quando usar WAHA:
- ✅ Precisa de uma solução mais leve
- ✅ Prefere Docker oficial
- ✅ Quer API REST simples
- ✅ Múltiplas sessões em um único container

### Quando usar Evolution API:
- ✅ Precisa de recursos avançados
- ✅ Integração com outros serviços
- ✅ Recursos de agrupamento
- ✅ Já está usando Evolution API

---

## 📞 Endpoints Principais do WAHA

### Sessões:
- `GET /api/sessions` - Listar sessões
- `POST /api/sessions` - Criar sessão
- `GET /api/sessions/:session` - Detalhes da sessão
- `DELETE /api/sessions/:session` - Excluir sessão
- `POST /api/:session/restart` - Reiniciar sessão

### Autenticação:
- `GET /api/:session/auth/qr` - Obter QR Code
- `GET /api/:session/auth/me` - Dados do WhatsApp conectado

### Mensagens:
- `POST /api/:session/sendText` - Enviar texto
- `POST /api/:session/sendImage` - Enviar imagem
- `POST /api/:session/sendFile` - Enviar arquivo
- `GET /api/:session/messages` - Listar mensagens

---

## 🐛 Troubleshooting

### Problema: WAHA não conecta
**Solução:**
```bash
# Verificar se WAHA está rodando
docker ps | grep waha

# Ver logs
docker logs waha

# Reiniciar
docker restart waha
```

### Problema: QR Code não aparece
**Solução:**
- Aguarde alguns segundos após criar a sessão
- Clique em "Ver QR" novamente
- Verifique os logs do WAHA

### Problema: Sessão desconecta frequentemente
**Solução:**
- Verifique a conexão de internet
- Reinicie a sessão
- Recrie a sessão se necessário

---

## 📚 Recursos Adicionais

- **Documentação WAHA**: https://waha.devlike.pro/
- **GitHub WAHA**: https://github.com/devlikeapro/waha
- **Docker Hub**: https://hub.docker.com/r/devlikeapro/waha

---

## ✅ Checklist de Configuração

- [ ] WAHA instalado e rodando
- [ ] Variáveis de ambiente configuradas
- [ ] API Key configurada
- [ ] Menu "Sessões WAHA" visível
- [ ] Primeira sessão criada e testada
- [ ] QR Code escaneado com sucesso
- [ ] Mensagem de teste enviada

---

**🎉 Sistema de Sessões WAHA pronto para uso!**

Todas as funcionalidades existentes foram mantidas intactas, e a nova seção de Sessões WAHA foi integrada perfeitamente ao sistema.

