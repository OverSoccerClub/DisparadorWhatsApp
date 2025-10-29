# Script de Limpeza - Remove arquivos de teste e debug
# Execute com cuidado após revisar os arquivos

$filesToRemove = @(
    # Arquivos de teste JavaScript
    "test-*.js",
    "check-*.js",
    "debug-*.js",
    "fix-*.js",
    "insert-*.js",
    "setup-*.js",
    
    # Páginas de debug/teste
    "app\debug",
    "app\debug-auth",
    "app\test-css",
    "app\test-instance-generator",
    "app\test-modal",
    
    # Rotas de API de teste
    "app\api\test-*",
    "app\api\debug",
    
    # Documentação temporária (manter apenas README.md principal)
    "*.md",
    "!README.md",
    "!OPTIMIZATION_PLAN.md"
)

Write-Host "🔍 Analisando arquivos para remoção..." -ForegroundColor Yellow

$totalSize = 0
$filesFound = @()

foreach ($pattern in $filesToRemove) {
    $files = Get-ChildItem -Path . -Include $pattern -Recurse -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer }
    foreach ($file in $files) {
        $filesFound += $file
        $totalSize += $file.Length
    }
}

Write-Host "`n📊 Estatísticas:" -ForegroundColor Cyan
Write-Host "   Arquivos encontrados: $($filesFound.Count)" -ForegroundColor White
Write-Host "   Tamanho total: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White

if ($filesFound.Count -eq 0) {
    Write-Host "`n✅ Nenhum arquivo encontrado para remover." -ForegroundColor Green
    exit
}

Write-Host "`n⚠️  Os seguintes arquivos serão removidos:" -ForegroundColor Yellow
$filesFound | Select-Object -First 20 | ForEach-Object {
    Write-Host "   - $($_.FullName.Replace($PWD.Path + '\', ''))" -ForegroundColor Gray
}

if ($filesFound.Count -gt 20) {
    Write-Host "   ... e mais $($filesFound.Count - 20) arquivos" -ForegroundColor Gray
}

$confirmation = Read-Host "`n❓ Deseja continuar? (S/N)"

if ($confirmation -ne 'S' -and $confirmation -ne 's') {
    Write-Host "`n❌ Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host "`n🗑️  Removendo arquivos..." -ForegroundColor Yellow

$removed = 0
$errors = 0

foreach ($file in $filesFound) {
    try {
        Remove-Item -Path $file.FullName -Force -ErrorAction Stop
        $removed++
    } catch {
        Write-Host "   ⚠️  Erro ao remover: $($file.FullName)" -ForegroundColor Red
        $errors++
    }
}

Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "   Arquivos removidos: $removed" -ForegroundColor White
Write-Host "   Erros: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "White" })
Write-Host "   Espaço liberado: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White

