# Script para reiniciar o servidor Next.js com limpeza completa

Write-Host "🛑 Parando processos Node.js..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "🧹 Limpando cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "*.tsbuildinfo" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor Next.js..." -ForegroundColor Cyan
Write-Host ""

npm run dev

