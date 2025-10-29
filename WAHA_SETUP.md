# 🚀 Configuração Rápida do WAHA

## ⚠️ IMPORTANTE: Verificar se o WAHA está rodando

Antes de usar o sistema de Sessões WAHA, você precisa ter o WAHA rodando. Siga os passos abaixo:

---

## 📦 Passo 1: Instalar e Executar o WAHA

### Opção A: Docker (Recomendado)

```bash
# Execute este comando no terminal
docker run -d -p 3000:3000 --name waha devlikeapro/waha
```

**⚠️ ATENÇÃO**: Se sua aplicação também roda na porta 3000, você precisa mudar a porta do WAHA:

```bash
# Executar WAHA na porta 3001
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

### Opção B: Docker com Persistência de Dados

```bash
# Com dados persistentes
docker run -d \
  -p 3001:3000 \
  -v $PWD/.waha:/app/.waha \
  --name waha \
  devlikeapro/waha
```

### Opção C: Docker com API Key (Mais Seguro)

```bash
# Com API Key para segurança
docker run -d \
  -p 3001:3000 \
  -e WHATSAPP_API_KEY=sua-chave-secreta \
  -v $PWD/.waha:/app/.waha \
  --name waha \
  devlikeapro/waha
```

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` ou `.env.local` na raiz do projeto:

```env
# Se WAHA está na porta 3001
WAHA_API_URL=http://localhost:3001

# Se configurou API Key
WAHA_API_KEY=sua-chave-secreta
```

**Se WAHA estiver na porta 3000 padrão:**
```env
WAHA_API_URL=http://localhost:3000
```

---

## ✅ Passo 3: Verificar se WAHA está Funcionando

### Teste no Navegador:
Abra: `http://localhost:3001/api/sessions`

Você deve ver uma resposta JSON (pode ser lista vazia `[]`)

### Teste no Terminal:
```bash
# Sem API Key
curl http://localhost:3001/api/sessions

# Com API Key
curl -H "X-Api-Key: sua-chave-secreta" http://localhost:3001/api/sessions
```

---

## 🔄 Passo 4: Reiniciar a Aplicação

Após configurar as variáveis de ambiente:

```bash
# Parar o servidor
# Pressione Ctrl+C no terminal

# Reiniciar
npm run dev
```

---

## 📊 Verificar Status do Docker

```bash
# Ver containers rodando
docker ps

# Ver logs do WAHA
docker logs waha

# Parar WAHA
docker stop waha

# Iniciar WAHA novamente
docker start waha

# Remover WAHA (se precisar reinstalar)
docker rm -f waha
```

---

## 🎯 Passo 5: Usar o Sistema

Agora você pode:

1. Acessar "Sessões WAHA" no menu lateral
2. Clicar em "Nova Sessão"
3. Criar sua primeira sessão
4. Escanear o QR Code com o WhatsApp

---

## ❌ Troubleshooting

### Erro: "Failed to load resource: 404"
**Causa**: Servidor não foi reiniciado após adicionar as rotas
**Solução**: Parar (Ctrl+C) e reiniciar `npm run dev`

### Erro: "Erro ao conectar com WAHA API"
**Causa**: WAHA não está rodando ou URL incorreta
**Solução**: 
1. Verificar se WAHA está rodando: `docker ps | grep waha`
2. Verificar URL no `.env`
3. Testar: `curl http://localhost:3001/api/sessions`

### Erro: "port 3000 already in use"
**Causa**: Porta já está sendo usada
**Solução**: Usar porta diferente para o WAHA:
```bash
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```
E atualizar `.env`:
```env
WAHA_API_URL=http://localhost:3001
```

### WAHA não cria sessão
**Solução**:
```bash
# Ver logs do WAHA
docker logs waha -f

# Reiniciar WAHA
docker restart waha
```

---

## 🌐 Para Produção

```env
# Use URL externa do WAHA
WAHA_API_URL=https://waha.seu-dominio.com
WAHA_API_KEY=sua-chave-super-secreta

# Configure SSL no WAHA
docker run -d \
  -p 3001:3000 \
  -e WHATSAPP_API_KEY=sua-chave-super-secreta \
  -v $PWD/.waha:/app/.waha \
  -v $PWD/ssl:/ssl \
  --name waha \
  devlikeapro/waha
```

---

## 📝 Comandos Úteis

```bash
# Instalar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# Verificar se está rodando
docker ps | grep waha

# Ver logs
docker logs waha -f

# Parar
docker stop waha

# Iniciar
docker start waha

# Reiniciar
docker restart waha

# Remover
docker rm -f waha

# Atualizar WAHA
docker pull devlikeapro/waha
docker rm -f waha
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

---

## 🎉 Pronto!

Agora você pode criar e gerenciar sessões do WhatsApp através da interface do sistema!

**Links Úteis:**
- Documentação WAHA: https://waha.devlike.pro/
- GitHub WAHA: https://github.com/devlikeapro/waha
- Integração JavaScript: https://waha.devlike.pro/docs/integrations/javascript/

