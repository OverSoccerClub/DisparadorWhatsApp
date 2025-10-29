# WhatsApp Dispatcher - Guia de Solução de Problemas

## 🚨 Problemas Comuns e Soluções

### 1. ChunkLoadError - Loading chunk failed

**Sintomas:**
- Erro: `ChunkLoadError: Loading chunk app/layout failed`
- Página não carrega ou recarrega infinitamente
- Timeout ao carregar recursos JavaScript

**Soluções:**

#### Solução Rápida:
```bash
npm run clear-cache
npm run dev
```

#### Solução Manual:
```bash
# Parar processos Node.js
taskkill /f /im node.exe

# Limpar cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm cache clean --force

# Reinstalar e iniciar
npm install
npm run dev
```

### 2. Erro: Cannot find module 'critters'

**Sintomas:**
- Erro: `Error: Cannot find module 'critters'`
- Servidor não inicia

**Solução:**
```bash
npm install critters
Remove-Item -Recurse -Force .next
npm run dev
```

### 3. Problemas de Performance

**Sintomas:**
- Carregamento lento
- Timeouts frequentes
- Recursos não carregam

**Soluções:**

#### Configuração do Next.js:
O arquivo `next.config.js` já está otimizado com:
- Webpack polling para desenvolvimento estável
- Split chunks otimizado
- Cache groups para vendor e código da aplicação

#### Configuração do Navegador:
- **Hard Refresh**: `Ctrl + Shift + R`
- **Limpar Cache**: DevTools → Application → Storage → Clear storage
- **Modo Incógnito**: Teste em aba anônima

### 4. Problemas de Rede

**Sintomas:**
- Timeouts de conexão
- Recursos não carregam
- Erros de CORS

**Soluções:**
- Verificar firewall (porta 3000)
- Desativar proxy/VPN temporariamente
- Verificar configurações de rede

## 🛠️ Scripts Disponíveis

### Scripts de Limpeza:
```bash
# Windows (PowerShell)
npm run clear-cache

# Unix/Linux (Bash)
npm run clear-cache-unix

# Manual
powershell -ExecutionPolicy Bypass -File scripts/clear-cache.ps1
```

### Scripts de Desenvolvimento:
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar servidor de produção
npm run lint         # Verificar código
```

## 🔧 Configurações Avançadas

### ChunkErrorHandler
O sistema inclui um handler automático que:
- Detecta erros de chunk loading
- Limpa cache automaticamente
- Recarrega a página quando necessário

### Configurações do Webpack
- **Polling**: Melhora estabilidade em desenvolvimento
- **Split Chunks**: Otimiza carregamento de recursos
- **Cache Groups**: Separa vendor e código da aplicação

## 📋 Checklist de Solução de Problemas

### Antes de reportar um problema:
- [ ] Execute `npm run clear-cache`
- [ ] Verifique se a porta 3000 está livre
- [ ] Teste em modo incógnito
- [ ] Verifique logs do console do navegador
- [ ] Verifique logs do terminal

### Informações para reportar:
- Sistema operacional
- Versão do Node.js (`node --version`)
- Versão do npm (`npm --version`)
- Mensagem de erro completa
- Passos para reproduzir

## 🚀 Configuração da Seção WAHA

A seção de configuração do WAHA está implementada e inclui:

### Funcionalidades:
- ✅ Configuração de URL da API
- ✅ Autenticação via API Key
- ✅ Configuração de webhook
- ✅ Teste de conexão
- ✅ Configurações avançadas
- ✅ Monitoramento de status

### APIs Criadas:
- `POST /api/config/waha` - Salvar configurações
- `GET /api/config/waha` - Buscar configurações
- `POST /api/config/waha/test` - Testar conexão

### Como usar:
1. Acesse `http://localhost:3000/configuracoes`
2. Configure a URL da API do WAHA
3. Adicione sua API Key
4. Teste a conexão
5. Salve as configurações

## 📞 Suporte

Se os problemas persistirem:
1. Execute o script de limpeza completa
2. Verifique a documentação do Next.js
3. Consulte os logs de erro
4. Teste em ambiente limpo

---

**Última atualização:** $(Get-Date -Format "dd/MM/yyyy HH:mm")
