# Sistema de Autenticação - Fluxus Message

## Visão Geral

O sistema de autenticação foi implementado para controlar o acesso à plataforma, permitindo que cada usuário tenha suas próprias configurações e instâncias do WhatsApp.

## Estrutura do Banco de Dados

### Tabela `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único do usuário
- `email`: Email único para login
- `password_hash`: Hash da senha usando bcrypt
- `name`: Nome completo do usuário
- `avatar_url`: URL da foto de perfil (opcional)
- `is_active`: Se o usuário está ativo
- `is_admin`: Se o usuário é administrador
- `last_login`: Último login do usuário
- `created_at/updated_at`: Timestamps automáticos

## API Routes

### POST `/api/auth/login`
**Descrição:** Fazer login do usuário
**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```
**Resposta:**
```json
{
  "success": true,
  "user": { ... },
  "message": "Login realizado com sucesso"
}
```

### POST `/api/auth/register`
**Descrição:** Registrar novo usuário
**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome Completo"
}
```
**Resposta:**
```json
{
  "success": true,
  "user": { ... },
  "message": "Usuário criado com sucesso"
}
```

### POST `/api/auth/logout`
**Descrição:** Fazer logout do usuário
**Resposta:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### GET `/api/auth/me`
**Descrição:** Obter dados do usuário autenticado
**Resposta:**
```json
{
  "success": true,
  "user": { ... }
}
```

## Página de Autenticação

### Rota: `/auth`

**Funcionalidades:**
- Login com email e senha
- Registro de novos usuários
- Validação de formulários
- Feedback visual com toasts
- Conta administrador padrão

**Conta Padrão:**
- Email: `admin@dispatcher.com`
- Senha: `admin123`

## Middleware de Autenticação

### Arquivo: `middleware.ts`

**Funcionalidades:**
- Protege rotas que precisam de autenticação
- Redireciona para `/auth` se não autenticado
- Permite acesso a rotas públicas (`/auth`)

## Hook de Autenticação

### Arquivo: `lib/hooks/useAuth.ts`

**Funcionalidades:**
- Gerenciar estado do usuário
- Métodos de login, registro e logout
- Verificação automática de autenticação
- Contexto React para toda aplicação

**Métodos:**
- `login(email, password)`: Fazer login
- `register(email, password, name)`: Registrar usuário
- `logout()`: Fazer logout
- `refreshUser()`: Atualizar dados do usuário

## Integração com Sistema Existente

### ConfiguracoesPage
- Agora usa `useAuth()` para obter dados do usuário
- Verifica se usuário está autenticado antes de renderizar
- Passa `currentUser.id` para todas as operações da Evolution API

### Header
- Exibe nome do usuário autenticado
- Botão de logout funcional
- Avatar com inicial do nome

## Segurança

### Hash de Senhas
- Usa `bcryptjs` com salt rounds = 10
- Senhas nunca são armazenadas em texto plano

### Tokens JWT
- Tokens com expiração de 7 dias
- Armazenados em cookies httpOnly
- Verificação automática em cada requisição

### Validações
- Email válido obrigatório
- Senha mínima de 6 caracteres
- Nome mínimo de 2 caracteres
- Verificação de email único

## Variáveis de Ambiente

```env
JWT_SECRET=your-secret-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Como Usar

1. **Executar SQL:** Execute `scripts/create_users_table.sql` no Supabase
2. **Configurar ENV:** Adicione as variáveis de ambiente
3. **Acessar:** Vá para `/auth` para fazer login
4. **Usar conta padrão:** `admin@dispatcher.com` / `admin123`

## Próximos Passos

- [ ] Implementar recuperação de senha
- [ ] Adicionar verificação de email
- [ ] Implementar roles e permissões
- [ ] Adicionar 2FA (Two-Factor Authentication)
- [ ] Implementar sessões simultâneas

