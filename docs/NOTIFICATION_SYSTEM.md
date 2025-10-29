# Sistema de Notificações Interativas

## 📋 Visão Geral

O sistema de notificações foi criado para fornecer feedback visual rico e interativo para o usuário, substituindo os toasts simples por notificações mais elaboradas com ações personalizadas.

## 🎯 Funcionalidades

### ✅ Tipos de Notificação
- **Sucesso**: Operações concluídas com sucesso
- **Erro**: Problemas que requerem atenção
- **Aviso**: Situações que precisam de confirmação
- **Info**: Informações úteis para o usuário
- **Loading**: Operações em andamento com barra de progresso

### 🎮 Recursos Interativos
- **Ações personalizadas**: Botões de ação dentro das notificações
- **Auto-close**: Fechamento automático com timer visual
- **Progresso**: Barra de progresso para operações longas
- **Animações**: Transições suaves de entrada e saída
- **Posicionamento**: Notificações empilhadas no canto superior direito

## 🚀 Como Usar

### 1. Hook de Notificações

```tsx
import { useNotificationContext } from '@/components/NotificationProvider'

function MeuComponente() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showLoading, 
    updateNotification 
  } = useNotificationContext()

  // Exemplos de uso...
}
```

### 2. Notificações Básicas

```tsx
// Sucesso simples
showSuccess('Operação concluída!', 'Sua campanha foi criada com sucesso.')

// Erro com detalhes
showError('Erro na operação', 'Não foi possível conectar com o servidor.')

// Aviso importante
showWarning('Atenção necessária', 'Esta operação não pode ser desfeita.')

// Informação útil
showInfo('Dica importante', 'Use variáveis como {{nome}} para personalizar.')
```

### 3. Notificações com Ações

```tsx
showSuccess(
  'Campanha criada!', 
  'Sua campanha está pronta para ser iniciada.',
  [
    {
      label: 'Ver Campanha',
      action: () => navegarParaCampanha(),
      variant: 'primary'
    },
    {
      label: 'Criar Outra',
      action: () => abrirModalCriacao(),
      variant: 'secondary'
    }
  ]
)
```

### 4. Notificações de Loading

```tsx
// Iniciar loading
const loadingId = showLoading(
  'Processando campanha...',
  'Criando lotes e preparando envio'
)

// Atualizar progresso
updateNotification(loadingId, { progress: 50 })

// Finalizar
updateNotification(loadingId, { 
  type: 'success',
  title: 'Processamento concluído!',
  message: 'Todos os lotes foram criados.'
})
```

## 🎨 Personalização

### Variantes de Botões
- **primary**: Botão principal (azul)
- **secondary**: Botão secundário (cinza)
- **danger**: Botão de perigo (vermelho)

### Duração Personalizada
```tsx
showInfo('Mensagem importante', 'Detalhes...', [], 10000) // 10 segundos
```

### Notificações Persistentes
```tsx
showWarning(
  'Atenção',
  'Esta operação pode demorar.',
  [],
  0, // 0 = não fecha automaticamente
  false // autoClose = false
)
```

## 📱 Responsividade

- **Desktop**: Notificações no canto superior direito
- **Mobile**: Notificações adaptadas para telas pequenas
- **Empilhamento**: Múltiplas notificações organizadas verticalmente

## 🔧 Configuração

### Provider Global
O sistema já está configurado no `app/layout.tsx`:

```tsx
<NotificationProvider>
  {children}
  <Footer />
</NotificationProvider>
```

### Estilos Personalizados
As notificações usam as cores do sistema:
- **Sucesso**: Verde (`success-*`)
- **Erro**: Vermelho (`error-*`)
- **Aviso**: Amarelo (`warning-*`)
- **Info**: Azul (`primary-*`)
- **Loading**: Cinza (`secondary-*`)

## 🎯 Exemplos Práticos

### Criação de Campanha
```tsx
const handleCriarCampanha = async (dados) => {
  const loadingId = showLoading('Criando campanha...', 'Processando dados...')
  
  try {
    const response = await fetch('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify(dados)
    })
    
    if (response.ok) {
      updateNotification(loadingId, {
        type: 'success',
        title: 'Campanha criada!',
        message: 'Sua campanha está pronta para ser iniciada.',
        actions: [
          {
            label: 'Iniciar Agora',
            action: () => iniciarCampanha(),
            variant: 'primary'
          }
        ]
      })
    } else {
      throw new Error('Erro na criação')
    }
  } catch (error) {
    showError('Erro ao criar campanha', error.message)
  }
}
```

### Confirmação de Exclusão
```tsx
const handleExcluir = (id) => {
  showWarning(
    'Confirmar exclusão',
    'Esta ação não pode ser desfeita.',
    [
      {
        label: 'Excluir',
        action: () => confirmarExclusao(id),
        variant: 'danger'
      },
      {
        label: 'Cancelar',
        action: () => {},
        variant: 'secondary'
      }
    ]
  )
}
```

## 🚀 Benefícios

1. **UX Melhorada**: Feedback visual rico e interativo
2. **Ações Contextuais**: Usuário pode agir diretamente nas notificações
3. **Progresso Visual**: Operações longas têm feedback de progresso
4. **Consistência**: Sistema unificado de notificações
5. **Acessibilidade**: Notificações com boa contraste e legibilidade

## 📝 Notas Importantes

- **Remover Demo**: O componente `NotificationDemo` deve ser removido em produção
- **Performance**: Notificações são automaticamente removidas após o tempo definido
- **Memória**: Sistema gerencia automaticamente a limpeza de notificações antigas
- **Responsividade**: Funciona perfeitamente em dispositivos móveis e desktop
