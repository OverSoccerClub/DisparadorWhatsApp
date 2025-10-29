Write-Host ""
Write-Host "CORRECAO WAHA" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Docker nao encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Docker instalado" -ForegroundColor Green
Write-Host ""

# 2. Verificar se WAHA existe
Write-Host "2. Verificando WAHA..." -ForegroundColor Yellow
$wahaExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "^waha$" -Quiet

if (-not $wahaExists) {
    Write-Host "Instalando WAHA..." -ForegroundColor Yellow
    docker run -d -p 3001:3000 --name waha devlikeapro/waha
} else {
    Write-Host "WAHA ja existe. Iniciando..." -ForegroundColor Yellow
    docker start waha
}

Write-Host ""
Write-Host "Aguardando 15 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 3. Testar WAHA
Write-Host ""
Write-Host "3. Testando WAHA..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "OK: WAHA esta funcionando!" -ForegroundColor Green
} catch {
    Write-Host "AVISO: WAHA ainda nao esta pronto" -ForegroundColor Yellow
}

# 4. Instrucoes SQL
Write-Host ""
Write-Host "4. Execute este SQL no Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "DROP POLICY IF EXISTS `"Permitir leitura para todos`" ON public.waha_config;" -ForegroundColor White
Write-Host "DROP POLICY IF EXISTS `"Permitir atualizacao para usuarios autenticados`" ON public.waha_config;" -ForegroundColor White
Write-Host "DROP POLICY IF EXISTS `"Permitir insercao para usuarios autenticados`" ON public.waha_config;" -ForegroundColor White
Write-Host ""
Write-Host "CREATE POLICY `"waha_config_select_policy`" ON public.waha_config FOR SELECT USING (true);" -ForegroundColor White
Write-Host "CREATE POLICY `"waha_config_insert_policy`" ON public.waha_config FOR INSERT WITH CHECK (true);" -ForegroundColor White
Write-Host "CREATE POLICY `"waha_config_update_policy`" ON public.waha_config FOR UPDATE USING (true) WITH CHECK (true);" -ForegroundColor White
Write-Host "CREATE POLICY `"waha_config_delete_policy`" ON public.waha_config FOR DELETE USING (true);" -ForegroundColor White
Write-Host ""
Write-Host "INSERT INTO public.waha_config (id, api_url, api_key)" -ForegroundColor White
Write-Host "VALUES (1, 'http://localhost:3001', '')" -ForegroundColor White
Write-Host "ON CONFLICT (id) DO UPDATE SET api_url = EXCLUDED.api_url;" -ForegroundColor White
Write-Host ""

# 5. Proximo passo
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Execute o SQL acima em: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Reinicie o servidor: npm run dev" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:3000/waha-sessions" -ForegroundColor White
Write-Host ""

