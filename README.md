# WhatsApp Dispatcher - Plataforma de Disparo de Mensagens

Uma plataforma completa e profissional para disparo de mensagens WhatsApp integrada com Supabase, desenvolvida com Next.js, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Funcionalidades Implementadas

- **Dashboard Completo**: Métricas em tempo real, gráficos de desempenho e estatísticas
- **Gerenciamento de Clientes**: CRUD completo com busca, filtros e importação CSV
- **Sistema de Campanhas**: Criação, agendamento e gerenciamento de campanhas
- **Disparo Inteligente**: Para clientes cadastrados e novos números
- **Templates Personalizáveis**: Variáveis dinâmicas ({{nome}}, {{email}}, {{telefone}})
- **Sistema de Filas**: Processamento assíncrono com Bull/Redis
- **Integração WhatsApp**: Via Baileys com QR Code automático
- **Relatórios Avançados**: Análise de desempenho e métricas detalhadas
- **Interface Responsiva**: Design moderno e profissional
- **Validação de Números**: Formatação automática e validação de telefones
- **Agendamento**: Disparos programados com precisão
- **Histórico Completo**: Log de todos os disparos e status

### 🎨 Design System

- **Paleta de Cores Profissional**: Azul primário (#2563eb), cinza elegante (#64748b)
- **Tipografia**: Inter font para máxima legibilidade
- **Componentes Reutilizáveis**: Cards, botões, modais e tabelas
- **Animações Suaves**: Transições e micro-interações
- **Responsividade**: Adaptável para desktop e mobile

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Headless UI** - Componentes acessíveis
- **Heroicons** - Ícones SVG
- **Recharts** - Gráficos e visualizações
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações

### Backend
- **Supabase** - Banco de dados e autenticação
- **Baileys** - Integração WhatsApp
- **Bull** - Sistema de filas
- **Redis** - Cache e filas
- **Node.js** - Runtime JavaScript

## 📋 Pré-requisitos

- Node.js 18+ 
- Redis Server
- Conta Supabase
- WhatsApp Business (recomendado)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd whatsapp-dispatcher
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_CODE_PATH=./public/qr-code.png

# Redis Configuration (for queues)
REDIS_URL=redis://localhost:6379

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o Supabase

Execute o script SQL em `supabase/schema.sql` no seu projeto Supabase:

```sql
-- Execute o conteúdo do arquivo supabase/schema.sql
```

### 5. Inicie o Redis
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Windows
# Baixe e instale o Redis for Windows
```

### 6. Execute o projeto
```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📱 Configuração do WhatsApp

### 1. Primeira Conexão
1. Acesse a plataforma
2. Vá para "Configurações" > "WhatsApp"
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde a confirmação de conexão

### 2. Manutenção da Sessão
- A sessão é salva automaticamente
- Reconexão automática em caso de queda
- QR Code regenerado quando necessário

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `clientes`
```sql
- id (UUID, PK)
- nome (VARCHAR)
- telefone (VARCHAR, UNIQUE)
- email (VARCHAR)
- status (ativo/inativo)
- created_at (TIMESTAMP)
- user_id (UUID, FK)
```

#### `campanhas`
```sql
- id (UUID, PK)
- nome (VARCHAR)
- mensagem (TEXT)
- destinatarios (JSONB)
- agendamento (TIMESTAMP)
- status (rascunho/agendada/enviando/concluida/pausada)
- created_at (TIMESTAMP)
- user_id (UUID, FK)
```

#### `disparos`
```sql
- id (UUID, PK)
- campanha_id (UUID, FK)
- cliente_id (UUID, FK)
- telefone (VARCHAR)
- status (pendente/enviado/entregue/lido/erro)
- resposta (TEXT)
- sent_at (TIMESTAMP)
- created_at (TIMESTAMP)
- user_id (UUID, FK)
```

## 🔧 Uso da Plataforma

### 1. Dashboard
- Visualize métricas em tempo real
- Acompanhe campanhas ativas
- Monitore taxa de entrega

### 2. Gerenciar Clientes
- Cadastre clientes individualmente
- Importe listas via CSV
- Busque e filtre clientes
- Gerencie status (ativo/inativo)

### 3. Criar Campanhas
- Escreva mensagens personalizadas
- Use variáveis: `{{nome}}`, `{{email}}`, `{{telefone}}`
- Selecione destinatários
- Agende envios futuros

### 4. Disparos Diretos
- Envie para clientes cadastrados
- Adicione novos números manualmente
- Upload de listas CSV
- Validação automática de números

### 5. Relatórios
- Análise de desempenho
- Gráficos de engajamento
- Exportação de dados
- Métricas por período

## 📊 Sistema de Filas

### Processamento Assíncrono
- **Bull Queue**: Processamento de mensagens
- **Redis**: Cache e persistência
- **Retry Logic**: Tentativas automáticas
- **Rate Limiting**: Controle de velocidade

### Monitoramento
```typescript
// Verificar status das filas
const stats = await getQueueStats()
console.log(stats.messages.waiting) // Mensagens pendentes
console.log(stats.campaigns.active) // Campanhas ativas
```

## 🔒 Segurança

### Row Level Security (RLS)
- Isolamento de dados por usuário
- Políticas de acesso configuradas
- Autenticação via Supabase Auth

### Validações
- Formato de telefone brasileiro
- Limite de caracteres (1600)
- Rate limiting para evitar spam
- Validação de entrada em todas as APIs

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instale a Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure variáveis de ambiente na Vercel
```

### Docker
```dockerfile
# Dockerfile incluído
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoramento

### Métricas Disponíveis
- Total de clientes
- Campanhas ativas
- Mensagens enviadas
- Taxa de entrega
- Taxa de leitura
- Horários de maior engajamento

### Logs
- Status de conexão WhatsApp
- Processamento de filas
- Erros e exceções
- Performance de APIs

## 🔧 Manutenção

### Limpeza de Dados
```sql
-- Limpar disparos antigos (opcional)
DELETE FROM disparos WHERE created_at < NOW() - INTERVAL '30 days';

-- Limpar sessões WhatsApp antigas
-- Remova arquivos em ./sessions/ se necessário
```

### Backup
- Configure backup automático do Supabase
- Exporte dados regularmente
- Mantenha cópias das sessões WhatsApp

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📦 Versionamento

Este projeto utiliza **Semantic Versioning (SemVer)** para controle de versões.

### Scripts de Versionamento

```bash
# Incrementar versão patch (1.2.3 -> 1.2.4)
npm run version:patch

# Incrementar versão minor (1.2.3 -> 1.3.0)
npm run version:minor

# Incrementar versão major (1.2.3 -> 2.0.0)
npm run version:major

# Definir versão específica
npm run version:set -- 1.5.0

# Ver versão atual
npm run version:show

# Fazer push de versão e tags para GitHub
npm run version:push
```

### Configuração Inicial do Git

```bash
# Configurar Git e GitHub
npm run git:setup

# Ou manualmente:
git init
git add .
git commit -m "Initial commit"
npm run version:set -- 0.1.0
```

### Workflow de Release

1. Faça suas alterações e commits
2. Escolha o tipo de release:
   - `npm run version:patch` - Correções de bugs
   - `npm run version:minor` - Novas funcionalidades
   - `npm run version:major` - Mudanças incompatíveis
3. Faça push para GitHub:
   ```bash
   npm run version:push
   ```
4. Crie um Release no GitHub usando a tag criada

Veja mais detalhes em [VERSION.md](./VERSION.md)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do Supabase
- Verifique a documentação do Baileys

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] Templates de mensagem salvos
- [ ] Segmentação avançada de clientes
- [ ] Integração com CRMs
- [ ] API webhooks
- [ ] Dashboard em tempo real
- [ ] Multi-usuário com permissões
- [ ] Integração com outros canais (SMS, Email)

---

**Desenvolvido com ❤️ para automação profissional de WhatsApp**
