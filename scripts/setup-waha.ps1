# Script PowerShell para configurar WAHA
Write-Host "🚀 Configurando WAHA..." -ForegroundColor Green
Write-Host ""

# 1. Verificar se Docker está instalado
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "Instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Verificar se WAHA já está rodando
Write-Host "🔍 Verificando se WAHA já está rodando..." -ForegroundColor Yellow
$wahaRunning = docker ps --filter "name=waha" --format "{{.Names}}" 2>$null

if ($wahaRunning -eq "waha") {
    Write-Host "✅ WAHA já está rodando!" -ForegroundColor Green
    Write-Host "📊 Status:" -ForegroundColor Cyan
    docker ps --filter "name=waha"
} else {
    Write-Host "⚠️ WAHA não está rodando" -ForegroundColor Yellow
    
    # Verificar se container existe mas está parado
    $wahaExists = docker ps -a --filter "name=waha" --format "{{.Names}}" 2>$null
    
    if ($wahaExists -eq "waha") {
        Write-Host "🔄 Iniciando WAHA existente..." -ForegroundColor Yellow
        docker start waha
        Write-Host "✅ WAHA iniciado!" -ForegroundColor Green
    } else {
        Write-Host "📦 Instalando WAHA..." -ForegroundColor Yellow
        docker run -d -p 3001:3000 --name waha devlikeapro/waha
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ WAHA instalado e iniciado!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao instalar WAHA" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""

# 3. Aguardar WAHA iniciar
Write-Host "⏳ Aguardando WAHA iniciar (15 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 4. Testar WAHA
Write-Host "🧪 Testando WAHA..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ WAHA está funcionando!" -ForegroundColor Green
        Write-Host "📊 Resposta: $($response.Content)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ WAHA pode não estar pronto ainda" -ForegroundColor Yellow
    Write-Host "Aguarde mais alguns segundos e teste: http://localhost:3001/api/sessions" -ForegroundColor Yellow
}

Write-Host ""

# 5. Criar/Atualizar .env.local
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow

$envContent = @"
# Configuração do WAHA
WAHA_API_URL=http://localhost:3001
WAHA_API_KEY=
"@

$envFile = ".env.local"
$envExists = Test-Path $envFile

if ($envExists) {
    $currentContent = Get-Content $envFile -Raw
    if ($currentContent -notmatch "WAHA_API_URL") {
        Add-Content -Path $envFile -Value "`n$envContent"
        Write-Host "✅ Variáveis WAHA adicionadas ao .env.local" -ForegroundColor Green
    } else {
        Write-Host "✅ Variáveis WAHA já existem no .env.local" -ForegroundColor Green
    }
} else {
    Set-Content -Path $envFile -Value $envContent
    Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
}

Write-Host ""

# 6. Executar script Node.js para criar tabela
Write-Host "📊 Criando tabela no Supabase..." -ForegroundColor Yellow
Write-Host "Execute: node scripts/setup-waha.js" -ForegroundColor Cyan
Write-Host "Ou execute o SQL manualmente no Supabase SQL Editor" -ForegroundColor Cyan

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "🎉 Configuração do WAHA concluída!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""

Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Criar tabela no Supabase:" -ForegroundColor White
Write-Host "   - Acesse: https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "   - SQL Editor > New query" -ForegroundColor Gray
Write-Host "   - Cole o conteúdo de: scripts/create-waha-config-table.sql" -ForegroundColor Gray
Write-Host "   - Execute (Ctrl+Enter)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Reiniciar o servidor:" -ForegroundColor White
Write-Host "   - Pare o servidor (Ctrl+C)" -ForegroundColor Gray
Write-Host "   - Execute: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Testar:" -ForegroundColor White
Write-Host "   - Acesse: http://localhost:3000/waha-sessions" -ForegroundColor Gray
Write-Host "   - Crie uma nova sessão" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentação completa: WAHA_FIX_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""

# 7. Mostrar comandos úteis
Write-Host "🔧 Comandos úteis:" -ForegroundColor Yellow
Write-Host "Ver logs do WAHA:     docker logs waha -f" -ForegroundColor Gray
Write-Host "Parar WAHA:          docker stop waha" -ForegroundColor Gray
Write-Host "Iniciar WAHA:        docker start waha" -ForegroundColor Gray
Write-Host "Reiniciar WAHA:      docker restart waha" -ForegroundColor Gray
Write-Host "Remover WAHA:        docker rm -f waha" -ForegroundColor Gray
Write-Host ""
