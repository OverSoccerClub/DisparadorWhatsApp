#!/bin/bash

# Script de deploy para produção
# Otimizado para performance e segurança

echo "🚀 Iniciando deploy para produção..."

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose -f docker-compose.prod.yml down

# Limpar cache e builds antigos
echo "🧹 Limpando cache e builds antigos..."
docker system prune -f
docker volume prune -f

# Build da aplicação
echo "📦 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da aplicação"
    exit 1
fi

# Build das imagens Docker
echo "🐳 Fazendo build das imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar serviços
echo "▶️ Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
docker-compose -f docker-compose.prod.yml ps

# Testar aplicação
echo "🧪 Testando aplicação..."
curl -f http://localhost:3000/api/health || echo "⚠️ Aplicação pode não estar pronta ainda"

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: http://localhost:3000"
echo "📊 Para ver logs: docker-compose -f docker-compose.prod.yml logs -f"
