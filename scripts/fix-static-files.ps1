# Script para limpar cache do Next.js e resolver problemas de arquivos estáticos
# Execute este script quando encontrar erros 404 em arquivos estáticos

Write-Host "🧹 Limpando cache do Next.js..." -ForegroundColor Yellow

# Parar o servidor se estiver rodando
$process = Get-Process -Name node -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "⏸️  Parando servidor Next.js..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Remover diretório .next
if (Test-Path ".next") {
    Write-Host "🗑️  Removendo diretório .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Diretório .next removido" -ForegroundColor Green
}

# Remover node_modules/.cache se existir
if (Test-Path "node_modules\.cache") {
    Write-Host "🗑️  Removendo cache do node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache do node_modules removido" -ForegroundColor Green
}

# Limpar cache do npm
Write-Host "🧹 Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "✅ Cache do npm limpo" -ForegroundColor Green

Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: npm install" -ForegroundColor White
Write-Host "   2. Execute: npm run dev" -ForegroundColor White
Write-Host "   3. Limpe o cache do navegador (Ctrl+Shift+Delete)" -ForegroundColor White

