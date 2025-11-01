# Sistema de Agendamento de Maturação de Chips

## 📋 Visão Geral

Sistema completo para agendar maturações de chips para execução em data/hora específicas.

## 🗄️ Banco de Dados

### Tabela: `maturacao_schedules`

Execute o script SQL em `supabase/create_maturacao_schedules.sql` no Supabase Dashboard:

```sql
-- Veja o arquivo completo em supabase/create_maturacao_schedules.sql
```

A tabela armazena:
- Configurações da maturação (sessões, rodadas, tempo, pausas)
- Data/hora de início agendada
- Data/hora final calculada
- Status (agendado, executando, concluido, cancelado, erro)

## 🔧 Funcionalidades

### 1. Interface do Usuário

No modal de maturação (`ChipMaturationModal.tsx`):
- ✅ Checkbox "Agendar Maturação"
- ✅ Campo de Data de Início
- ✅ Campo de Hora de Início
- ✅ Cálculo automático de data/hora final
- ✅ Visualização da previsão de término

### 2. APIs

#### `POST /api/maturacao/schedule`
Cria um novo agendamento.

**Request:**
```json
{
  "sessions": ["serverId:sessionName", ...],
  "cadenceSeconds": 60,
  "messageTemplates": "...",
  "numberOfRounds": 5,
  "minutesPerRound": 15,
  "pauseMinutesBetweenRounds": 10,
  "scheduledStartAt": "2024-12-25T09:00:00Z",
  "scheduledEndAt": "2024-12-25T12:00:00Z" // Opcional, calculado automaticamente
}
```

**Response:**
```json
{
  "success": true,
  "schedule": {
    "id": "uuid",
    "scheduledStartAt": "2024-12-25T09:00:00Z",
    "scheduledEndAt": "2024-12-25T12:00:00Z",
    "status": "agendado"
  }
}
```

#### `POST /api/maturacao/execute-scheduled`
Executa agendamentos pendentes que chegaram na hora.

Este endpoint deve ser chamado periodicamente (cron job).

**Response:**
```json
{
  "success": true,
  "executed": 2,
  "total": 2,
  "executedIds": ["uuid1", "uuid2"]
}
```

#### `GET /api/maturacao/execute-scheduled`
Lista agendamentos do usuário autenticado.

## ⏰ Execução Automática (Cron Job)

### Opção 1: Usando Vercel Cron (Recomendado)

Crie arquivo `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/maturacao/execute-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Isso executa a cada 5 minutos.

### Opção 2: Usando Serviço Externo

Configure um cron job em um serviço como:
- **cron-job.org** (gratuito)
- **EasyCron**
- **GitHub Actions** (com workflow)

**URL do endpoint:**
```
POST https://seu-dominio.com/api/maturacao/execute-scheduled
```

**Frequência recomendada:** A cada 5 minutos

### Opção 3: Usando Node.js/cron local

Se estiver rodando localmente para testes:

```javascript
// scripts/run-scheduler.js
const cron = require('node-cron');
const fetch = require('node-fetch');

cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/maturacao/execute-scheduled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('[SCHEDULER]', data);
  } catch (error) {
    console.error('[SCHEDULER] Erro:', error);
  }
});

console.log('Scheduler iniciado (executa a cada 5 minutos)');
```

Execute: `node scripts/run-scheduler.js`

## 📊 Fluxo Completo

1. **Usuário agenda maturação**
   - Preenche data/hora no modal
   - Sistema calcula data/hora final automaticamente
   - Agendamento salvo no banco com status `agendado`

2. **Cron job verifica agendamentos** (a cada 5 minutos)
   - Busca agendamentos com status `agendado`
   - Verifica se `scheduled_start_at` está no passado (janela de 1 minuto)
   - Para cada agendamento encontrado:
     - Atualiza status para `executando`
     - Chama `/api/maturacao/start` com as configurações
     - Atualiza `maturation_id` e `executed_at`
     - Se erro, atualiza status para `erro` com `error_message`

3. **Maturação executa normalmente**
   - Usa o mesmo fluxo de maturação normal
   - Progresso e logs funcionam igual
   - Usuário pode ver status em tempo real

## 🔍 Monitoramento

### Ver agendamentos do usuário:

```bash
GET /api/maturacao/execute-scheduled
Authorization: Bearer <token>
```

### Status possíveis:
- `agendado`: Aguardando execução
- `executando`: Maturação em andamento
- `concluido`: Finalizada com sucesso
- `cancelado`: Cancelada pelo usuário
- `erro`: Erro na execução

## 🛠️ Manutenção

### Limpar agendamentos antigos

```sql
-- Remover agendamentos com mais de 30 dias
DELETE FROM maturacao_schedules
WHERE created_at < NOW() - INTERVAL '30 days'
AND status IN ('concluido', 'erro', 'cancelado');
```

### Verificar agendamentos pendentes

```sql
SELECT 
  id,
  scheduled_start_at,
  scheduled_end_at,
  status,
  number_of_rounds,
  minutes_per_round,
  created_at
FROM maturacao_schedules
WHERE status = 'agendado'
ORDER BY scheduled_start_at;
```

## ✅ Checklist de Implementação

- [x] Tabela SQL criada
- [x] Interface de agendamento no modal
- [x] API de criação de agendamento
- [x] API de execução de agendamentos
- [ ] Configurar cron job (Vercel ou externo)
- [ ] Testar agendamento
- [ ] Testar execução automática
- [ ] Monitorar logs e erros

## 📝 Notas

- O sistema calcula automaticamente a data/hora final baseada em:
  - Número de rodadas × Tempo por rodada
  - + Pausas entre rodadas
- A janela de execução é de ±1 minuto para evitar problemas de timing
- Agendamentos são vinculados ao `user_id` para segurança
- O sistema mantém histórico completo de execuções

