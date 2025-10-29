# 🧹 Arquivos Antigos para Remover

## 📋 Lista de Arquivos Desnecessários

Estes arquivos são **duplicados** ou **obsoletos** e podem ser removidos com segurança.

### ❌ Remover da pasta `supabase/`:

```
supabase/check-and-create.sql
supabase/ultimate-solution.sql
supabase/final-solution.sql
supabase/debug-tables.sql
supabase/complete-solution.sql
supabase/fix-anon-permissions.sql
supabase/quick-fix.sql
supabase/create-tables.sql
supabase/complete-fix.sql
supabase/disable-rls.sql
supabase/remove-rls.sql
supabase/fix-permissions.sql
supabase/schema.sql (MANTER COMO BACKUP, mas DATABASE_COMPLETE.sql é mais completo)
```

### ❌ Remover da pasta `scripts/`:

```
scripts/fix-final-simples.sql
scripts/fix-permissions-force.sql
scripts/atualizar-waha-url.sql
scripts/fix-waha-permissions-remoto.sql
scripts/fix-waha-permissions.sql
scripts/create-waha-config-table.sql
scripts/create_disparos_table.sql
scripts/create_users_table.sql
scripts/simple_test.sql
scripts/test_tables.sql
scripts/insert_test_data.sql
scripts/create_simple_tables.sql
scripts/fix_table_permissions.sql
scripts/create_evolution_config_table.sql
scripts/create_evolution_config_table_safe.sql
```

### ❌ Remover da pasta raiz:

```
fix-users-permissions-manual.sql
fix-waha-simples.ps1
test-waha-setup.js
```

### ❌ Remover documentação duplicada:

```
FIX_PERMISSIONS_AGORA.md
SOLUCAO_RAPIDA.md
SOLUCAO_DEFINITIVA.md
SOLUCAO_FINAL.md
RESOLVER_PERMISSAO.md
ATUALIZAR_URL.md
CORRIGIR_AGORA.md
WAHA_README.md
WAHA_TROUBLESHOOTING.md
WAHA_SETUP.md
WAHA_INTEGRATION.md
WAHA_QUICK_FIX.md
WAHA_FIX_COMPLETE.md
WAHA_PASSOS_FINAIS.md
CONFIGURACAO_WAHA_REMOTO.md
PRODUCTION.md
TROUBLESHOOTING.md
```

---

## ✅ Arquivos para **MANTER**

### 📊 Banco de Dados:
- ✅ **`supabase/DATABASE_COMPLETE.sql`** - Schema completo e oficial
- ✅ **`supabase/migrations/create_waha_config_table.sql`** - Migração WAHA

### 📖 Documentação:
- ✅ **`DATABASE_DOCUMENTATION.md`** - Documentação completa do banco
- ✅ **`DEPLOY_GUIDE.md`** - Guia de deploy
- ✅ **`README.md`** - Documentação principal
- ✅ **`IMPLEMENTATION_SUMMARY.md`** - Resumo da implementação

### 🔧 Scripts Úteis:
- ✅ **`scripts/setup-waha.js`** - Setup automatizado WAHA
- ✅ **`scripts/setup-waha.ps1`** - Setup PowerShell WAHA
- ✅ **`scripts/clear-cache.ps1`** - Limpar cache
- ✅ **`scripts/clear-cache.sh`** - Limpar cache (Unix)
- ✅ **`scripts/deploy.ps1`** - Deploy Windows
- ✅ **`scripts/deploy.sh`** - Deploy Unix

### 📝 Configuração:
- ✅ **`.env.example`** - Exemplo de configuração
- ✅ **`package.json`** - Dependências
- ✅ **`tsconfig.json`** - Config TypeScript
- ✅ **`next.config.js`** - Config Next.js
- ✅ **`tailwind.config.js`** - Config Tailwind
- ✅ **`Dockerfile`** - Config Docker
- ✅ **`docker-compose.yml`** - Compose development

---

## 🚀 Como Limpar

### Opção 1: Manual

Delete os arquivos listados acima um por um.

### Opção 2: PowerShell Script

Salve como `cleanup.ps1`:

```powershell
Write-Host "🧹 Limpando arquivos antigos..." -ForegroundColor Cyan

# Lista de arquivos para remover
$filesToRemove = @(
    "supabase/check-and-create.sql",
    "supabase/ultimate-solution.sql",
    "supabase/final-solution.sql",
    "supabase/debug-tables.sql",
    "supabase/complete-solution.sql",
    "supabase/fix-anon-permissions.sql",
    "supabase/quick-fix.sql",
    "supabase/create-tables.sql",
    "supabase/complete-fix.sql",
    "supabase/disable-rls.sql",
    "supabase/remove-rls.sql",
    "supabase/fix-permissions.sql",
    "scripts/fix-final-simples.sql",
    "scripts/fix-permissions-force.sql",
    "scripts/atualizar-waha-url.sql",
    "scripts/fix-waha-permissions-remoto.sql",
    "scripts/fix-waha-permissions.sql",
    "scripts/create-waha-config-table.sql",
    "scripts/create_disparos_table.sql",
    "scripts/create_users_table.sql",
    "scripts/simple_test.sql",
    "scripts/test_tables.sql",
    "scripts/insert_test_data.sql",
    "scripts/create_simple_tables.sql",
    "scripts/fix_table_permissions.sql",
    "scripts/create_evolution_config_table.sql",
    "scripts/create_evolution_config_table_safe.sql",
    "fix-users-permissions-manual.sql",
    "fix-waha-simples.ps1",
    "test-waha-setup.js",
    "FIX_PERMISSIONS_AGORA.md",
    "SOLUCAO_RAPIDA.md",
    "SOLUCAO_DEFINITIVA.md",
    "SOLUCAO_FINAL.md",
    "RESOLVER_PERMISSAO.md",
    "ATUALIZAR_URL.md",
    "CORRIGIR_AGORA.md",
    "WAHA_README.md",
    "WAHA_TROUBLESHOOTING.md",
    "WAHA_SETUP.md",
    "WAHA_INTEGRATION.md",
    "WAHA_QUICK_FIX.md",
    "WAHA_FIX_COMPLETE.md",
    "WAHA_PASSOS_FINAIS.md",
    "CONFIGURACAO_WAHA_REMOTO.md",
    "PRODUCTION.md",
    "TROUBLESHOOTING.md"
)

$removedCount = 0
$notFoundCount = 0

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removido: $file" -ForegroundColor Green
        $removedCount++
    } else {
        Write-Host "  ⚠️  Não encontrado: $file" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "   Removidos: $removedCount" -ForegroundColor Cyan
Write-Host "   Não encontrados: $notFoundCount" -ForegroundColor Yellow
```

Execute:
```powershell
powershell -ExecutionPolicy Bypass -File cleanup.ps1
```

### Opção 3: Bash Script (Linux/Mac)

Salve como `cleanup.sh`:

```bash
#!/bin/bash

echo "🧹 Limpando arquivos antigos..."

files=(
    "supabase/check-and-create.sql"
    "supabase/ultimate-solution.sql"
    "supabase/final-solution.sql"
    # ... adicione todos os arquivos aqui
)

removed=0
not_found=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ Removido: $file"
        ((removed++))
    else
        echo "  ⚠️  Não encontrado: $file"
        ((not_found++))
    fi
done

echo ""
echo "✅ Limpeza concluída!"
echo "   Removidos: $removed"
echo "   Não encontrados: $not_found"
```

Execute:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

---

## ⚠️ Antes de Remover

1. **Faça backup** do projeto inteiro
2. **Confirme** que `DATABASE_COMPLETE.sql` funciona
3. **Teste** em um servidor Supabase limpo
4. **Commit** suas mudanças no Git

---

## 📊 Resumo

### Antes da Limpeza:
- **SQL Files:** ~32 arquivos
- **Docs:** ~15 arquivos de troubleshooting
- **Total:** ~50+ arquivos desnecessários

### Depois da Limpeza:
- **SQL Files:** 2 arquivos principais
- **Docs:** 3 arquivos essenciais
- **Total:** ~10 arquivos organizados

### Espaço Liberado:
~2-3 MB de arquivos duplicados

---

## ✅ Checklist Final

- [ ] Backup do projeto feito
- [ ] `DATABASE_COMPLETE.sql` testado
- [ ] Arquivos antigos removidos
- [ ] Git commit realizado
- [ ] Deploy funciona normalmente

---

**Este arquivo pode ser removido após a limpeza estar completa.**

