# Script PowerShell para limpar arquivos de deploys anteriores no EasyPanel
# 
# Este script remove arquivos e diretórios que não são mais necessários
# após um deploy, evitando acúmulo de arquivos no servidor

param(
    [string]$BaseDir = "."
)

Write-Host "🧹 Iniciando limpeza de arquivos de deploys anteriores..." -ForegroundColor Cyan

# Lista de diretórios/arquivos para limpar
$CleanupPaths = @(
    ".next\cache",
    ".next\trace",
    "node_modules\.cache",
    ".turbo",
    ".cache",
    "dist",
    "coverage",
    ".nyc_output",
    "sessions"
)

# Limpar cada item
foreach ($path in $CleanupPaths) {
    $fullPath = Join-Path $BaseDir $path
    if (Test-Path $fullPath) {
        Write-Host "  🗑️  Removendo: $path" -ForegroundColor Yellow
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Limpar arquivos de log
Get-ChildItem -Path $BaseDir -Filter "*.log" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Limpar arquivos temporários
Get-ChildItem -Path $BaseDir -Filter "*.tmp" -Recurse -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem -Path $BaseDir -Filter "*.temp" -Recurse -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Limpar arquivos de sistema
Get-ChildItem -Path $BaseDir -Filter ".DS_Store" -Recurse -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem -Path $BaseDir -Filter "Thumbs.db" -Recurse -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green

