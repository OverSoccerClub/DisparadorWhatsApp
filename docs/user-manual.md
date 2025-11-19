# Manual do Usuário – Fluxus Message

> **Objetivo**  
> Ensinar novos operadores e gestores a configurar, operar e monitorar toda a plataforma de disparo de mensagens com segurança, eficiência e autonomia.

---

## 1. Visão Geral do Sistema

- **Plataforma**: aplicação web Next.js + Supabase para cadastro de clientes, campanhas e disparos integrados ao WhatsApp (Baileys/Evolution/WAHA) e automações n8n.
- **Perfis recomendados**:
  - *Administrador*: configura integrações (Supabase, Evolution API, WAHA, n8n, SMTP).
  - *Operador*: cria campanhas, dispara mensagens, monitora filas e resultados.
- **Pré-requisitos mínimos**:
  - Navegador atualizado (Chrome/Edge ≥ 115).
  - Conexão estável à internet.
  - Conta Supabase ativa com as tabelas providas em `supabase/MIGRATION_COMPLETE.sql`.
  - Instância WhatsApp autenticada (ou WAHA/Evolution configurados).
  - Redis operacional (para filas e monitoramentos).

---

## 2. Primeiros Passos

### 2.1 Acesso e Autenticação
1. Abra a URL fornecida pelo administrador (ex.: `https://app.seudominio.com`).
2. Informe **email** e **senha** cadastrados no Supabase Auth.
3. Em caso de erro 500, valide se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidas no servidor.
4. Recuperação de senha: utilize o fluxo nativo do Supabase ou solicite ao administrador (não há formulário público por padrão).

### 2.2 Checklist Inicial Pós-Login
| Item | Onde validar | O que observar |
| --- | --- | --- |
| Status WhatsApp/WAHA | Widget “Instance Monitor” | QR Code conectado, heartbeat recente |
| Evolução das filas | “Pending Maturation Checker” + dashboards de fila | Pendências ou travamentos |
| Credenciais | Página `Configurações` | Supabase, Evolution API, WAHA, n8n, SMTP preenchidos |

### 2.3 Conexão do WhatsApp
1. Vá em **Configurações → Integração WhatsApp**.
2. Clique em **Gerar QR Code** (ou “Reiniciar sessão”).
3. No app WhatsApp, acesse *Aparelhos conectados* e escaneie o QR.
4. Acompanhe o estado em **Instance Monitor**. Caso expire, repita o processo.

---

## 3. Navegação da Interface

- **Sidebar fixa** com módulos: Dashboard, Clientes, Campanhas, Disparos, Relatórios, Telegram, Configurações.
- **Header**: atalhos para notificações (toast), status da sessão, usuário logado e indicadores globais.
- **Widgets Globais**:
  - `GlobalLoading` / `LoadingOverlay`: indicam ações em progresso (importantes para uploads).
  - `NotificationProvider`: mostra sucessos/erros (toasts) — leia sempre antes de continuar.
  - `BackgroundMaturationWidget`: sinaliza tarefas em processamento no servidor (ex.: geração de variações).

---

## 4. Funcionalidades Principais

### 4.1 Dashboard
- **Objetivo**: visão macro das operações.
- **Principais cards**:
  - Mensagens enviadas/entregues/pendentes.
  - Campanhas em andamento.
  - Performance por período (Recharts).
- **Filtros**: período, status, tipo de campanha.
- **Boas práticas**:
  - Atualize a página após grandes disparos para garantir dados frescos.
  - Use os gráficos para identificar horários de maior engajamento.

### 4.2 Clientes
- **Ações disponíveis**:
  - Criar/editar/remover clientes.
  - Importar CSV (com validação automática de telefone).
  - Pesquisar por nome, telefone, email, status.
- **Fluxo de importação CSV**:
  1. Clique em **Importar CSV**.
  2. Use o template (colunas: `nome,telefone,email,status`).
  3. Valide pré-visualização; campos inválidos ficam destacados.
  4. Confirme para salvar. Os dados vão para Supabase com RLS por usuário.
- **Status**:
  - **Ativo**: apto a receber disparos/campanhas.
  - **Inativo**: excluído de seleções (mantido para histórico).

### 4.3 Campanhas
- **Criação**:
  1. Clique em **Nova Campanha**.
  2. Preencha nome, mensagem (use variáveis `{{nome}}`, `{{email}}`, `{{telefone}}`).
  3. Selecione destinatários (clientes, listas, CSV).
  4. Defina agendamento ou disparo imediato.
- **Gestão**:
  - **Status**: rascunho, agendada, enviando, pausada, concluída.
  - Podem ser duplicadas para reaproveitar texto/listas.
- **Boas práticas**:
  - Planeje lotes (rate limiting) para evitar bloqueios.
  - Sempre teste com um grupo pequeno antes de abrir para toda a base.

### 4.4 Disparos Diretos
- **Modal Disparo** permite:
  - Selecionar clientes existentes.
  - Inserir novos números (validados em tempo real).
  - Carregar variações de mensagem (via Gemini/n8n, se habilitado).
- **Validação automática**:
  - Formato E.164/Brasil ajustado (prefixos +55).
  - Limite de caracteres ~1600 (WhatsApp).
- **Workflow**:
  1. Preencha mensagem.
  2. Escolha destinatários.
  3. Clique em **Enviar** (ou agende).
  4. Acompanhe no painel de progresso (`SendingStatusOverlay`).

### 4.5 Relatórios
- **Métricas**: enviados, entregues, falhas, taxa de leitura, respostas.
- **Filtros**: período, campanha, operador.
- **Exportação**: CSV/Excel através do botão “Exportar”.
- **Uso recomendado**:
  - Exportar semanalmente para auditoria.
  - Conferir top campanhas para replicar estratégias.

### 4.6 Monitoramento e Background
- **Instance Monitor / InstanceMonitorBackground**: status da sessão WhatsApp, eventos de desconexão, reconexão automática.
- **PendingMaturationChecker**: identifica tarefas (variações, evoluções) travadas.
- **BackgroundMaturationModal/Widget**: exibe progresso de rotinas pesadas (treinamento, geração de chips).
- **Waha/Evolution/Telgram managers**: permitem conferir disponibilidades e estados de bots.

### 4.7 Configurações
- **Supabase**: URLs/keys (somente leitura aqui — ajuste via ambiente).
- **Evolution API / WAHA**: endpoints e tokens; necessários para disparos externos.
- **n8n**: URL de webhook, headers, tokens.
- **Emails (Resend/SMTP)**: envio de alertas/relatórios.
- **Limites e timers**: ajuste de intervalos de disparo, tentativas, TTL de filas.

### 4.8 Integração Telegram / n8n
- **TelegramPage / TelegramBotsManager**:
  - Registrar bots e templates de mensagens.
  - Acionar disparos multi-canal via modais dedicados.
- **Automação n8n**:
  - Use os webhooks documentados em `docs/N8N_*`.
  - Fluxo típico: `Webhook (Fluxus Message) → HTTP Request (Supabase) → Function (normaliza dados) → Telegram/Slack/CRM`.
  - **Boas práticas**:
    - Armazene credenciais no vault do n8n.
    - Trate erros com nós `IF` e `Error Trigger`.
    - Logue execuções críticas (Set + Notion/Sheet, por ex.).

---

## 5. Fluxos Especiais

### 5.1 Geração de Variações de Mensagem
1. Abra o modal **VariationsGenerationOverlay**.
2. Informe mensagem base e quantidade de variações.
3. Se configurado, o sistema usa Gemini API ou fluxo n8n (`docs/N8N_WORKFLOW_SETUP.md`) para gerar textos.
4. Acompanhe progresso em segundo plano. Ao finalizar, importe variações na campanha/disparo.
5. **Teste sugerido (QA)**:
   - Sucesso: variação gerada com parâmetros corretos.
   - Falha: API indisponível (usuário deve ver toast com instruções).
   - Borda: texto vazio ou limite excedido (validação bloqueia envio).

### 5.2 Processamento Assíncrono (Filas Bull/Redis)
- **Disparo** → cria job em fila `messages`.
- **Worker** (`scripts/worker.ts` → `dist/scripts/worker.js`) executa envios respeitando rate limit.
- **Retentativas**: até `max_tentativas` configurado (default 3).
- **Monitoramento**:
  - Dashboard mostra pendentes e falhas.
  - Erros críticos geram notificações.
  - Utilize `npm run worker:prod` para revisar logs.

### 5.3 Automação com n8n (Exemplo sugerido)
```
Webhook (Fluxus Message) 
  → HTTP Request (Supabase REST, autenticação header apikey) 
  → Function (formata payload p/ Telegram) 
  → Telegram node (mensagens ao time de vendas) 
  → IF (status = 'erro') → Slack node (alertas)
```
- **Melhores práticas**:
  - Use credenciais com escopo mínimo.
  - Centralize URL e tokens em variáveis n8n.
  - Adicione logging (Set + Google Sheets/DB) para auditoria.

---

## 6. Boas Práticas Operacionais

- **Gestão de contatos**: mantenha base limpa; remova duplicados, atualize status “inativo” após opt-out.
- **Mensagens**:
  - Respeite políticas do WhatsApp (evite spam, inclua opt-out).
  - Use variáveis para personalização real.
  - Teste preview no `WhatsAppPreview`/modal correspondente.
- **Campanhas**:
  - Agende fora de horários críticos da equipe.
  - Fracione grandes bases (ex.: 1k contatos → 4 lotes de 250).
  - Utilize o sistema de “Background Maturation” para preparar chips e prever gargalos.
- **Monitoramento**:
  - Tenha painel com alertas (Sentry, logs) para falhas de instância.
  - Configure alertas no Supabase para quedas de banco.
- **Segurança**:
  - Variáveis sensíveis só no servidor (service_role, JWT).
  - Ative Row-Level Security (já habilitada) e mantenha policies atualizadas.
  - Revise rotas API (ex.: `/api/auth/*`) em busca de respostas genéricas que não exponham detalhes internos.

---

## 7. FAQ & Troubleshooting

| Sintoma | Causa provável | Como resolver |
| --- | --- | --- |
| 500 em `/api/auth/login` | Variáveis Supabase ausentes | Preencher `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, reiniciar servidor |
| QR code não aparece | Sessão anterior travada | Limpe pasta `sessions/` e gere novo QR; valide conexão WAHA |
| Mensagens presas em “pendente” | Redis off-line ou worker parado | Verifique Redis (`docker ps`, `redis-cli ping`) e reinicie worker |
| “Invalid API key” | Token Evolution/WAHA incorreto | Atualize credenciais em Configurações e teste via botão “Testar conexão” |
| Lentidão na UI | Grande volume de dados sem filtro | Aplique filtros por período/status; limpe cache local (botão “clear cache”) |

---

## 8. Glossário Rápido

- **Supabase**: backend (Postgres + Auth + Storage) usado por todo o sistema.
- **RLS (Row Level Security)**: regra que garante que cada usuário enxergue apenas seus dados.
- **WAHA**: WhatsApp HTTP API usada como fallback/integração externa.
- **Evolution API**: provedor de envio multi-whatsapp.
- **n8n**: plataforma low-code para automações. Utilizada para integrações extras (Telegram, CRM, etc.).
- **Bull/Redis**: sistema de filas e armazenamento temporário para disparos e monitoramentos.

---

## 9. Referências e Recursos

- `README.md`: visão técnica do projeto.
- `docs/environment-setup.md`: configuração completa de variáveis.
- `docs/N8N_WORKFLOW_SETUP.md`, `docs/N8N_CREATE_WORKFLOW_STEP_BY_STEP.md`, `docs/N8N_WHATSAPP_INTEGRATION.md`: guias para construir automações robustas.
- `docs/instance-monitoring-system.md`: detalhes sobre monitoramento e reconexão.
- `docs/evolution-api-setup.md`: integrações externas.

---

### Dicas Finais
- Documente internamente seus fluxos (quem dispara, quando, limites aprovados).
- Tenha um processo de homologação: utilize ambientes separados para testes.
- **QA Tester**: para cada nova funcionalidade, escreva casos de sucesso, falha e borda (mesmo manuais). Exemplo rápido:
  - Sucesso: criar campanha, agendar, ver status concluído.
  - Falha: tentar enviar com mensagem vazia (UI deve bloquear).
  - Borda: importar CSV com 10k contatos (sistema deve notificar e criar fila).
- **Revisor**: monitore complexidade e acessibilidade ao desenvolver novas telas (use `aria-label` e componentes semânticos).

---

**Pronto!** Você tem agora um guia completo para operar o Fluxus Message de ponta a ponta. Para dúvidas adicionais, abra um ticket interno ou consulte o time técnico. Boas campanhas!

