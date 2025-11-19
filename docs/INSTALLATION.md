# Guia de Instalação - Fluxus Message

## 🚀 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd whatsapp-dispatcher
```

### 2. Execute o Setup Automático
```bash
npm run setup
```

### 3. Configure as Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_CODE_PATH=./public/qr-code.png

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o SQL em `supabase/schema.sql` no SQL Editor
4. Copie as credenciais para o arquivo `.env.local`

### 5. Instale e Configure o Redis

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Windows:
1. Baixe o Redis for Windows
2. Extraia e execute `redis-server.exe`

### 6. Execute a Aplicação
```bash
npm run dev
```

Acesse `http://localhost:3000`

## 🐳 Instalação com Docker

### 1. Clone e Configure
```bash
git clone <repository-url>
cd whatsapp-dispatcher
cp .env.example .env.local
# Edite o .env.local com suas credenciais
```

### 2. Execute com Docker Compose
```bash
npm run docker:run
```

### 3. Acesse a Aplicação
Acesse `http://localhost:3000`

## 🔧 Configuração Avançada

### Configuração do Supabase

1. **Criar Projeto**:
   - Acesse [supabase.com](https://supabase.com)
   - Clique em "New Project"
   - Escolha organização e nome do projeto

2. **Configurar Banco de Dados**:
   - Vá para "SQL Editor"
   - Execute o conteúdo de `supabase/schema.sql`
   - Verifique se as tabelas foram criadas

3. **Configurar Autenticação**:
   - Vá para "Authentication" > "Settings"
   - Configure as políticas de RLS se necessário

### Configuração do Redis

Para produção, configure o Redis com persistência:

```bash
# Edite o arquivo redis.conf
sudo nano /etc/redis/redis.conf

# Adicione ou descomente:
save 900 1
save 300 10
save 60 10000

# Reinicie o Redis
sudo systemctl restart redis-server
```

### Configuração do WhatsApp

1. **Primeira Conexão**:
   - Acesse a plataforma
   - Vá para "Configurações"
   - Escaneie o QR Code com seu WhatsApp
   - Aguarde a confirmação

2. **Manutenção**:
   - A sessão é salva automaticamente
   - Reconexão automática em caso de queda
   - QR Code regenerado quando necessário

## 🚀 Deploy em Produção

### Vercel (Recomendado)

1. **Instalar Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configurar Variáveis**:
   - Acesse o dashboard da Vercel
   - Vá para "Settings" > "Environment Variables"
   - Adicione todas as variáveis do `.env.local`

### Docker em Produção

1. **Build da Imagem**:
```bash
npm run docker:build
```

2. **Configurar Docker Compose para Produção**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis_data:
```

3. **Execute**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Verificação da Instalação

### Checklist de Verificação

- [ ] Node.js 18+ instalado
- [ ] Redis rodando e acessível
- [ ] Supabase configurado e conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação iniciando sem erros
- [ ] WhatsApp conectando corretamente
- [ ] Filas processando mensagens

### Comandos de Verificação

```bash
# Verificar Node.js
node --version

# Verificar Redis
redis-cli ping

# Verificar dependências
npm list

# Verificar build
npm run build

# Verificar lint
npm run lint
```

## 🆘 Solução de Problemas

### Problemas Comuns

1. **Erro de Conexão com Redis**:
   - Verifique se o Redis está rodando: `redis-cli ping`
   - Verifique a URL no `.env.local`

2. **Erro de Conexão com Supabase**:
   - Verifique as credenciais no `.env.local`
   - Teste a conexão no dashboard do Supabase

3. **WhatsApp não Conecta**:
   - Verifique se o QR Code está sendo gerado
   - Escaneie com o WhatsApp principal
   - Aguarde alguns segundos para sincronização

4. **Filas não Processam**:
   - Verifique se o Redis está acessível
   - Verifique os logs da aplicação
   - Reinicie a aplicação

### Logs e Debug

```bash
# Ver logs da aplicação
npm run dev

# Ver logs do Redis
redis-cli monitor

# Ver logs do Docker
docker-compose logs -f
```

## 📞 Suporte

Para suporte técnico:
- Abra uma issue no GitHub
- Consulte a documentação do Supabase
- Verifique a documentação do Baileys
- Consulte o README.md principal
