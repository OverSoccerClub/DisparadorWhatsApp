# Guia de Contribuição

Obrigado por considerar contribuir para o WhatsApp Dispatcher! 🎉

## 📋 Processo de Contribuição

### 1. Fork o Projeto

1. Faça fork do repositório
2. Clone seu fork:
   ```bash
   git clone https://github.com/seu-usuario/whatsapp-dispatcher.git
   cd whatsapp-dispatcher
   ```

### 2. Configure o Ambiente

```bash
# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### 3. Crie uma Branch

```bash
# Para nova funcionalidade
git checkout -b feature/nome-da-funcionalidade

# Para correção de bug
git checkout -b bugfix/descricao-do-bug

# Para hotfix urgente
git checkout -b hotfix/descricao-do-hotfix
```

### 4. Desenvolva e Teste

- Faça suas alterações
- Teste localmente
- Execute o linter: `npm run lint`
- Garanta que o build funciona: `npm run build`

### 5. Commit suas Mudanças

Use mensagens de commit claras e descritivas:

```bash
# Exemplos de commits
git commit -m "feat: adiciona sistema de templates"
git commit -m "fix: corrige problema de autenticação"
git commit -m "docs: atualiza documentação de API"
git commit -m "refactor: melhora estrutura de componentes"
```

**Convenções de Commit:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta código)
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-funcionalidade

# Abra um Pull Request no GitHub
```

## 📝 Padrões de Código

### TypeScript
- Use tipos explícitos
- Evite `any`
- Documente funções complexas

### React/Next.js
- Use componentes funcionais
- Prefira hooks em vez de classes
- Use `useCallback` e `useMemo` quando apropriado

### Estilo
- Use Tailwind CSS para estilização
- Mantenha componentes pequenos e focados
- Siga o padrão de nomenclatura existente

## 🧪 Testes

Antes de fazer PR, certifique-se de:

- [ ] Código compila sem erros
- [ ] Linter passa (`npm run lint`)
- [ ] Build funciona (`npm run build`)
- [ ] Funcionalidade testada manualmente
- [ ] Não quebra funcionalidades existentes

## 📚 Documentação

- Atualize o README.md se necessário
- Adicione comentários em código complexo
- Documente novas APIs ou funcionalidades

## 🤝 Processo de Review

1. Aguarde feedback dos mantenedores
2. Faça ajustes solicitados
3. Mantenha a discussão respeitosa e construtiva
4. Após aprovação, seu PR será mergeado

## ❓ Dúvidas?

Abra uma issue no GitHub ou entre em contato com os mantenedores.

Obrigado por contribuir! 🚀
