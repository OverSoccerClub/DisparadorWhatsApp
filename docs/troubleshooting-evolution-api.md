# 🔧 Troubleshooting - Evolution API

## 🚨 Problemas Identificados

### **1. Erro de Permissão no Supabase**
```
permission denied for table evolution_configs
```

**✅ Soluções Implementadas:**
- `scripts/fix_table_permissions.sql` - Corrige permissões
- `scripts/create_simple_tables.sql` - Cria tabelas sem restrições
- `scripts/create_evolution_config_table_safe.sql` - Script robusto

### **2. Erro na Listagem de Instâncias**
```
Cannot read properties of undefined (reading 'startsWith')
```

**✅ Soluções Implementadas:**
- Verificações de segurança na API
- Fallback para dados do Supabase
- Logs detalhados para debug

### **3. Instâncias Não Aparecem**
- Instâncias criadas mas não listadas
- Problema na comunicação com Evolution API

**✅ Soluções Implementadas:**
- API híbrida (Supabase + Evolution API)
- Salvamento automático no Supabase
- Verificação de status em tempo real

## 🛠️ Scripts de Correção

### **Opção 1: Corrigir Permissões (Recomendado)**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/fix_table_permissions.sql
```

### **Opção 2: Recriar Tabelas Simples**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/create_simple_tables.sql
```

### **Opção 3: Script Robusto**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/create_evolution_config_table_safe.sql
```

## 🔍 Scripts de Teste

### **1. Verificar Tabelas**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/test_tables.sql
```

### **2. Inserir Dados de Teste**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/insert_test_data.sql
```

### **3. Teste Simples**
```sql
-- Execute no Supabase SQL Editor:
-- scripts/simple_test.sql
```

## 🚀 Endpoints de Teste

### **1. Testar Supabase**
```
GET /api/test-supabase
```

### **2. Listar Instâncias**
```
GET /api/evolution/instances?userId=user_001
```

### **3. Criar Instância**
```
POST /api/evolution/create-instance
```

## 📋 Checklist de Resolução

### **Passo 1: Executar Scripts**
- [ ] Execute `create_simple_tables.sql` no Supabase
- [ ] Verifique se as tabelas foram criadas
- [ ] Teste inserir dados manualmente

### **Passo 2: Configurar Variáveis**
- [ ] Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
- [ ] Verifique se as chaves estão corretas
- [ ] Reinicie o servidor de desenvolvimento

### **Passo 3: Testar Funcionalidades**
- [ ] Acesse `/configuracoes`
- [ ] Preencha os campos da Evolution API
- [ ] Clique em "Salvar Configurações"
- [ ] Clique em "Criar Instância"
- [ ] Verifique se aparece na lista

### **Passo 4: Verificar Logs**
- [ ] Abra o console do navegador
- [ ] Verifique se há erros
- [ ] Confirme se as requisições estão funcionando

## 🔧 Configuração de Ambiente

### **Variáveis Necessárias:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Como Obter as Chaves:**
1. **Acesse o Supabase Dashboard**
2. **Vá para Settings > API**
3. **Copie as chaves necessárias**
4. **Adicione ao `.env.local`**

## 🎯 Soluções por Problema

### **Problema: "permission denied"**
- **Solução:** Execute `fix_table_permissions.sql`
- **Alternativa:** Execute `create_simple_tables.sql`

### **Problema: "Cannot read properties of undefined"**
- **Solução:** Já corrigido na API
- **Verificação:** Teste o endpoint `/api/evolution/instances`

### **Problema: "Instâncias não aparecem"**
- **Solução:** API híbrida implementada
- **Verificação:** Dados são salvos no Supabase automaticamente

### **Problema: "500 Internal Server Error"**
- **Solução:** Verifique as variáveis de ambiente
- **Verificação:** Teste com `scripts/simple_test.sql`

## 📊 Status das Implementações

- ✅ **Correção de permissões** - Scripts criados
- ✅ **API híbrida** - Implementada
- ✅ **Verificações de segurança** - Adicionadas
- ✅ **Logs detalhados** - Implementados
- ✅ **Fallback para Supabase** - Funcionando
- ✅ **Scripts de teste** - Criados

## 🎉 Próximos Passos

1. **Execute um dos scripts** de correção
2. **Configure as variáveis** de ambiente
3. **Teste a funcionalidade** completa
4. **Verifique os logs** para confirmar funcionamento
5. **Reporte qualquer problema** restante

## 📞 Suporte

Se ainda houver problemas:
1. **Verifique os logs** do console
2. **Execute os scripts** de teste
3. **Confirme as variáveis** de ambiente
4. **Teste os endpoints** individualmente
