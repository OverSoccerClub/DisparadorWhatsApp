# Configuração do GitHub para o Projeto

## Status Atual
- ✅ Repositório Git inicializado
- ✅ Remote do GitHub configurado: https://github.com/OverSoccerClub/DisparadorWhatsApp.git
- ✅ Branch master enviada para o GitHub
- ✅ Tags v0.1.2 e v0.1.3 enviadas para o GitHub
- ✅ Backup completo realizado

## Próximos Passos

### 1. Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Crie um novo repositório (ex: `whatsapp-dispatcher`)
3. **NÃO** inicialize com README, .gitignore ou licença (já temos tudo)

### 2. Configurar Remote e Fazer Push

```powershell
# Adicionar remote do GitHub (substitua USERNAME e REPO pelo seu)
git remote add origin https://github.com/USERNAME/REPO.git

# Ou se usar SSH:
git remote add origin git@github.com:USERNAME/REPO.git

# Verificar remotes configurados
git remote -v

# Fazer push do código e tags
git push -u origin master
git push --tags

# Ou se a branch principal for 'main':
git branch -M main
git push -u origin main
git push --tags
```

### 3. Verificar no GitHub
- Confirmar que todos os arquivos foram enviados
- Verificar que a tag v0.1.2 aparece na seção "Releases"
- Confirmar que o CHANGELOG.md está atualizado

## Comandos Úteis

### Versionamento Automatizado
```powershell
# Incrementar versão patch (0.1.2 -> 0.1.3)
npm run version:patch

# Incrementar versão minor (0.1.2 -> 0.2.0)
npm run version:minor

# Incrementar versão major (0.1.2 -> 1.0.0)
npm run version:major

# Definir versão específica
npm run version:set -- 0.2.0

# Ver versão atual
npm run version:show
```

### Atualização Futura do Código
```powershell
# Adicionar alterações
git add .

# Fazer commit
git commit -m "descrição das alterações"

# Atualizar versão (se necessário)
npm run version:patch  # ou minor/major

# Push para GitHub
git push origin master
git push --tags
```

## Estrutura de Versionamento

O projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Mudanças incompatíveis com versões anteriores
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

## Arquivos de Versionamento
- `package.json` - Versão do projeto
- `VERSION.txt` - Arquivo de versão simples
- `CHANGELOG.md` - Histórico de mudanças
- Git tags - Tags de release (v0.1.2, etc.)

