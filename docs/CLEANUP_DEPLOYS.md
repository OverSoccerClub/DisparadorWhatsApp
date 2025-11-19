# Limpeza de Arquivos de Deploys Anteriores

Este documento explica como limpar arquivos acumulados de deploys anteriores no EasyPanel.

## 🧹 Problema

A cada deploy no EasyPanel, arquivos podem se acumular no servidor se não forem limpos adequadamente. Isso pode causar:
- Consumo excessivo de espaço em disco
- Builds mais lentos
- Confusão com arquivos antigos

## ✅ Solução Implementada

### 1. Limpeza Automática no Dockerfile

O Dockerfile foi configurado para limpar automaticamente:
- Diretório antes de copiar arquivos
- Arquivos de cache e temporários após o build
- Arquivos de log e sessões antigas

### 2. Scripts de Limpeza Manual

Foram criados scripts para limpeza manual quando necessário:

#### Linux/Mac (Bash)
```bash
bash scripts/cleanup-old-deploys.sh
```

#### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/cleanup-old-deploys.ps1
```

## 📋 O que é Limpo

Os scripts removem:
- Cache do Next.js (`.next/cache`, `.next/trace`)
- Cache do Node.js (`node_modules/.cache`)
- Cache do Turbo (`.turbo`)
- Arquivos de log antigos (mais de 7 dias)
- Arquivos temporários (`*.tmp`, `*.temp`)
- Arquivos de sessão (`sessions/*`)
- Arquivos de build anteriores (`dist`, `coverage`)
- Arquivos de sistema (`.DS_Store`, `Thumbs.db`)

## 🔧 Como Usar no EasyPanel

### Opção 1: Limpeza Automática (Recomendado)

O Dockerfile já faz a limpeza automaticamente durante o build. Não é necessário fazer nada manualmente.

### Opção 2: Limpeza Manual via Terminal

Se precisar limpar manualmente:

1. Acesse o terminal do container no EasyPanel
2. Execute o script apropriado:
   ```bash
   # Linux/Mac
   bash /app/scripts/cleanup-old-deploys.sh /app
   
   # Ou via PowerShell (se disponível)
   powershell -ExecutionPolicy Bypass -File /app/scripts/cleanup-old-deploys.ps1 -BaseDir /app
   ```

### Opção 3: Limpeza via SSH (se tiver acesso)

Se tiver acesso SSH ao servidor:

```bash
# Navegar até o diretório do projeto
cd /caminho/do/projeto

# Executar script de limpeza
bash scripts/cleanup-old-deploys.sh
```

## ⚠️ Importante

- Os scripts **NÃO** removem arquivos essenciais do projeto
- Apenas arquivos temporários, cache e logs são removidos
- O código-fonte e arquivos de configuração são preservados
- A limpeza é segura e pode ser executada a qualquer momento

## 🔍 Verificar Espaço em Disco

Para verificar o espaço usado antes e depois da limpeza:

```bash
# Ver espaço usado
du -sh /app

# Ver os maiores diretórios
du -h /app | sort -rh | head -20
```

## 📝 Notas

- A limpeza automática no Dockerfile garante que cada build comece limpo
- Os scripts de limpeza manual são úteis para limpar arquivos acumulados entre deploys
- Recomenda-se executar a limpeza manual periodicamente (ex: mensalmente)

