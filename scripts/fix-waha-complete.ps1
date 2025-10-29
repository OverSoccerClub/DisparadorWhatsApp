# ============================================================================
# Script Completo de Correção WAHA
# ============================================================================

Write-Host ""
Write-Host "🔧 CORREÇÃO COMPLETA DO WAHA" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PROBLEMA 1: VERIFICAR E INICIAR WAHA
# ============================================================================

Write-Host "📦 1. Verificando WAHA..." -ForegroundColor Yellow
Write-Host ""

# Verificar Docker
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "   ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "   📥 Instale: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Verificar se WAHA está rodando
$wahaRunning = docker ps --format "{{.Names}}" 2>$null | Select-String -Pattern "^waha$" -Quiet

if ($wahaRunning) {
    Write-Host "   ✅ WAHA já está rodando!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "   ⚠️  WAHA não está rodando" -ForegroundColor Yellow
    
    # Verificar se container existe mas está parado
    $wahaExists = docker ps -a --format "{{.Names}}" 2>$null | Select-String -Pattern "^waha$" -Quiet
    
    if ($wahaExists) {
        Write-Host "   🔄 Iniciando container existente..." -ForegroundColor Yellow
        docker start waha 2>&1 | Out-Null
        Write-Host "   ✅ WAHA iniciado!" -ForegroundColor Green
    } else {
        Write-Host "   📦 Instalando WAHA..." -ForegroundColor Yellow
        docker run -d -p 3001:3000 --name waha devlikeapro/waha 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ WAHA instalado e iniciado!" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao instalar WAHA" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
}

# Aguardar WAHA iniciar
Write-Host "   ⏳ Aguardando WAHA inicializar (15 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Testar WAHA
Write-Host "   🧪 Testando WAHA..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ WAHA está funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  WAHA ainda não está pronto" -ForegroundColor Yellow
    Write-Host "   💡 Aguarde mais alguns segundos..." -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# PROBLEMA 2: CORRIGIR PERMISSÕES NO SUPABASE
# ============================================================================

Write-Host "🔑 2. Corrigindo permissões no Supabase..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   📋 Você precisa executar este SQL no Supabase:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ╔════════════════════════════════════════════════════════════╗" -ForegroundColor DarkGray
Write-Host "   ║ 1. Acesse: https://supabase.com/dashboard                 ║" -ForegroundColor White
Write-Host "   ║ 2. Abra seu projeto                                        ║" -ForegroundColor White
Write-Host "   ║ 3. Clique em 'SQL Editor' no menu lateral                  ║" -ForegroundColor White
Write-Host "   ║ 4. Clique em 'New query'                                   ║" -ForegroundColor White
Write-Host "   ║ 5. Cole o SQL do arquivo: fix-waha-permissions.sql         ║" -ForegroundColor White
Write-Host "   ║ 6. Execute (Ctrl+Enter)                                    ║" -ForegroundColor White
Write-Host "   ╚════════════════════════════════════════════════════════════╝" -ForegroundColor DarkGray
Write-Host ""

Write-Host "   📄 Arquivo SQL: scripts\fix-waha-permissions.sql" -ForegroundColor Cyan
Write-Host ""

# Abrir arquivo SQL no editor padrão
$sqlFile = "scripts\fix-waha-permissions.sql"
if (Test-Path $sqlFile) {
    Write-Host "   💡 Deseja abrir o arquivo SQL agora? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host "   "
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Start-Process notepad.exe -ArgumentList $sqlFile
        Write-Host "   ✅ Arquivo aberto no Notepad!" -ForegroundColor Green
        Write-Host "   📋 Copie o conteúdo e execute no Supabase" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "   ⏸️  Pressione ENTER depois de executar o SQL no Supabase..." -ForegroundColor Yellow
$null = Read-Host

# ============================================================================
# VERIFICAÇÃO FINAL
# ============================================================================

Write-Host ""
Write-Host "✅ 3. Verificação final..." -ForegroundColor Yellow
Write-Host ""

# Testar WAHA novamente
Write-Host "   🧪 Testando WAHA novamente..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ WAHA: OK (Status: $($response.StatusCode))" -ForegroundColor Green
    $wahaOk = $true
} catch {
    Write-Host "   ❌ WAHA: Falhou" -ForegroundColor Red
    Write-Host "   💡 Execute: docker logs waha" -ForegroundColor Yellow
    $wahaOk = $false
}

Write-Host ""

# ============================================================================
# PRÓXIMOS PASSOS
# ============================================================================

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host "🎉 CORREÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host ""

if ($wahaOk) {
    Write-Host "✅ WAHA está rodando corretamente!" -ForegroundColor Green
} else {
    Write-Host "⚠️  WAHA teve problemas, mas você pode continuar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ⚠️  SE AINDA NÃO EXECUTOU o SQL no Supabase:" -ForegroundColor Yellow
Write-Host "   - Abra: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   - Execute o SQL de: scripts\fix-waha-permissions.sql" -ForegroundColor White
Write-Host ""
Write-Host "2. 🔄 Reiniciar o servidor Next.js:" -ForegroundColor Yellow
Write-Host "   - Pressione Ctrl+C no terminal do 'npm run dev'" -ForegroundColor White
Write-Host "   - Execute: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. 🌐 Testar a aplicação:" -ForegroundColor Yellow
Write-Host "   - Acesse: http://localhost:3000/waha-sessions" -ForegroundColor White
Write-Host "   - Crie uma nova sessão" -ForegroundColor White
Write-Host ""

Write-Host ("=" * 60) -ForegroundColor Green
Write-Host ""

Write-Host "🔧 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver logs do WAHA:        docker logs waha -f" -ForegroundColor Gray
Write-Host "Reiniciar WAHA:         docker restart waha" -ForegroundColor Gray
Write-Host "Parar WAHA:             docker stop waha" -ForegroundColor Gray
Write-Host "Remover WAHA:           docker rm -f waha" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentação: FIX_PERMISSIONS_AGORA.md" -ForegroundColor Cyan
Write-Host ""
