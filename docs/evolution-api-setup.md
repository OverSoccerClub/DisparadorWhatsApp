# Configuração da Evolution API com Supabase

Este documento explica como configurar e usar o sistema de configurações da Evolution API integrado com Supabase.

## 📋 Pré-requisitos

1. **Supabase configurado** com as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Evolution API** funcionando e acessível

## 🗄️ Configuração do Banco de Dados

### 1. Execute o Script SQL

Execute o script `scripts/create_evolution_config_table.sql` no SQL Editor do Supabase:

```sql
-- O script criará as seguintes tabelas:
-- - evolution_configs: Configurações da Evolution API por usuário
-- - evolution_instances: Instâncias criadas por usuário
```

### 2. Estrutura das Tabelas

#### `evolution_configs`
- `id`: UUID único
- `user_id`: ID do usuário
- `api_url`: URL da Evolution API
- `global_api_key`: Chave global (criptografada)
- `webhook_url`: URL do webhook (opcional)
- `created_at`, `updated_at`: Timestamps
- `is_active`: Status ativo

#### `evolution_instances`
- `id`: UUID único
- `user_id`: ID do usuário proprietário
- `instance_name`: Nome único da instância
- `connection_status`: Status da conexão
- `phone_number`: Número de telefone conectado
- `last_seen`: Última vez vista
- `created_at`, `updated_at`: Timestamps
- `is_active`: Status ativo

## 🔧 Funcionalidades Implementadas

### 1. **Salvar Configurações**
- Configurações são salvas automaticamente no Supabase
- Cada usuário tem suas próprias configurações
- Botão "Salvar Configurações" na interface

### 2. **Carregar Configurações**
- Configurações são carregadas automaticamente ao abrir a página
- Dados são preenchidos nos campos automaticamente

### 3. **Gerenciar Instâncias**
- Instâncias são salvas no Supabase quando criadas
- Status das instâncias é atualizado automaticamente
- Histórico completo de instâncias por usuário

### 4. **Segurança**
- Row Level Security (RLS) habilitado
- Usuários só acessam suas próprias configurações
- Políticas de segurança implementadas

## 🚀 Como Usar

### 1. **Configurar Evolution API**
1. Acesse a página de Configurações
2. Preencha URL da Evolution API
3. Preencha API KEY GLOBAL
4. Configure webhook (opcional)
5. Clique em "Salvar Configurações"

### 2. **Criar Instâncias**
1. Clique em "Criar Instância" ou "Criar 3 Instâncias"
2. As instâncias são criadas na Evolution API
3. Dados são salvos automaticamente no Supabase

### 3. **Gerenciar Instâncias**
1. Visualize todas as instâncias criadas
2. Conecte/desconecte instâncias
3. Exclua instâncias quando necessário
4. Status é atualizado automaticamente

## 📊 APIs Disponíveis

### Configurações
- `POST /api/evolution/save-config` - Salvar configurações
- `GET /api/evolution/save-config?userId=xxx` - Buscar configurações

### Instâncias
- `POST /api/evolution/save-instance` - Salvar instância
- `PUT /api/evolution/save-instance` - Atualizar instância
- `DELETE /api/evolution/save-instance` - Excluir instância
- `GET /api/evolution/user-instances?userId=xxx` - Buscar instâncias

## 🔒 Segurança

### Row Level Security (RLS)
- Usuários só acessam seus próprios dados
- Políticas de segurança implementadas
- Verificação de propriedade em todas as operações

### Validações
- Verificação de propriedade das instâncias
- Prefixos únicos por usuário
- Validação de dados de entrada

## 🐛 Troubleshooting

### Problemas Comuns

1. **Configurações não carregam**
   - Verifique se o Supabase está configurado
   - Verifique as variáveis de ambiente
   - Verifique os logs do console

2. **Instâncias não aparecem**
   - Verifique se a Evolution API está acessível
   - Verifique se as configurações estão salvas
   - Verifique os logs de debug

3. **Erro de permissão**
   - Verifique se o RLS está configurado
   - Verifique se o usuário está autenticado
   - Verifique as políticas de segurança

### Logs de Debug
- Logs detalhados no console do navegador
- Logs no servidor para debug
- Mensagens de erro específicas

## 📈 Benefícios

1. **Persistência de Dados**
   - Configurações salvas permanentemente
   - Histórico completo de instâncias
   - Backup automático dos dados

2. **Multi-Usuário**
   - Isolamento completo entre usuários
   - Configurações individuais
   - Segurança robusta

3. **Escalabilidade**
   - Suporte a muitos usuários
   - Performance otimizada
   - Queries eficientes

4. **Manutenibilidade**
   - Código organizado
   - APIs bem estruturadas
   - Documentação completa
