# 🚀 GUIA RÁPIDO - Configurar WAHA em 3 Comandos

## ⚡ Solução Automática (Recomendado)

Execute estes comandos em ordem:

### 1️⃣ Configurar WAHA (Docker + Variáveis)
```bash
npm run setup-waha
```

Este comando vai:
- ✅ Verificar se Docker está instalado
- ✅ Instalar e iniciar WAHA na porta 3001
- ✅ Criar/atualizar arquivo `.env.local`
- ✅ Testar se WAHA está funcionando

### 2️⃣ Criar Tabela no Supabase

**Opção A - Manual (Mais Confiável):**

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto
3. Clique em **"SQL Editor"** no menu lateral
4. Clique em **"New query"**
5. Cole o conteúdo do arquivo: `scripts/create-waha-config-table.sql`
6. Clique em **"Run"** ou pressione `Ctrl+Enter`
7. Deve aparecer: ✅ **Success. No rows returned**

**Opção B - Script Node.js:**
```bash
npm run setup-waha-db
```

### 3️⃣ Reiniciar Servidor
```bash
# Parar servidor (Ctrl+C)
# Depois executar:
npm run dev
```

---

## ✅ Verificar se Funcionou

### 1. Testar WAHA:
Abra no navegador: http://localhost:3001/api/sessions

Deve ver: `[]` (lista vazia)

### 2. Testar Sistema:
1. Acesse: http://localhost:3000/waha-sessions
2. Não deve ter erro 404
3. Clique em "Nova Sessão"
4. Digite um nome (ex: `teste`)
5. Clique em "Criar Sessão"

---

## 📋 Solução Manual (Se Automática Falhar)

### Passo 1: Instalar WAHA
```bash
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

### Passo 2: Criar .env.local
Crie arquivo `.env.local` na raiz:
```env
WAHA_API_URL=http://localhost:3001
WAHA_API_KEY=
```

### Passo 3: Criar Tabela no Supabase
Execute o SQL do arquivo: `scripts/create-waha-config-table.sql`

### Passo 4: Reiniciar
```bash
npm run dev
```

---

## 🆘 Problemas Comuns

### ❌ Erro: "Docker não encontrado"
**Solução:** Instale o Docker Desktop
- Windows: https://www.docker.com/products/docker-desktop

### ❌ Erro: "port 3001 is already allocated"
**Solução:** Use outra porta
```bash
docker rm -f waha
docker run -d -p 3002:3000 --name waha devlikeapro/waha
```
E atualize `.env.local`:
```env
WAHA_API_URL=http://localhost:3002
```

### ❌ Erro: "Could not find the table 'waha_config'"
**Solução:** Execute o SQL no Supabase manualmente
- Arquivo: `scripts/create-waha-config-table.sql`

### ❌ Erro: "404 Not Found" ao acessar WAHA
**Solução:** WAHA não está rodando
```bash
# Ver se está rodando
docker ps | findstr waha

# Iniciar
docker start waha

# Ver logs
docker logs waha
```

---

## 🔧 Comandos Úteis

```bash
# Setup completo do WAHA
npm run setup-waha

# Criar tabela no banco
npm run setup-waha-db

# Ver containers rodando
docker ps

# Ver logs do WAHA
docker logs waha -f

# Parar WAHA
docker stop waha

# Iniciar WAHA
docker start waha

# Reiniciar WAHA
docker restart waha

# Remover WAHA
docker rm -f waha

# Testar API do WAHA
curl http://localhost:3001/api/sessions
```

---

## 📚 Documentação Completa

- **Solução Completa**: `WAHA_FIX_COMPLETE.md`
- **Setup Detalhado**: `WAHA_SETUP.md`
- **Integração**: `WAHA_INTEGRATION.md`
- **SQL da Tabela**: `scripts/create-waha-config-table.sql`

---

## ✨ Resumo dos Arquivos Criados

```
📁 Projeto
├── 📄 WAHA_README.md (este arquivo)
├── 📄 WAHA_FIX_COMPLETE.md (solução detalhada)
├── 📄 WAHA_SETUP.md (guia completo)
├── 📄 WAHA_INTEGRATION.md (documentação técnica)
├── 📄 WAHA_QUICK_FIX.md (solução rápida)
│
├── 📁 scripts/
│   ├── setup-waha.ps1 (script PowerShell)
│   ├── setup-waha.js (script Node.js)
│   └── create-waha-config-table.sql (SQL)
│
├── 📁 app/
│   ├── waha-sessions/page.tsx (página)
│   └── api/waha/sessions/ (API routes)
│
└── 📁 supabase/
    └── migrations/create_waha_config_table.sql
```

---

## 🎯 Checklist Final

- [ ] Docker instalado e rodando
- [ ] WAHA instalado: `docker ps | findstr waha`
- [ ] WAHA responde: http://localhost:3001/api/sessions
- [ ] Arquivo `.env.local` criado com `WAHA_API_URL`
- [ ] Tabela `waha_config` criada no Supabase
- [ ] Servidor Next.js reiniciado
- [ ] Página carrega: http://localhost:3000/waha-sessions
- [ ] Consegue criar sessão de teste

---

## 🎉 Pronto!

Execute os 3 comandos acima e seu sistema de Sessões WAHA estará funcionando!

**Dúvidas?** Veja a documentação completa em `WAHA_FIX_COMPLETE.md`

