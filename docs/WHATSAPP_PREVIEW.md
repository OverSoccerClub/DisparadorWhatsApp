# Preview do WhatsApp

## 🎯 Visão Geral

Sistema de preview que simula como a mensagem da campanha aparecerá dentro do WhatsApp, proporcionando uma experiência visual realista para o usuário.

## ✨ Funcionalidades

### 📱 **Interface Realista**
- **Design autêntico**: Cores, layout e elementos idênticos ao WhatsApp
- **Header completo**: Nome do contato, telefone e indicadores de status
- **Área de mensagens**: Balões de conversa com formatação adequada
- **Input simulado**: Campo de digitação como no WhatsApp real

### 🎨 **Elementos Visuais**
- **Avatar do contato**: Inicial do nome em círculo colorido
- **Status de entrega**: Ícones de confirmação (check azul)
- **Horário**: Timestamp realista das mensagens
- **Indicador de digitação**: Animação de "digitando..."
- **Balão da mensagem**: Formato e cores do WhatsApp

### 🔧 **Funcionalidades Técnicas**
- **Substituição de variáveis**: `{{nome}}`, `{{telefone}}`, `{{empresa}}`, `{{data}}`
- **Formatação de texto**: Suporte a negrito, itálico e código
- **Quebras de linha**: Preservação de formatação original
- **Animações**: Transições suaves de entrada/saída

## 🚀 Como Usar

### **1. No Modal de Detalhes da Campanha**
```tsx
<WhatsAppPreview 
  message={campanha.mensagem}
  recipientName="Cliente"
  recipientPhone="+55 11 99999-9999"
/>
```

### **2. No Modal de Criação de Campanha**
```tsx
{formData.mensagem && (
  <WhatsAppPreview 
    message={formData.mensagem}
    recipientName="Cliente"
    recipientPhone="+55 11 99999-9999"
  />
)}
```

### **3. Personalização Avançada**
```tsx
<WhatsAppPreview 
  message="Olá {{nome}}, sua compra de {{produto}} foi confirmada!"
  recipientName="João Silva"
  recipientPhone="+55 11 99999-9999"
  className="custom-class"
/>
```

## 🎨 Design System

### **Cores do WhatsApp**
- **Verde principal**: `#25D366` (header e botões)
- **Verde claro**: `#DCF8C6` (balão de mensagem)
- **Cinza claro**: `#F0F0F0` (fundo da conversa)
- **Azul**: `#0084FF` (ícones de confirmação)

### **Tipografia**
- **Fonte**: System font stack (como no WhatsApp)
- **Tamanhos**: Responsivos e legíveis
- **Peso**: Regular para texto, semibold para títulos

### **Layout**
- **Largura**: 320px (tamanho de smartphone)
- **Altura**: Adaptável ao conteúdo
- **Bordas**: Arredondadas como no WhatsApp
- **Sombras**: Sombra suave para profundidade

## 🔧 Variáveis Suportadas

### **Variáveis Básicas**
- `{{nome}}` → Nome do destinatário
- `{{telefone}}` → Telefone do destinatário
- `{{empresa}}` → Nome da empresa
- `{{data}}` → Data atual formatada

### **Exemplo de Uso**
```
Mensagem original:
"Olá {{nome}}, sua compra foi confirmada em {{data}}!"

Preview renderizado:
"Olá João Silva, sua compra foi confirmada em 15/12/2024!"
```

## 📱 Elementos da Interface

### **Header do WhatsApp**
- **Avatar**: Círculo com inicial do nome
- **Nome do contato**: Nome completo
- **Telefone**: Número formatado
- **Indicadores**: Três pontos (menu)

### **Área de Mensagens**
- **Balão da mensagem**: Verde com texto formatado
- **Timestamp**: Horário da mensagem
- **Status de entrega**: Check azul (entregue)
- **Indicador de digitação**: Animação de pontos

### **Input Simulado**
- **Campo de texto**: "Digite uma mensagem"
- **Botão de envio**: Ícone de avião
- **Estilo**: Idêntico ao WhatsApp

## 🎯 Benefícios

### **Para o Usuário**
1. **Visualização realista**: Vê exatamente como ficará a mensagem
2. **Teste de formatação**: Verifica se o texto está bem formatado
3. **Validação de variáveis**: Confirma se as variáveis funcionam
4. **Experiência imersiva**: Sensação de usar o WhatsApp real

### **Para o Desenvolvedor**
1. **Componente reutilizável**: Pode ser usado em qualquer lugar
2. **Fácil integração**: Props simples e intuitivas
3. **Customizável**: Classes CSS e estilos personalizáveis
4. **Responsivo**: Funciona em diferentes tamanhos de tela

## 🚀 Implementação Técnica

### **Estrutura do Componente**
```tsx
interface WhatsAppPreviewProps {
  message: string           // Mensagem a ser exibida
  recipientName?: string   // Nome do destinatário
  recipientPhone?: string  // Telefone do destinatário
  className?: string       // Classes CSS adicionais
}
```

### **Formatação de Mensagem**
```tsx
const formatMessage = (text: string) => {
  return text
    .replace(/\{\{nome\}\}/g, recipientName)
    .replace(/\{\{telefone\}\}/g, recipientPhone)
    .replace(/\{\{empresa\}\}/g, 'Sua Empresa')
    .replace(/\{\{data\}\}/g, new Date().toLocaleDateString('pt-BR'))
}
```

### **Estados do Componente**
- **showPreview**: Controla visibilidade do preview
- **formattedMessage**: Mensagem com variáveis substituídas
- **Animações**: Transições suaves de entrada/saída

## 📝 Exemplos de Uso

### **Mensagem Simples**
```
Input: "Olá! Como você está?"
Output: Preview com mensagem em balão verde
```

### **Mensagem com Variáveis**
```
Input: "Olá {{nome}}, sua compra foi confirmada!"
Output: "Olá João Silva, sua compra foi confirmada!"
```

### **Mensagem Formatada**
```
Input: "**Promoção especial!**\n\nDesconto de 50% em todos os produtos!"
Output: Preview com texto em negrito e quebras de linha
```

## 🎉 Resultado Final

O preview do WhatsApp oferece uma experiência visual completa e realista, permitindo que o usuário veja exatamente como sua mensagem aparecerá no WhatsApp antes de enviar a campanha. Isso aumenta a confiança e melhora significativamente a experiência do usuário.
