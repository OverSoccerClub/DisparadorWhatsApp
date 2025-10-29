# Script de deploy para produção (PowerShell)
# Otimizado para performance e segurança

Write-Host "🚀 Iniciando deploy para produção..." -ForegroundColor Green

# Parar serviços existentes
Write-Host "🛑 Parando serviços existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

# Limpar cache e builds antigos
Write-Host "🧹 Limpando cache e builds antigos..." -ForegroundColor Yellow
docker system prune -f
docker volume prune -f

# Build da aplicação
Write-Host "📦 Fazendo build da aplicação..." -ForegroundColor Yellow
npm run build

# Verificar se o build foi bem-sucedido
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build da aplicação" -ForegroundColor Red
    exit 1
}

# Build das imagens Docker
Write-Host "🐳 Fazendo build das imagens Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar serviços
Write-Host "▶️ Iniciando serviços..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar saúde dos serviços
Write-Host "🏥 Verificando saúde dos serviços..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

# Testar aplicação
Write-Host "🧪 Testando aplicação..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing | Out-Null
    Write-Host "✅ Aplicação está funcionando!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Aplicação pode não estar pronta ainda" -ForegroundColor Yellow
}

Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🌐 Aplicação disponível em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Para ver logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
