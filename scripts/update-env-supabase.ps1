# Script para atualizar as credenciais do Supabase no arquivo .env.local
# Uso: .\scripts\update-env-supabase.ps1

$envFile = ".env.local"
$envExample = ".env-example"

# Verificar se o arquivo .env.local existe
if (-not (Test-Path $envFile)) {
    Write-Host "📝 Criando arquivo .env.local a partir do .env-example..." -ForegroundColor Yellow
    Copy-Item $envExample $envFile
}

Write-Host "🔧 Atualizando credenciais do Supabase no arquivo .env.local..." -ForegroundColor Cyan

# Ler o conteúdo do arquivo
$content = Get-Content $envFile -Raw

# Atualizar NEXT_PUBLIC_SUPABASE_URL
$content = $content -replace '(?m)^NEXT_PUBLIC_SUPABASE_URL=.*', 'NEXT_PUBLIC_SUPABASE_URL=https://supabase.innovarecode.com.br'

# Atualizar NEXT_PUBLIC_SUPABASE_ANON_KEY
$newAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
$content = $content -replace '(?m)^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$newAnonKey"

# Atualizar SUPABASE_SERVICE_ROLE_KEY
$newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
$content = $content -replace '(?m)^SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$newServiceKey"

# Salvar o arquivo atualizado
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✅ Credenciais do Supabase atualizadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Execute o script SQL no Supabase: supabase/MIGRATION_COMPLETE.sql" -ForegroundColor White
Write-Host "   2. Execute: npm run check-supabase" -ForegroundColor White
Write-Host "   3. Reinicie o servidor: npm run dev" -ForegroundColor White
Write-Host ""

