# 🔧 Troubleshooting - Erro 404 nas Rotas WAHA

## ❌ Problema: `GET /api/waha/sessions 404 (Not Found)`

### 🎯 Causa:
O servidor Next.js não reconhece as novas rotas API porque não foi reiniciado após a criação dos arquivos.

---

## ✅ SOLUÇÃO RÁPIDA

### 1. Parar todos os processos Node.js
```bash
# Windows PowerShell
taskkill /F /IM node.exe

# Ou pressione Ctrl+C no terminal onde npm run dev está rodando
```

### 2. Limpar cache do Next.js (opcional mas recomendado)
```bash
# Deletar pasta .next
Remove-Item -Recurse -Force .next

# Ou manualmente:
# Deletar pasta: C:\Projetos\Web\Disparador WhatsApp\.next
```

### 3. Reiniciar o servidor
```bash
npm run dev
```

### 4. Aguardar compilação
Aguarde até ver:
```
✓ Ready in Xms
○ Compiling / ...
✓ Compiled in Xms
```

### 5. Testar no navegador
1. Acesse: http://localhost:3000/waha-sessions
2. A página deve carregar sem erro 404
3. Abra o DevTools (F12) e veja se não tem mais erros 404

---

## 🔍 Verificação das Rotas

As rotas devem existir nestes arquivos:

```
app/
└── api/
    └── waha/
        └── sessions/
            ├── route.ts (GET e POST)
            └── [sessionName]/
                ├── route.ts (GET e DELETE)
                ├── qr/
                │   └── route.ts (GET)
                └── restart/
                    └── route.ts (POST)
```

### Verificar se os arquivos existem:
```powershell
# Windows PowerShell
Test-Path "app\api\waha\sessions\route.ts"
Test-Path "app\api\waha\sessions\[sessionName]\route.ts"
Test-Path "app\api\waha\sessions\[sessionName]\qr\route.ts"
Test-Path "app\api\waha\sessions\[sessionName]\restart\route.ts"
```

Todos devem retornar `True`.

---

## 🐛 Outros Erros Comuns

### Erro: "Could not find the table 'waha_config'"
**Solução:** Execute o SQL no Supabase
- Arquivo: `scripts/create-waha-config-table.sql`
- Ou rode: `npm run setup-waha-db`

### Erro: "WAHA API connection failed"
**Solução:** WAHA não está rodando
```bash
# Verificar se Docker está instalado
docker --version

# Iniciar WAHA
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# Verificar se está rodando
docker ps | findstr waha

# Testar API
curl http://localhost:3001/api/sessions
```

### Erro: "port 3001 is already allocated"
**Solução:** Outra aplicação está usando a porta 3001
```bash
# Parar container existente
docker stop waha
docker rm waha

# Usar outra porta (ex: 3002)
docker run -d -p 3002:3000 --name waha devlikeapro/waha

# Atualizar .env.local
WAHA_API_URL=http://localhost:3002
```

---

## 📊 Verificar se WAHA está Funcionando

### 1. Testar via Browser:
```
http://localhost:3001/api/sessions
```
Deve retornar: `[]` (lista vazia)

### 2. Testar via cURL (PowerShell):
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing
```

### 3. Ver logs do WAHA:
```bash
docker logs waha -f
```

---

## 🔄 Fluxo Completo de Restart

```bash
# 1. Parar tudo
taskkill /F /IM node.exe
docker stop waha

# 2. Limpar cache
Remove-Item -Recurse -Force .next

# 3. Iniciar WAHA
docker start waha
# OU se não existe:
docker run -d -p 3001:3000 --name waha devlikeapro/waha

# 4. Aguardar 10 segundos
Start-Sleep -Seconds 10

# 5. Testar WAHA
Invoke-WebRequest -Uri "http://localhost:3001/api/sessions" -UseBasicParsing

# 6. Iniciar Next.js
npm run dev

# 7. Aguardar compilação (30-60 segundos)

# 8. Testar aplicação
# http://localhost:3000/waha-sessions
```

---

## ✅ Checklist de Verificação

- [ ] Docker está instalado: `docker --version`
- [ ] WAHA está rodando: `docker ps | findstr waha`
- [ ] WAHA responde: `curl http://localhost:3001/api/sessions`
- [ ] Arquivo `.env.local` existe e tem `WAHA_API_URL=http://localhost:3001`
- [ ] Tabela `waha_config` criada no Supabase
- [ ] Servidor Next.js foi reiniciado após criar as rotas
- [ ] Cache `.next` foi limpo
- [ ] Não há erros de compilação no terminal
- [ ] Página carrega sem 404: http://localhost:3000/waha-sessions
- [ ] DevTools (F12) não mostra erros 404 em `/api/waha/sessions`

---

## 📞 Ainda com Problemas?

### Ver logs completos:
```bash
# Logs do WAHA
docker logs waha --tail 100

# Logs do Next.js
# Ver o terminal onde npm run dev está rodando
```

### Verificar portas em uso:
```powershell
# Ver o que está rodando na porta 3000
netstat -ano | findstr :3000

# Ver o que está rodando na porta 3001
netstat -ano | findstr :3001
```

### Testar rotas manualmente:
```powershell
# Testar rota GET sessions
Invoke-WebRequest -Uri "http://localhost:3000/api/waha/sessions" -UseBasicParsing

# Deve retornar 200 OK (não 404)
```

---

## 🎯 Resumo da Solução

**O erro 404 acontece porque:**
1. ✅ As rotas foram criadas
2. ❌ Mas o servidor não foi reiniciado

**Para resolver:**
1. Parar servidor: `Ctrl+C` ou `taskkill /F /IM node.exe`
2. Reiniciar: `npm run dev`
3. Aguardar compilação completa
4. Testar: http://localhost:3000/waha-sessions

**Tempo estimado:** 1-2 minutos

---

## 📚 Documentação Relacionada

- `WAHA_README.md` - Guia rápido completo
- `WAHA_SETUP.md` - Setup detalhado
- `WAHA_FIX_COMPLETE.md` - Solução completa passo a passo
- `WAHA_INTEGRATION.md` - Documentação técnica

