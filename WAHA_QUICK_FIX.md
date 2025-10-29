# ⚡ SOLUÇÃO RÁPIDA - WAHA 404 Error

## 🔥 Problema
Erro 404 ao acessar `/api/waha/sessions`

## ✅ Solução em 3 Passos

### 1️⃣ Instalar e Rodar o WAHA

```bash
# Cole este comando no terminal:
docker run -d -p 3001:3000 --name waha devlikeapro/waha
```

### 2️⃣ Criar arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com:

```env
WAHA_API_URL=http://localhost:3001
```

### 3️⃣ Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C no terminal)
# Depois executar:
npm run dev
```

---

## ✅ Verificar se Funcionou

1. Abra: http://localhost:3001/api/sessions
2. Deve ver `[]` (lista vazia)
3. Acesse "Sessões WAHA" no sistema
4. Crie uma nova sessão

---

## 🆘 Ainda com Erro?

### Se porta 3001 já estiver em uso:
```bash
# Use outra porta (ex: 3002)
docker run -d -p 3002:3000 --name waha devlikeapro/waha
```

E atualize `.env.local`:
```env
WAHA_API_URL=http://localhost:3002
```

### Se WAHA não iniciar:
```bash
# Ver logs
docker logs waha

# Reiniciar
docker restart waha
```

### Se continuar 404:
```bash
# 1. Parar servidor Next.js (Ctrl+C)
# 2. Limpar cache
Remove-Item -Recurse -Force .next
# 3. Reinstalar
npm install
# 4. Reiniciar
npm run dev
```

---

## 📊 Comandos Úteis

```bash
# Ver se WAHA está rodando
docker ps | grep waha

# Parar WAHA
docker stop waha

# Iniciar WAHA
docker start waha

# Remover WAHA
docker rm -f waha
```

---

**Documentação Completa**: Ver `WAHA_SETUP.md`

