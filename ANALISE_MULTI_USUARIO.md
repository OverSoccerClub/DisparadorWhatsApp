# 🔐 Análise de Isolamento Multi-Usuário - WhatsApp Dispatcher

**Data da Análise:** 11/11/2025  
**Versão Analisada:** 0.1.4

---

## 📊 RESUMO EXECUTIVO

### Status Atual: ⚠️ **PARCIALMENTE MULTI-USUÁRIO**

O sistema possui **isolamento parcial** de dados. Algumas funcionalidades estão corretamente isoladas por usuário, mas as **funcionalidades principais (Clientes, Campanhas, Disparos) NÃO estão completamente isoladas**, representando um **risco de segurança e privacidade**.

---

## ✅ FUNCIONALIDADES COM ISOLAMENTO CORRETO

### 1. **Evolution API** ✅
- **Status:** ✅ Isolado corretamente
- **Evidência:**
  - `evolution_configs` - Filtra por `user_id`
  - `evolution_instances` - Filtra por `user_id`
  - Todas as APIs verificam autenticação e filtram por usuário

**Exemplo:**
```typescript
// lib/supabase/evolution-config-service.ts
.eq('user_id', userId)
```

### 2. **WAHA (Sessões e Servidores)** ✅
- **Status:** ✅ Isolado corretamente
- **Evidência:**
  - `waha_servers` - Filtra por `user_id`
  - `waha_sessions` - Vinculado a servidores do usuário
  - Todas as APIs verificam autenticação

**Exemplo:**
```typescript
// app/api/waha/dispatch/route.ts
.eq('user_id', user.id)
```

### 3. **Telegram Bots** ✅
- **Status:** ✅ Isolado corretamente
- **Evidência:**
  - `telegram_bots` - Filtra por `user_id`
  - APIs verificam autenticação

**Exemplo:**
```typescript
// app/api/telegram/dispatch/route.ts
.eq('user_id', user.id)
```

### 4. **Maturação de Chips** ✅
- **Status:** ✅ Isolado corretamente
- **Evidência:**
  - `maturacao_schedules` - Filtra por `user_id`
  - APIs verificam autenticação

**Exemplo:**
```typescript
// app/api/maturacao/execute-scheduled/route.ts
.eq('user_id', user.id)
```

---

## ❌ FUNCIONALIDADES SEM ISOLAMENTO ADEQUADO

### 1. **Clientes** ❌
- **Status:** ❌ **NÃO ISOLADO**
- **Problema:**
  - API `/api/clientes` (GET) busca **TODOS** os clientes sem filtrar por `user_id`
  - API `/api/clientes` (POST) não salva `user_id` (usa tabela antiga `disparos_sms`)
  - API `/api/clientes` (PUT/DELETE) não verifica propriedade do registro

**Código Problemático:**
```typescript
// app/api/clientes/route.ts - GET
const { data: clientes, error, count } = await DisparosSMSService.getClientesPaginated({
  page,
  limit: finalLimit,
  search,
  status
})
// ❌ Não filtra por user_id - retorna TODOS os clientes de TODOS os usuários
```

**Impacto:** 
- 🔴 **CRÍTICO** - Usuários podem ver clientes de outros usuários
- 🔴 **CRÍTICO** - Violação de privacidade e LGPD

### 2. **Disparos** ❌
- **Status:** ❌ **NÃO ISOLADO (Leitura)**
- **Problema:**
  - API `/api/disparos` (GET) busca **TODOS** os disparos sem filtrar por `user_id`
  - API `/api/disparos` (POST) **SALVA** com `user_id` corretamente
  - API `/api/disparos` (DELETE) não verifica propriedade do registro

**Código Problemático:**
```typescript
// app/api/disparos/route.ts - GET
const { data, error } = await supabase
  .from('disparos')
  .select('*')
  .order('created_at', { ascending: false })
// ❌ Não filtra por user_id - retorna TODOS os disparos de TODOS os usuários
```

**Impacto:**
- 🔴 **CRÍTICO** - Usuários podem ver disparos de outros usuários
- 🔴 **CRÍTICO** - Violação de privacidade e LGPD
- 🟡 **MÉDIO** - Usuários podem deletar disparos de outros usuários

### 3. **Campanhas** ❌
- **Status:** ❌ **NÃO ISOLADO**
- **Problema:**
  - API `/api/campanhas` (GET) busca **TODAS** as campanhas sem filtrar por `user_id`
  - API `/api/campanhas` (POST) **NÃO SALVA** `user_id` ao criar
  - API `/api/campanhas` (PUT/DELETE) não verifica propriedade do registro

**Código Problemático:**
```typescript
// app/api/campanhas/route.ts - GET
const campanhas = await CampaignService.getCampanhas()
// ❌ Não filtra por user_id

// lib/campaignService.ts
static async getCampanhas(): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from('campanhas')
    .select('*')
    .order('created_at', { ascending: false })
  // ❌ Não filtra por user_id
}
```

**Impacto:**
- 🔴 **CRÍTICO** - Usuários podem ver campanhas de outros usuários
- 🔴 **CRÍTICO** - Usuários podem modificar/deletar campanhas de outros
- 🔴 **CRÍTICO** - Violação de privacidade e LGPD

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Prioridade: 🔴 **CRÍTICA** (Segurança e Compliance)

### 1. Corrigir API de Clientes

#### 1.1 Adicionar Autenticação e Filtro no GET
```typescript
// app/api/clientes/route.ts
export async function GET(request: NextRequest) {
  try {
    // ✅ Adicionar autenticação
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // ✅ Filtrar por user_id
    const { data: clientes, error, count } = await supabase
      .from('clientes') // ✅ Usar tabela 'clientes' (não 'disparos_sms')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id) // ✅ FILTRO CRÍTICO
      .order('created_at', { ascending: false })
      // ... resto do código
  }
}
```

#### 1.2 Adicionar user_id no POST
```typescript
export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, telefone, email, status = 'ativo' } = body

    // ✅ Salvar com user_id
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nome,
        telefone,
        email,
        status,
        user_id: user.id // ✅ CRÍTICO
      }])
      .select()
      .single()

    // ... resto do código
  }
}
```

#### 1.3 Verificar Propriedade no PUT/DELETE
```typescript
export async function PUT(request: NextRequest) {
  try {
    // ✅ Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome, telefone, email, status } = body

    // ✅ Verificar se o registro pertence ao usuário
    const { data: existing, error: checkError } = await supabase
      .from('clientes')
      .select('user_id')
      .eq('id', id)
      .eq('user_id', user.id) // ✅ Verificar propriedade
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Cliente não encontrado ou sem permissão' }, { status: 404 })
    }

    // ✅ Atualizar apenas se for do usuário
    const { data, error } = await supabase
      .from('clientes')
      .update({ nome, telefone, email, status })
      .eq('id', id)
      .eq('user_id', user.id) // ✅ Garantir propriedade
      .select()
      .single()

    // ... resto do código
  }
}
```

### 2. Corrigir API de Disparos

#### 2.1 Adicionar Filtro no GET
```typescript
// app/api/disparos/route.ts
export async function GET(request: NextRequest) {
  try {
    // ✅ Adicionar autenticação
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // ✅ Filtrar por user_id ANTES de buscar
    let query = supabase
      .from('disparos')
      .select('*')
      .eq('user_id', user.id) // ✅ FILTRO CRÍTICO
      .order('created_at', { ascending: false })

    // Aplicar outros filtros...
    const { data, error } = await query

    // ... resto do código
  }
}
```

#### 2.2 Verificar Propriedade no DELETE
```typescript
export async function DELETE(request: NextRequest) {
  try {
    // ✅ Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // ✅ Verificar propriedade e deletar
    const { error } = await supabase
      .from('disparos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // ✅ Garantir propriedade

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Disparo excluído com sucesso' })
  }
}
```

### 3. Corrigir API de Campanhas

#### 3.1 Adicionar Autenticação e Filtro no GET
```typescript
// app/api/campanhas/route.ts
export async function GET(request: NextRequest) {
  try {
    // ✅ Adicionar autenticação
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // ✅ Buscar apenas campanhas do usuário
    const { data: campanhas, error } = await supabase
      .from('campanhas')
      .select('*')
      .eq('user_id', user.id) // ✅ FILTRO CRÍTICO
      .order('created_at', { ascending: false })

    // ... resto do código
  }
}
```

#### 3.2 Adicionar user_id no POST
```typescript
// lib/campaignService.ts
static async criarCampanha(campanha: CriarCampanhaRequest, userId: string): Promise<Campanha | null> {
  try {
    const { data, error } = await supabase
      .from('campanhas')
      .insert([{
        nome: campanha.nome,
        mensagem: campanha.mensagem,
        criterios: campanha.criterios,
        configuracao: campanha.configuracao,
        user_id: userId, // ✅ CRÍTICO
        status: 'rascunho',
        // ... resto dos campos
      }])
      .select()
      .single()

    // ... resto do código
  }
}
```

#### 3.3 Atualizar todas as operações
```typescript
// lib/campaignService.ts
static async getCampanhas(userId: string): Promise<Campanha[]> {
  // ✅ Filtrar por user_id
  .eq('user_id', userId)
}

static async getCampanhaById(id: string, userId: string): Promise<...> {
  // ✅ Filtrar por user_id E id
  .eq('id', id)
  .eq('user_id', userId)
}

static async atualizarCampanha(id: string, updates: ..., userId: string): Promise<boolean> {
  // ✅ Verificar propriedade
  .eq('id', id)
  .eq('user_id', userId)
}

static async deletarCampanha(id: string, userId: string): Promise<boolean> {
  // ✅ Verificar propriedade
  .eq('id', id)
  .eq('user_id', userId)
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Correções Críticas (URGENTE)
- [ ] Adicionar autenticação em `/api/clientes` (GET, POST, PUT, DELETE)
- [ ] Adicionar filtro `user_id` em `/api/clientes` (GET)
- [ ] Adicionar `user_id` ao salvar cliente (POST)
- [ ] Verificar propriedade em `/api/clientes` (PUT, DELETE)
- [ ] Adicionar autenticação em `/api/disparos` (GET, DELETE)
- [ ] Adicionar filtro `user_id` em `/api/disparos` (GET)
- [ ] Verificar propriedade em `/api/disparos` (DELETE)
- [ ] Adicionar autenticação em `/api/campanhas` (GET, POST, PUT, DELETE)
- [ ] Adicionar filtro `user_id` em `/api/campanhas` (GET)
- [ ] Adicionar `user_id` ao salvar campanha (POST)
- [ ] Verificar propriedade em `/api/campanhas` (PUT, DELETE)
- [ ] Atualizar `CampaignService` para receber `userId`
- [ ] Atualizar `DisparosSMSService` para usar tabela `clientes` (não `disparos_sms`)

### Fase 2 - Validações Adicionais
- [ ] Adicionar middleware de autenticação reutilizável
- [ ] Adicionar helper para verificar propriedade de recursos
- [ ] Adicionar testes de isolamento multi-usuário
- [ ] Documentar padrão de isolamento

### Fase 3 - Segurança Avançada
- [ ] Habilitar Row Level Security (RLS) no Supabase
- [ ] Criar políticas RLS para todas as tabelas
- [ ] Adicionar logs de auditoria para acessos
- [ ] Implementar rate limiting por usuário

---

## 🎯 PADRÃO RECOMENDADO

### Template para APIs Multi-Usuário

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ✅ Helper reutilizável para autenticação
async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Usuário não autenticado')
  }

  return { user, supabase }
}

// ✅ GET - Listar recursos do usuário
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    const { data, error } = await supabase
      .from('tabela')
      .select('*')
      .eq('user_id', user.id) // ✅ SEMPRE filtrar por user_id
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }
}

// ✅ POST - Criar recurso com user_id
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const body = await request.json()

    const { data, error } = await supabase
      .from('tabela')
      .insert([{
        ...body,
        user_id: user.id // ✅ SEMPRE incluir user_id
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }
}

// ✅ PUT - Atualizar apenas recursos do usuário
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const body = await request.json()
    const { id, ...updates } = body

    // ✅ Verificar propriedade ANTES de atualizar
    const { data: existing, error: checkError } = await supabase
      .from('tabela')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Recurso não encontrado ou sem permissão' }, { status: 404 })
    }

    // ✅ Atualizar apenas se for do usuário
    const { data, error } = await supabase
      .from('tabela')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // ✅ Garantir propriedade
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }
}

// ✅ DELETE - Deletar apenas recursos do usuário
export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // ✅ Deletar apenas se for do usuário
    const { error } = await supabase
      .from('tabela')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // ✅ Garantir propriedade

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Recurso excluído com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }
}
```

---

## ⚠️ IMPACTO E RISCOS

### Riscos Atuais
1. 🔴 **Vazamento de Dados**: Usuários podem ver dados de outros usuários
2. 🔴 **Violação de Privacidade**: Dados pessoais (telefones, mensagens) expostos
3. 🔴 **LGPD/GDPR**: Não conformidade com leis de proteção de dados
4. 🔴 **Segurança**: Usuários podem modificar/deletar dados de outros
5. 🔴 **Confiança**: Perda de credibilidade se descoberto

### Impacto de Negócio
- **Legal**: Multas por violação de LGPD podem chegar a R$ 50 milhões
- **Reputação**: Perda de confiança dos clientes
- **Competitividade**: Não pode competir com soluções enterprise
- **Escalabilidade**: Impossível vender para múltiplos clientes

---

## ✅ CONCLUSÃO

### Status Atual
- ✅ **Funcionalidades Avançadas**: Isoladas corretamente (WAHA, Telegram, Evolution, Maturação)
- ❌ **Funcionalidades Core**: **NÃO isoladas** (Clientes, Campanhas, Disparos)

### Ação Recomendada
**URGENTE**: Implementar isolamento completo nas APIs de Clientes, Campanhas e Disparos antes de colocar em produção com múltiplos usuários.

### Estimativa de Esforço
- **Tempo**: 4-6 horas de desenvolvimento
- **Complexidade**: Média (mudanças pontuais, não arquiteturais)
- **Risco**: Baixo (mudanças isoladas, não afetam funcionalidades existentes)

---

**Documento gerado em:** 11/11/2025  
**Todas as funcionalidades existentes devem ser mantidas intactas durante as correções**

