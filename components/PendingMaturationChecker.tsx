'use client'

import { usePendingMaturationCheck } from '@/hooks/usePendingMaturationCheck'

/**
 * Componente que verifica agendamentos pendentes quando o usuário acessa o sistema
 * Renderiza nada, apenas executa o hook
 */
export default function PendingMaturationChecker() {
  usePendingMaturationCheck()
  return null
}

