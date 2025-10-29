# Guia Rápido de Versionamento

## 🚀 Início Rápido

### 1. Configurar Git e GitHub (Primeira vez)

```bash
npm run git:setup
```

Este script irá:
- Inicializar o repositório Git
- Configurar branch principal (main)
- Criar commit inicial
- Solicitar URL do repositório GitHub

### 2. Verificar Versão Atual

```bash
npm run version:show
```

### 3. Criar Nova Versão

**Para correção de bugs:**
```bash
npm run version:patch
```

**Para nova funcionalidade:**
```bash
npm run version:minor
```

**Para mudança incompatível:**
```bash
npm run version:major
```

### 4. Enviar para GitHub

```bash
npm run version:push
```

Ou manualmente:
```bash
git push origin main
git push --tags
```

## 📋 Exemplos Práticos

### Exemplo 1: Correção de Bug
```bash
# 1. Corrigir o bug e fazer commit
git add .
git commit -m "fix: corrige problema de autenticação"

# 2. Criar versão patch
npm run version:patch
# Versão: 0.1.0 -> 0.1.1

# 3. Enviar para GitHub
npm run version:push
```

### Exemplo 2: Nova Funcionalidade
```bash
# 1. Desenvolver e commitar
git add .
git commit -m "feat: adiciona sistema de campanhas"

# 2. Criar versão minor
npm run version:minor
# Versão: 0.1.0 -> 0.2.0

# 3. Enviar para GitHub
npm run version:push
```

### Exemplo 3: Mudança Incompatível
```bash
# 1. Fazer mudanças e commitar
git add .
git commit -m "refactor: refatora sistema de autenticação"

# 2. Criar versão major
npm run version:major
# Versão: 0.1.0 -> 1.0.0

# 3. Enviar para GitHub
npm run version:push
```

## 🔍 Verificações

### Ver tags criadas
```bash
git tag -l
```

### Ver histórico de versões
```bash
git log --oneline --decorate
```

### Verificar diferenças entre versões
```bash
git diff v0.1.0 v0.1.1
```

## 📝 Convenções de Commit

Use prefixos claros nos commits:

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

## ⚠️ Importante

- Sempre faça commit antes de criar uma versão
- Use `npm run version:push` para enviar tags e commits
- Crie Releases no GitHub manualmente usando as tags criadas
- Mantenha o CHANGELOG.md atualizado
