# Configuração de Variáveis de Ambiente

Este documento explica como configurar as variáveis de ambiente necessárias para o funcionamento do sistema.

## 📋 Variáveis Obrigatórias

### Supabase Configuration

```env
# URL do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Chave anônima do Supabase (para frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Chave de serviço do Supabase (para operações do servidor)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🔑 Como Obter as Chaves do Supabase

1. **Acesse o Supabase Dashboard**
2. **Vá para Settings > API**
3. **Copie as seguintes chaves:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Importante sobre Segurança

### Chave Anônima (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **Usada no frontend** (React/Next.js)
- **Pode ser exposta** publicamente
- **Permissões limitadas** (apenas operações permitidas pelo RLS)

### Chave de Serviço (SUPABASE_SERVICE_ROLE_KEY)
- **Usada apenas no backend** (API routes)
- **NUNCA exponha** publicamente
- **Permissões completas** (bypassa RLS)
- **Adicione ao .env.local** (não commit no Git)

## 🚀 Configuração Rápida

1. **Crie o arquivo `.env.local`** na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Execute o script de permissões:**
   ```sql
   -- Execute scripts/fix_table_permissions.sql no Supabase
   ```

3. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 🔧 Troubleshooting

### Erro: "permission denied for table"
- **Solução:** Execute o script `fix_table_permissions.sql`
- **Verifique:** Se a `SUPABASE_SERVICE_ROLE_KEY` está configurada
- **Confirme:** Se as tabelas foram criadas corretamente

### Erro: "Invalid API key"
- **Verifique:** Se as chaves estão corretas
- **Confirme:** Se não há espaços extras nas chaves
- **Teste:** Se as chaves funcionam no Supabase Dashboard

### Erro: "Table does not exist"
- **Execute:** O script `create_evolution_config_table_safe.sql`
- **Verifique:** Se as tabelas foram criadas
- **Confirme:** Se as permissões foram concedidas

## 📊 Verificação de Configuração

Para verificar se tudo está funcionando:

1. **Acesse a página de Configurações**
2. **Preencha os campos** da Evolution API
3. **Clique em "Salvar Configurações"**
4. **Verifique se não há erros** no console
5. **Confirme se os dados** foram salvos no Supabase

## 🛡️ Segurança em Produção

### Para Produção:
- **Use variáveis de ambiente** do servidor
- **Nunca commite** chaves no Git
- **Configure RLS** se necessário
- **Monitore** o uso das APIs
- **Use HTTPS** sempre

### Exemplo de Deploy:
```env
# Vercel, Netlify, etc.
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
