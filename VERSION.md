# Sistema de Versionamento

Este projeto utiliza **Semantic Versioning (SemVer)** para controle de versões.

## Formato de Versão

O formato é: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incrementa quando há mudanças incompatíveis na API
- **MINOR**: Incrementa quando funcionalidades são adicionadas de forma compatível
- **PATCH**: Incrementa quando há correções de bugs compatíveis

Exemplo: `1.2.3`

## Como Fazer Release

### 1. Release de Patch (Correção de Bugs)
```bash
npm run version:patch
```
- Incrementa: `1.2.3` → `1.2.4`
- Cria tag: `v1.2.4`
- Commit: `chore: release v1.2.4`

### 2. Release de Minor (Nova Funcionalidade)
```bash
npm run version:minor
```
- Incrementa: `1.2.3` → `1.3.0`
- Cria tag: `v1.3.0`
- Commit: `chore: release v1.3.0`

### 3. Release de Major (Mudança Incompatível)
```bash
npm run version:major
```
- Incrementa: `1.2.3` → `2.0.0`
- Cria tag: `v2.0.0`
- Commit: `chore: release v2.0.0`

### 4. Release Manual
```bash
npm run version:set -- 1.5.0
```
- Define versão: `1.5.0`
- Cria tag: `v1.5.0`
- Commit: `chore: release v1.5.0`

## Push para GitHub

Após criar uma versão, faça push das tags:

```bash
npm run version:push
```

Ou manualmente:
```bash
git push origin main
git push --tags
```

## Git Flow

### Branch Principal
- **main**: Código de produção

### Branches de Desenvolvimento
- **develop**: Desenvolvimento ativo
- **feature/**: Novas funcionalidades
- **bugfix/**: Correções de bugs
- **hotfix/**: Correções urgentes

## Tags e Releases

- Cada versão cria uma tag Git: `v1.2.3`
- Tags são criadas automaticamente nos scripts
- Releases no GitHub devem ser criados manualmente baseados nas tags

## Próximos Passos

1. Configure o repositório GitHub
2. Execute `npm run version:init` para inicializar
3. Use os scripts de versionamento para releases
4. Crie releases no GitHub usando as tags criadas
