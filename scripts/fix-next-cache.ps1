# Script para limpar completamente o cache do Next.js e resolver problemas de compilação

Write-Host "🧹 Limpando cache do Next.js..." -ForegroundColor Cyan

# Remover pasta .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Pasta .next removida" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Pasta .next não encontrada" -ForegroundColor Yellow
}

# Remover cache do node_modules
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Cache do node_modules removido" -ForegroundColor Green
}

# Remover arquivos temporários do TypeScript
Get-ChildItem -Path . -Filter "*.tsbuildinfo" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm run dev" -ForegroundColor White
Write-Host "2. Aguarde a compilação completa" -ForegroundColor White
Write-Host "3. Teste a aplicação" -ForegroundColor White

