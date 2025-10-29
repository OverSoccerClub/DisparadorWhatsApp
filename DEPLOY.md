# 🚀 Guia de Deploy para Produção - WhatsApp Dispatcher

## 📋 Pré-requisitos

### Servidor de Produção:
- **CPU**: Mínimo 2 cores, recomendado 4+ cores
- **RAM**: Mínimo 2GB, recomendado 4GB+
- **Disco**: Mínimo 20GB SSD
- **SO**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Software Necessário:
- Node.js 18+
- Docker & Docker Compose
- Nginx ou Apache
- Certificado SSL (Let's Encrypt recomendado)

## 🔧 Configuração Inicial

### 1. Preparar o Servidor:
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y
```

### 2. Configurar Variáveis de Ambiente:
```bash
# Copiar arquivo de exemplo
cp env.production.example .env.production

# Editar com suas configurações
nano .env.production
```

### 3. Configurar SSL (Let's Encrypt):
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 🚀 Deploy da Aplicação

### Opção 1: Deploy com Docker (Recomendado)
```bash
# Deploy completo
npm run deploy

# Ou manualmente
docker-compose -f docker-compose.prod.yml up -d
```

### Opção 2: Deploy Manual
```bash
# Build da aplicação
npm run build:prod

# Iniciar em produção
npm run start:prod
```

## 🌐 Configuração do Nginx

### 1. Copiar configuração:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/whatsapp-dispatcher
sudo ln -s /etc/nginx/sites-available/whatsapp-dispatcher /etc/nginx/sites-enabled/
```

### 2. Testar e recarregar:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuração do Apache

### 1. Copiar configuração:
```bash
sudo cp apache.conf /etc/apache2/sites-available/whatsapp-dispatcher.conf
sudo a2ensite whatsapp-dispatcher.conf
```

### 2. Habilitar módulos necessários:
```bash
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod proxy
sudo a2enmod proxy_http
```

### 3. Recarregar Apache:
```bash
sudo systemctl reload apache2
```

## 📊 Monitoramento e Logs

### Verificar Status:
```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Logs da aplicação
docker-compose -f docker-compose.prod.yml logs -f whatsapp-dispatcher

# Logs do Nginx
sudo tail -f /var/log/nginx/whatsapp-dispatcher.access.log
sudo tail -f /var/log/nginx/whatsapp-dispatcher.error.log
```

### Monitoramento de Performance:
```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Uso de memória
free -h
```

## 🔄 Atualizações

### Deploy de Nova Versão:
```bash
# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Atualizar código
git pull origin main

# Rebuild e deploy
npm run deploy
```

### Rollback:
```bash
# Voltar para versão anterior
git checkout versao-anterior
npm run deploy
```

## 🛡️ Segurança

### Firewall:
```bash
# Configurar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Backup:
```bash
# Backup do banco de dados
pg_dump whatsapp_dispatcher > backup_$(date +%Y%m%d).sql

# Backup dos arquivos
tar -czf backup_files_$(date +%Y%m%d).tar.gz /app
```

## 📈 Otimizações de Performance

### 1. Configurações do Sistema:
```bash
# Aumentar limites de arquivos
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 2. Configurações do Node.js:
```bash
# Variáveis de ambiente para performance
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=128
```

### 3. Cache Redis (Opcional):
```bash
# Instalar Redis
sudo apt install redis-server -y

# Configurar no .env.production
REDIS_URL=redis://localhost:6379
```

## 🚨 Troubleshooting

### Problemas Comuns:

#### 1. Aplicação não inicia:
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs whatsapp-dispatcher

# Verificar variáveis de ambiente
docker-compose -f docker-compose.prod.yml config
```

#### 2. Erro de SSL:
```bash
# Renovar certificado
sudo certbot renew --dry-run
```

#### 3. Problemas de performance:
```bash
# Verificar recursos
htop
docker stats

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

## 📞 Suporte

### Comandos Úteis:
```bash
# Status geral
npm run docker:prod && docker-compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Limpar cache
npm run clear-cache
```

### URLs Importantes:
- **Aplicação**: https://seu-dominio.com
- **API Health**: https://seu-dominio.com/api/health
- **Configurações WAHA**: https://seu-dominio.com/configuracoes

---

**Última atualização:** $(Get-Date -Format "dd/MM/yyyy HH:mm")
