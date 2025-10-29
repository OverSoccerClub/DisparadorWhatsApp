# Confirmação de Exclusão Interativa

## 🎯 Visão Geral

Sistema de confirmação inteligente para exclusão de campanhas, substituindo o `confirm()` nativo por notificações interativas e informativas.

## ✨ Funcionalidades

### 🔍 **Detecção Inteligente**
- **Status da campanha**: Detecta se está em processamento
- **Dados existentes**: Identifica quantos clientes e mensagens já foram processados
- **Impacto da exclusão**: Calcula o que será perdido

### 📊 **Informações Contextuais**
- **Nome da campanha**: Exibe o nome específico da campanha
- **Estatísticas**: Mostra clientes cadastrados e mensagens enviadas
- **Avisos especiais**: Alerta se a campanha está em processamento

### 🎨 **Interface Rica**
- **Mensagem detalhada**: Explicação clara do que será perdido
- **Botões contextuais**: Texto adaptado ao status da campanha
- **Cores apropriadas**: Botão de exclusão em vermelho (danger)
- **Persistência**: Não fecha automaticamente para evitar exclusões acidentais

## 🚀 Como Funciona

### 1. **Detecção Automática**
```tsx
const campanha = campanhas.find(c => c.id === campanhaId)
const isProcessing = statusCampanha === 'processando'
const hasProgress = totalClientes > 0 || clientesEnviados > 0
```

### 2. **Mensagem Dinâmica**
```tsx
let mensagemDetalhada = `Tem certeza que deseja excluir "${nomeCampanha}"?\n\n`

if (isProcessing) {
  mensagemDetalhada += `⚠️ ATENÇÃO: Esta campanha está em processamento...\n\n`
}

if (hasProgress) {
  mensagemDetalhada += `📊 Dados que serão perdidos:\n`
  mensagemDetalhada += `• ${totalClientes} clientes cadastrados\n`
  mensagemDetalhada += `• ${clientesEnviados} mensagens enviadas\n`
}
```

### 3. **Botões Contextuais**
```tsx
{
  label: isProcessing ? 'Excluir Mesmo Assim' : 'Sim, Excluir',
  action: () => confirmarExclusao(campanhaId),
  variant: 'danger'
}
```

## 📱 Exemplos de Uso

### **Campanha em Rascunho**
```
Confirmar exclusão de campanha

Tem certeza que deseja excluir "Campanha de Marketing"?

Esta ação não pode ser desfeita e todos os dados da campanha serão perdidos permanentemente.

[Sim, Excluir] [Cancelar]
```

### **Campanha com Progresso**
```
Confirmar exclusão de campanha

Tem certeza que deseja excluir "Campanha de Vendas"?

📊 Dados que serão perdidos:
• 1.250 clientes cadastrados
• 850 mensagens enviadas
• Relatórios e estatísticas

Esta ação não pode ser desfeita e todos os dados da campanha serão perdidos permanentemente.

[Sim, Excluir] [Cancelar]
```

### **Campanha em Processamento**
```
Confirmar exclusão de campanha

Tem certeza que deseja excluir "Campanha Urgente"?

⚠️ ATENÇÃO: Esta campanha está em processamento e tem 150 mensagens já enviadas.

📊 Dados que serão perdidos:
• 500 clientes cadastrados
• 150 mensagens enviadas
• Relatórios e estatísticas

Esta ação não pode ser desfeita e todos os dados da campanha serão perdidos permanentemente.

[Excluir Mesmo Assim] [Cancelar]
```

## 🎨 Design System

### **Cores e Variantes**
- **Título**: Amarelo (warning) para indicar atenção
- **Botão Excluir**: Vermelho (danger) para indicar perigo
- **Botão Cancelar**: Cinza (secondary) para ação neutra

### **Ícones e Emojis**
- **⚠️**: Aviso para campanhas em processamento
- **📊**: Estatísticas e dados que serão perdidos
- **🔴**: Botão de exclusão em vermelho

### **Tipografia**
- **Título**: Negrito e destacado
- **Mensagem**: Texto claro com quebras de linha
- **Lista**: Bullets para organizar informações

## 🔧 Configuração Técnica

### **Parâmetros da Notificação**
```tsx
showWarning(
  'Confirmar exclusão de campanha',  // Título
  mensagemDetalhada,                  // Mensagem
  [                                   // Ações
    { label: 'Excluir', action: () => {}, variant: 'danger' },
    { label: 'Cancelar', action: () => {}, variant: 'secondary' }
  ],
  0,                                  // Duração (0 = não fecha)
  false                               // Auto-close desabilitado
)
```

### **Persistência**
- **Duração**: 0 (não fecha automaticamente)
- **Auto-close**: false (requer ação do usuário)
- **Motivo**: Evitar exclusões acidentais

## 🎯 Benefícios

### **Para o Usuário**
1. **Informação completa**: Sabe exatamente o que será perdido
2. **Contexto claro**: Entende o impacto da exclusão
3. **Segurança**: Não pode excluir acidentalmente
4. **Controle**: Pode cancelar a qualquer momento

### **Para o Sistema**
1. **Prevenção de erros**: Reduz exclusões acidentais
2. **Auditoria**: Usuário confirma conscientemente
3. **UX melhorada**: Interface mais profissional
4. **Feedback rico**: Informações detalhadas

## 🚀 Implementação

### **Substituição do `confirm()`**
```tsx
// ❌ Antes (nativo)
if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

// ✅ Depois (interativo)
showWarning('Confirmar exclusão', mensagemDetalhada, [
  { label: 'Excluir', action: () => confirmarExclusao(), variant: 'danger' },
  { label: 'Cancelar', action: () => {}, variant: 'secondary' }
])
```

### **Fluxo Completo**
1. **Usuário clica em excluir**
2. **Sistema analisa a campanha**
3. **Gera mensagem contextual**
4. **Exibe notificação interativa**
5. **Usuário confirma ou cancela**
6. **Executa exclusão se confirmado**
7. **Exibe feedback de sucesso**

## 📝 Notas Importantes

- **Persistência**: Notificação não fecha automaticamente
- **Contexto**: Mensagem adaptada ao status da campanha
- **Segurança**: Múltiplas camadas de confirmação
- **UX**: Interface rica e informativa
- **Acessibilidade**: Botões claros e contrastantes
