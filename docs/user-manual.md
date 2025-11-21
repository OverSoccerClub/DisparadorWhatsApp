# Manual do Usuário – Fluxus Message

> **Objetivo**  
> Ensinar novos operadores e gestores a configurar, operar e monitorar toda a plataforma de disparo de mensagens com segurança, eficiência e autonomia.

> **Última atualização automática**: 21 de novembro de 2025

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
| Status WhatsApp/WAHA | Widget "Instance Monitor" | QR Code conectado, heartbeat recente |
| Evolução das filas | "Pending Maturation Checker" + dashboards de fila | Pendências ou travamentos |
| Credenciais | Página `Configurações` | Supabase, Evolution API, WAHA, n8n, SMTP preenchidos |

### 2.3 Conexão do WhatsApp
1. Vá em **Configurações → Evolution API** ou **Configurações → Sessões WAHA**.
2. Clique em **Gerar QR Code** (ou "Reiniciar sessão").
3. No app WhatsApp, acesse *Aparelhos conectados* e escaneie o QR.
4. Acompanhe o estado em **Instance Monitor**. Caso expire, repita o processo.

---

## 3. Navegação da Interface

- **Sidebar fixa** com módulos: Dashboard, Clientes, Campanhas, Disparos, Relatórios, Configurações.
- **Header**: atalhos para notificações (toast), status da sessão, usuário logado e indicadores globais.
- **Rodapé do Sidebar**: Links para Manual e Changelog.
- **Widgets Globais**:
  - `GlobalLoading` / `LoadingOverlay`: indicam ações em progresso (importantes para uploads).
  - `NotificationProvider`: mostra sucessos/erros (toasts) — leia sempre antes de continuar.
  - `BackgroundMaturationWidget`: sinaliza tarefas em processamento no servidor (ex.: geração de variações).

---

## 4. Funcionalidades Principais

### 4.1 Dashboard
- **Objetivo**: Visão geral do sistema com métricas, gráficos e estatísticas em tempo real
- **Acesso**: Menu lateral → "Dashboard" ou rota `/dashboard`
- **Funcionalidades disponíveis**:
  - Mensagens enviadas/entregues/pendentes
  - Campanhas em andamento
  - Performance por período
  - Gráficos interativos (Recharts)
  - Filtros por período e status

### 4.2 Gerenciamento de Clientes
- **Objetivo**: CRUD completo para gerenciar clientes com busca avançada e importação CSV
- **Acesso**: Menu lateral → "Gerenciamento de Clientes" ou rota `/clientes`
- **Funcionalidades disponíveis**:
  - Criar, editar e excluir clientes
  - Importar CSV com validação automática
  - Busca por nome, telefone, email
  - Filtros por status (ativo/inativo)
  - Validação automática de números de telefone

### 4.3 Sistema de Campanhas
- **Objetivo**: Criação, agendamento e gerenciamento de campanhas de mensagens
- **Acesso**: Menu lateral → "Sistema de Campanhas" ou rota `/campanhas`
- **Funcionalidades disponíveis**:
  - Criar campanhas com critérios personalizados
  - Agendar campanhas para execução futura
  - Configurar clientes por lote
  - Definir intervalo entre mensagens
  - Monitorar progresso em tempo real
  - Pausar, retomar e cancelar campanhas

### 4.4 Disparos Diretos
- **Objetivo**: Envio de mensagens individuais ou em lote para clientes cadastrados ou novos números
- **Acesso**: Menu lateral → "Disparos Diretos" ou rota `/disparos`
- **Funcionalidades disponíveis**:
  - Disparo para clientes existentes
  - Disparo para novos números
  - Templates com variáveis dinâmicas
  - Validação de números em tempo real
  - Histórico completo de disparos

### 4.5 Relatórios e Análises
- **Objetivo**: Relatórios detalhados de desempenho e métricas das campanhas
- **Acesso**: Menu lateral → "Relatórios e Análises" ou rota `/relatorios`
- **Funcionalidades disponíveis**:
  - Relatórios por campanha
  - Métricas de entrega e leitura
  - Análise de desempenho
  - Exportação de dados
  - Gráficos e visualizações

### 4.6 Configurações Gerais
- **Objetivo**: Configurações gerais do sistema
- **Acesso**: Menu lateral → "Configurações Gerais" ou rota `/configuracoes`
- **Funcionalidades disponíveis**:
  - Configurações de integração
  - Preferências do usuário
  - Configurações de notificações

### 4.7 Evolution API
- **Objetivo**: Configuração e gerenciamento de instâncias Evolution API
- **Acesso**: Menu lateral → "Evolution API" ou rota `/configuracoes/evolution-api`
- **Funcionalidades disponíveis**:
  - Cadastrar servidor Evolution API
  - Criar e gerenciar instâncias
  - Conectar/desconectar instâncias
  - Monitorar status das instâncias
  - QR Code para autenticação

### 4.8 Integração Telegram
- **Objetivo**: Configuração de bots do Telegram para notificações e automações
- **Acesso**: Menu lateral → "Integração Telegram" ou rota `/configuracoes/telegram`
- **Funcionalidades disponíveis**:
  - Cadastrar bots do Telegram
  - Configurar webhooks
  - Testar conexão
  - Enviar mensagens via Telegram

### 4.9 Sessões WAHA
- **Objetivo**: Gerenciamento de servidores e sessões WAHA
- **Acesso**: Menu lateral → "Sessões WAHA" ou rota `/waha-sessions`
- **Funcionalidades disponíveis**:
  - Cadastrar servidores WAHA
  - Visualizar sessões ativas
  - Escanear QR Code para conectar
  - Monitorar status das sessões
  - Gerenciar múltiplos servidores

---

## 5. Configurações e Integrações

### 5.1 Evolution API
1. Acesse **Configurações → Evolution API**.
2. Preencha:
   - URL da API Evolution
   - API Key Global
   - Webhook URL (opcional)
3. Clique em **Salvar Configuração**.
4. Para criar instâncias:
   - Clique em **Nova Instância**.
   - Informe o nome da instância.
   - Escaneie o QR Code para conectar.

### 5.2 WAHA API
1. Acesse **Configurações → Sessões WAHA**.
2. Clique em **Adicionar Servidor**.
3. Preencha:
   - Nome do servidor
   - URL da API WAHA
   - API Key
   - Configurações de timeout e retry
4. Salve e visualize as sessões disponíveis.
5. Para conectar uma sessão, clique em **Escanear QR Code**.

### 5.3 Telegram
1. Acesse **Configurações → Telegram**.
2. Clique em **Adicionar Bot**.
3. Preencha:
   - Nome do bot
   - Token do bot (obtido via @BotFather)
   - Chat ID (opcional)
4. Teste a conexão antes de salvar.

---

## 6. Boas Práticas

### 6.1 Gerenciamento de Clientes
- Sempre valide números antes de importar em massa.
- Use grupos/tags para organizar clientes.
- Mantenha dados atualizados para melhor personalização.

### 6.2 Campanhas
- Teste campanhas com pequenos grupos antes de disparos em massa.
- Configure intervalos adequados para evitar bloqueios.
- Monitore o progresso regularmente.

### 6.3 Disparos
- Use templates com variáveis para personalização.
- Valide números antes de enviar.
- Mantenha histórico para auditoria.

### 6.4 Segurança
- Não compartilhe credenciais de API.
- Use senhas fortes.
- Mantenha backups regulares dos dados.

---

## 7. Solução de Problemas

### 7.1 Erro de Autenticação
- Verifique se as variáveis de ambiente estão configuradas.
- Confirme se o usuário existe no Supabase Auth.
- Tente fazer logout e login novamente.

### 7.2 QR Code não aparece
- Verifique se a API Evolution/WAHA está acessível.
- Confirme se as credenciais estão corretas.
- Tente reiniciar a instância/sessão.

### 7.3 Mensagens não são enviadas
- Verifique o status da instância/sessão.
- Confirme se há mensagens na fila.
- Verifique os logs do sistema.

---

## 8. Suporte

Para suporte técnico, entre em contato com o administrador do sistema ou consulte a documentação técnica disponível no repositório do projeto.

---

*Este manual é gerado automaticamente pelo sistema e reflete as funcionalidades disponíveis na versão atual.*
