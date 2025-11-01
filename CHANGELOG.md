# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.2] - 2025-11-01

### Adicionado
- Sistema de agendamento de maturação de chips com data/hora de início e fim calculada
- Pausa configurável entre rodadas de maturação
- Fluxo de conversa humanizado com alternância entre participantes (A↔B)
- Cronômetro em tempo real na seção "Conversa Atual" mostrando tempo até próxima mensagem
- Widget flutuante de maturações em background no canto inferior direito
- Sistema de notificações para agendamentos pendentes ao acessar o sistema
- Controle de pausa, cancelamento e exclusão de agendamentos
- Notificação automática quando maturação é concluída
- Atualização automática do status de agendamentos para "concluido" ao finalizar

### Modificado
- Fluxo de conversa agora alterna mensagens entre dois participantes com delays humanizados (30-90s)
- Intervalo de polling reduzido de 2s para 10s para evitar rate limits do Supabase
- Implementado backoff exponencial para tratamento de rate limits (429)
- Removidos logs de console para preparação para produção
- Melhorado tratamento de timezone para agendamentos (preserva horário local)

### Corrigido
- Status de agendamentos agora é atualizado corretamente para "concluido" ao finalizar
- Timezone de agendamentos agora preserva horário local do usuário
- Rate limit do Supabase tratado com backoff exponencial automático
- Maturações agendadas agora iniciam automaticamente no horário correto

## [0.1.0] - 2024-12-XX

### Adicionado
- Sistema de versionamento com Git e GitHub
- Scripts de versionamento automatizado
- Documentação de changelog
- Workflows do GitHub Actions para CI/CD
- Sistema de tags para releases

### Funcionalidades Principais
- Dashboard completo com métricas em tempo real
- Gerenciamento de clientes (CRUD completo)
- Sistema de campanhas de disparo
- Integração WhatsApp via Evolution API e WAHA
- Sistema de filas assíncrono com Bull/Redis
- Relatórios avançados e estatísticas
- Interface responsiva e moderna

---

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correção de bugs
- `Segurança` para vulnerabilidades
