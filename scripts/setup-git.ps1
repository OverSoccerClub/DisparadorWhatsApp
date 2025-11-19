# Script de Configuração do Git para o Projeto Fluxus Message

Write-Host "🚀 Configurando Git e GitHub para o projeto..." -ForegroundColor Cyan

# Verificar se Git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não está instalado. Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se já é um repositório Git
if (Test-Path .git) {
    Write-Host "⚠️  Repositório Git já existe." -ForegroundColor Yellow
    $continue = Read-Host "Deseja reconfigurar? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Green
    git init
}

# Configurar Git (se não estiver configurado globalmente)
$userName = Read-Host "Digite seu nome (ou Enter para pular)"
$userEmail = Read-Host "Digite seu email (ou Enter para pular)"

if ($userName) {
    git config user.name $userName
    Write-Host "✅ Nome configurado: $userName" -ForegroundColor Green
}

if ($userEmail) {
    git config user.email $userEmail
    Write-Host "✅ Email configurado: $userEmail" -ForegroundColor Green
}

# Criar commit inicial
Write-Host "`n📝 Criando commit inicial..." -ForegroundColor Cyan
git add .
$initialCommit = git commit -m "Initial commit: Fluxus Message Platform"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit inicial criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar ou commit já existe." -ForegroundColor Yellow
}

# Configurar branch principal
Write-Host "`n🌿 Configurando branch principal..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    git branch -M main
    Write-Host "✅ Branch renomeada para 'main'" -ForegroundColor Green
} else {
    Write-Host "✅ Branch principal já é 'main'" -ForegroundColor Green
}

# Configurar remote do GitHub
Write-Host "`n🔗 Configuração do GitHub..." -ForegroundColor Cyan
$githubUrl = Read-Host "Digite a URL do seu repositório GitHub (ex: https://github.com/usuario/repositorio.git) ou Enter para pular"

if ($githubUrl) {
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "⚠️  Remote 'origin' já existe: $existingRemote" -ForegroundColor Yellow
        $update = Read-Host "Deseja atualizar? (s/N)"
        if ($update -eq "s" -or $update -eq "S") {
            git remote set-url origin $githubUrl
            Write-Host "✅ Remote atualizado: $githubUrl" -ForegroundColor Green
        }
    } else {
        git remote add origin $githubUrl
        Write-Host "✅ Remote adicionado: $githubUrl" -ForegroundColor Green
    }
    
    Write-Host "`n📤 Para fazer push inicial, execute:" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor White
} else {
    Write-Host "⚠️  Remote não configurado. Você pode adicionar depois com:" -ForegroundColor Yellow
    Write-Host "   git remote add origin <URL_DO_REPOSITORIO>" -ForegroundColor White
}

# Definir versão inicial
Write-Host "`n🏷️  Configurando versão inicial..." -ForegroundColor Cyan
$setVersion = Read-Host "Deseja definir a versão inicial como 0.1.0? (S/n)"
if ($setVersion -ne "n" -and $setVersion -ne "N") {
    node scripts/version.js set 0.1.0
    Write-Host "✅ Versão inicial configurada: 0.1.0" -ForegroundColor Green
}

Write-Host "`n✨ Configuração concluída!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Crie um repositório no GitHub (se ainda não criou)" -ForegroundColor White
Write-Host "   2. Execute: git push -u origin main" -ForegroundColor White
Write-Host "   3. Execute: git push --tags" -ForegroundColor White
Write-Host "   4. Use 'npm run version:patch|minor|major' para criar novas versões" -ForegroundColor White
