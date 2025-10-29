'use client'

import { useNotificationContext } from './NotificationProvider'
import { BellIcon } from '@heroicons/react/24/outline'

export default function NotificationDemo() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showLoading, 
    updateNotification 
  } = useNotificationContext()

  const handleSuccessDemo = () => {
    showSuccess(
      'Operação concluída!', 
      'Sua campanha foi criada com sucesso e está pronta para ser iniciada.',
      [
        {
          label: 'Ver Campanha',
          action: () => console.log('Navegando para campanha...'),
          variant: 'primary'
        },
        {
          label: 'Criar Outra',
          action: () => console.log('Abrindo modal de criação...'),
          variant: 'secondary'
        }
      ]
    )
  }

  const handleErrorDemo = () => {
    showError(
      'Erro na operação',
      'Não foi possível conectar com o servidor. Verifique sua conexão.',
      [
        {
          label: 'Tentar Novamente',
          action: () => console.log('Tentando novamente...'),
          variant: 'primary'
        },
        {
          label: 'Contatar Suporte',
          action: () => console.log('Abrindo suporte...'),
          variant: 'secondary'
        }
      ]
    )
  }

  const handleWarningDemo = () => {
    showWarning(
      'Atenção necessária',
      'Esta campanha tem mais de 10.000 destinatários. O envio pode levar várias horas.',
      [
        {
          label: 'Continuar Mesmo Assim',
          action: () => console.log('Continuando...'),
          variant: 'primary'
        },
        {
          label: 'Revisar Lista',
          action: () => console.log('Revisando lista...'),
          variant: 'secondary'
        }
      ]
    )
  }

  const handleInfoDemo = () => {
    showInfo(
      'Dica importante',
      'Use variáveis como {{nome}} e {{telefone}} para personalizar suas mensagens.',
      [
        {
          label: 'Ver Exemplos',
          action: () => console.log('Mostrando exemplos...'),
          variant: 'primary'
        }
      ]
    )
  }

  const handleLoadingDemo = () => {
    const loadingId = showLoading(
      'Processando campanha...',
      'Criando lotes e preparando envio'
    )

    // Simular progresso
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      updateNotification(loadingId, { progress })
      
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          showSuccess('Campanha processada!', 'Todos os lotes foram criados com sucesso.')
        }, 500)
      }
    }, 200)
  }

  const handleDeleteDemo = () => {
    showWarning(
      'Confirmar exclusão de campanha',
      `Tem certeza que deseja excluir "Campanha de Teste"?\n\n⚠️ ATENÇÃO: Esta campanha está em processamento e tem 150 mensagens já enviadas.\n\n📊 Dados que serão perdidos:\n• 500 clientes cadastrados\n• 150 mensagens enviadas\n• Relatórios e estatísticas\n\nEsta ação não pode ser desfeita e todos os dados da campanha serão perdidos permanentemente.`,
      [
        {
          label: 'Excluir Mesmo Assim',
          action: () => {
            showSuccess('Campanha excluída!', 'A campanha foi removida com sucesso')
          },
          variant: 'danger'
        },
        {
          label: 'Cancelar',
          action: () => {},
          variant: 'secondary'
        }
      ],
      0, // Não fecha automaticamente
      false // Auto-close desabilitado
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-secondary-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BellIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-sm font-medium text-secondary-900">Demo de Notificações</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSuccessDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-success-600 rounded-md hover:bg-success-700 transition-colors"
          >
            Sucesso
          </button>
          
          <button
            onClick={handleErrorDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-error-600 rounded-md hover:bg-error-700 transition-colors"
          >
            Erro
          </button>
          
          <button
            onClick={handleWarningDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-warning-600 rounded-md hover:bg-warning-700 transition-colors"
          >
            Aviso
          </button>
          
          <button
            onClick={handleInfoDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Info
          </button>
          
          <button
            onClick={handleLoadingDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 transition-colors"
          >
            Loading
          </button>
          
          <button
            onClick={handleDeleteDemo}
            className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Exclusão
          </button>
        </div>
      </div>
    </div>
  )
}
