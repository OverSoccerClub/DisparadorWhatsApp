# Changelog - Fluxus Message

Todas as mudanças importantes do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).


## [0.1.11] - 2025-11-19

### Adicionado
- Sistema de changelog para registro de implementações importantes
- Página de manual do usuário acessível via sidebar
- Hash hexadecimal de 12 dígitos no rodapé para identificação de builds

### Alterado
- Removida exibição do ID do cliente na página de clientes
- Rodapé agora exibe apenas o hash de build ao invés de data/hora completa
- Status das sessões WAHA traduzidos para português com cores intuitivas

### Corrigido
- Erro 404 ao buscar QR code de sessões WAHA (agora tenta iniciar sessão automaticamente)
- Exclusão de instâncias Evolution API agora funciona corretamente em ambos os lados (API e Supabase)
- Erro de autenticação JWT em rotas de API (agora usa createServerClient corretamente)
- Erro `TypeError: r.closest is not a function` em tooltips


## [0.1.12] - 2025-11-20
### Adicionado
- Funcionalidades em desenvolvimento

## [0.1.13] - 2025-11-21
### Adicionado
- Funcionalidades em desenvolvimento

## [0.1.14] - 2025-11-21

### Adicionado
- Layout horizontal com scroll para sessões WAHA (sessões lado a lado)
- Indicadores visuais melhorados para status de servidores e sessões
- Cards de servidores redesenhados com melhor hierarquia visual

### Alterado
- Interface da página WAHA Sessions completamente redesenhada
- Cards de servidores com design moderno, bordas coloridas e efeitos hover
- Cards de sessões com layout horizontal e scroll suave
- Melhor organização visual com badges de status e ícones destacados
- Espaçamento e padding aumentados para melhor legibilidade
- Resumo de status com design em gradiente

### Melhorado
- Experiência do usuário na gestão de servidores e sessões WAHA
- Visualização intuitiva das sessões agrupadas por servidor
- Feedback visual para sessões ativas vs inativas

## [0.1.15] - 2025-11-22
### Adicionado
- Funcionalidades em desenvolvimento
## [Não Publicado]

### Adicionado
- Funcionalidades em desenvolvimento


## [0.1.10] - 2025-01-19

### Adicionado
- Sistema de hash de build para identificação de versões
- Modal de perfil do usuário com opção de alterar senha
- Ícones no menu do usuário (Perfil, Configurações, Sair)
- Tooltips automáticos para todos os botões
- Fonte Inter aplicada globalmente via next/font
- Documentação completa do sistema (Manual do Usuário)

### Alterado
- Padronização de botões: ícones e texto na mesma linha
- Melhorias na exibição de status das sessões WAHA
- Remoção do botão "Detalhes" das sessões WAHA

### Corrigido
- Erro SIGTERM no EasyPanel após atualização de variáveis de ambiente
- Erro de autenticação "Invalid credentials" no login
- Erro 404 ao cadastrar servidor WAHA
- Erro 500 ao criar campanhas
- Erro JWSError JWSInvalidSignature em configurações Evolution API

## [0.1.9] - 2025-01-19

### Adicionado
- Dockerfile otimizado para produção
- Endpoint de health check (`/api/health`)
- Suporte para WAHA API com gerenciamento de sessões e QR codes

### Alterado
- Scripts de start atualizados para usar `node .next/standalone/server.js`
- Migração de Nixpacks para Dockerfile no EasyPanel

### Corrigido
- Erro "next start does not work with output: standalone"
- Problemas de build e deploy no EasyPanel

## [0.1.8] - 2025-01-19

### Adicionado
- Configuração `output: 'standalone'` no Next.js
- Suporte para variáveis de ambiente em produção

### Alterado
- Atualização de scripts de build e start

## [0.1.7] - 2025-01-19

### Adicionado
- Sistema inicial de versionamento
- Integração com Supabase para autenticação e banco de dados
- Dashboard com métricas e gráficos
- Gerenciamento de clientes, campanhas e disparos
- Integração com Evolution API e WAHA

---

## Tipos de Mudanças

- **Adicionado**: para novas funcionalidades
- **Alterado**: para mudanças em funcionalidades existentes
- **Descontinuado**: para funcionalidades que serão removidas em breve
- **Removido**: para funcionalidades removidas
- **Corrigido**: para correção de bugs
- **Segurança**: para vulnerabilidades

