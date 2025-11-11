'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import PageHeader from './PageHeader'
import TelegramBotsManager from './TelegramBotsManager'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

export default function TelegramPage() {
  const { user: currentUser } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telegram"
        subtitle="Configure e gerencie seus bots do Telegram"
        icon={<PaperAirplaneIcon className="h-6 w-6" />}
      />

      {/* Gerenciamento de Bots do Telegram */}
      <TelegramBotsManager userId={currentUser?.id || ''} />
    </div>
  )
}

