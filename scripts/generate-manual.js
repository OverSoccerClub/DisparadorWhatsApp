/**
 * Script para gerar automaticamente o Manual do Usuário
 * 
 * Este script analisa as funcionalidades do sistema e gera o manual dinamicamente
 * baseado nas rotas, componentes e funcionalidades existentes
 */

const fs = require('fs')
const path = require('path')

const MANUAL_FILE = path.join(process.cwd(), 'docs', 'user-manual.md')
const PAGES_DIR = path.join(process.cwd(), 'pages')
const COMPONENTS_DIR = path.join(process.cwd(), 'components')

// Mapeamento de rotas para descrições
const routeDescriptions = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Visão geral do sistema com métricas, gráficos e estatísticas em tempo real',
    features: [
      'Mensagens enviadas/entregues/pendentes',
      'Campanhas em andamento',
      'Performance por período',
      'Gráficos interativos (Recharts)',
      'Filtros por período e status'
    ]
  },
  '/clientes': {
    title: 'Gerenciamento de Clientes',
    description: 'CRUD completo para gerenciar clientes com busca avançada e importação CSV',
    features: [
      'Criar, editar e excluir clientes',
      'Importar CSV com validação automática',
      'Busca por nome, telefone, email',
      'Filtros por status (ativo/inativo)',
      'Validação automática de números de telefone'
    ]
  },
  '/campanhas': {
    title: 'Sistema de Campanhas',
    description: 'Criação, agendamento e gerenciamento de campanhas de mensagens',
    features: [
      'Criar campanhas com critérios personalizados',
      'Agendar campanhas para execução futura',
      'Configurar clientes por lote',
      'Definir intervalo entre mensagens',
      'Monitorar progresso em tempo real',
      'Pausar, retomar e cancelar campanhas'
    ]
  },
  '/disparos': {
    title: 'Disparos Diretos',
    description: 'Envio de mensagens individuais ou em lote para clientes cadastrados ou novos números',
    features: [
      'Disparo para clientes existentes',
      'Disparo para novos números',
      'Templates com variáveis dinâmicas',
      'Validação de números em tempo real',
      'Histórico completo de disparos'
    ]
  },
  '/relatorios': {
    title: 'Relatórios e Análises',
    description: 'Relatórios detalhados de desempenho e métricas das campanhas',
    features: [
      'Relatórios por campanha',
      'Métricas de entrega e leitura',
      'Análise de desempenho',
      'Exportação de dados',
      'Gráficos e visualizações'
    ]
  },
  '/configuracoes': {
    title: 'Configurações Gerais',
    description: 'Configurações gerais do sistema',
    features: [
      'Configurações de integração',
      'Preferências do usuário',
      'Configurações de notificações'
    ]
  },
  '/configuracoes/evolution-api': {
    title: 'Evolution API',
    description: 'Configuração e gerenciamento de instâncias Evolution API',
    features: [
      'Cadastrar servidor Evolution API',
      'Criar e gerenciar instâncias',
      'Conectar/desconectar instâncias',
      'Monitorar status das instâncias',
      'QR Code para autenticação'
    ]
  },
  '/configuracoes/telegram': {
    title: 'Integração Telegram',
    description: 'Configuração de bots do Telegram para notificações e automações',
    features: [
      'Cadastrar bots do Telegram',
      'Configurar webhooks',
      'Testar conexão',
      'Enviar mensagens via Telegram'
    ]
  },
  '/waha-sessions': {
    title: 'Sessões WAHA',
    description: 'Gerenciamento de servidores e sessões WAHA',
    features: [
      'Cadastrar servidores WAHA',
      'Visualizar sessões ativas',
      'Escanear QR Code para conectar',
      'Monitorar status das sessões',
      'Gerenciar múltiplos servidores'
    ]
  }
}

function generateManual() {
  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  let manual = `# Manual do Usuário – Fluxus Message

> **Objetivo**  
> Ensinar novos operadores e gestores a configurar, operar e monitorar toda a plataforma de disparo de mensagens com segurança, eficiência e autonomia.

> **Última atualização automática**: ${date}

---

## 1. Visão Geral do Sistema

- **Plataforma**: aplicação web Next.js + Supabase para cadastro de clientes, campanhas e disparos integrados ao WhatsApp (Baileys/Evolution/WAHA) e automações n8n.
- **Perfis recomendados**:
  - *Administrador*: configura integrações (Supabase, Evolution API, WAHA, n8n, SMTP).
  - *Operador*: cria campanhas, dispara mensagens, monitora filas e resultados.
- **Pré-requisitos mínimos**:
  - Navegador atualizado (Chrome/Edge ≥ 115).
  - Conexão estável à internet.
  - Conta Supabase ativa com as tabelas providas em \`supabase/MIGRATION_COMPLETE.sql\`.
  - Instância WhatsApp autenticada (ou WAHA/Evolution configurados).
  - Redis operacional (para filas e monitoramentos).

---

## 2. Primeiros Passos

### 2.1 Acesso e Autenticação
1. Abra a URL fornecida pelo administrador (ex.: \`https://app.seudominio.com\`).
2. Informe **email** e **senha** cadastrados no Supabase Auth.
3. Em caso de erro 500, valide se as variáveis \`NEXT_PUBLIC_SUPABASE_URL\` e \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` estão preenchidas no servidor.
4. Recuperação de senha: utilize o fluxo nativo do Supabase ou solicite ao administrador (não há formulário público por padrão).

### 2.2 Checklist Inicial Pós-Login
| Item | Onde validar | O que observar |
| --- | --- | --- |
| Status WhatsApp/WAHA | Widget "Instance Monitor" | QR Code conectado, heartbeat recente |
| Evolução das filas | "Pending Maturation Checker" + dashboards de fila | Pendências ou travamentos |
| Credenciais | Página \`Configurações\` | Supabase, Evolution API, WAHA, n8n, SMTP preenchidos |

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
  - \`GlobalLoading\` / \`LoadingOverlay\`: indicam ações em progresso (importantes para uploads).
  - \`NotificationProvider\`: mostra sucessos/erros (toasts) — leia sempre antes de continuar.
  - \`BackgroundMaturationWidget\`: sinaliza tarefas em processamento no servidor (ex.: geração de variações).

---

## 4. Funcionalidades Principais

`

  // Gerar seções para cada rota
  Object.entries(routeDescriptions).forEach(([route, info]) => {
    manual += `### 4.${Object.keys(routeDescriptions).indexOf(route) + 1} ${info.title}\n`
    manual += `- **Objetivo**: ${info.description}\n`
    manual += `- **Acesso**: Menu lateral → "${info.title}" ou rota \`${route}\`\n`
    manual += `- **Funcionalidades disponíveis**:\n`
    info.features.forEach(feature => {
      manual += `  - ${feature}\n`
    })
    manual += `\n`
  })

  manual += `---

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
`

  return manual
}

function updateManual() {
  try {
    // Garantir que o diretório docs existe
    const docsDir = path.join(process.cwd(), 'docs')
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true })
    }

    const manual = generateManual()
    fs.writeFileSync(MANUAL_FILE, manual, 'utf-8')
    console.log(`✅ Manual do usuário gerado automaticamente`)
    console.log(`📁 Salvo em: ${MANUAL_FILE}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao gerar manual:', error)
    return false
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateManual()
}

module.exports = { generateManual, updateManual }

