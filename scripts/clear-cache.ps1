# Script PowerShell para limpar completamente o cache do Next.js e resolver problemas de ChunkLoadError

Write-Host "🧹 Limpando cache completo do Next.js..." -ForegroundColor Green

# Parar processos Node.js
Write-Host "🛑 Parando processos Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpar cache do Next.js
Write-Host "🗑️ Removendo pasta .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Limpar node_modules
Write-Host "🗑️ Removendo node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}

# Limpar package-lock.json
Write-Host "🗑️ Removendo package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# Limpar cache do npm
Write-Host "🧹 Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force

# Limpar cache do sistema Windows
Write-Host "🧹 Limpando cache do sistema Windows..." -ForegroundColor Yellow
try {
    Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️ Não foi possível limpar cache do sistema" -ForegroundColor Red
}

# Reinstalar dependências
Write-Host "📦 Reinstalando dependências..." -ForegroundColor Yellow
npm install

Write-Host "✅ Limpeza completa finalizada!" -ForegroundColor Green
Write-Host "🚀 Execute 'npm run dev' para iniciar o servidor" -ForegroundColor Cyan
