import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WhatsApp Dispatcher - Automação Inteligente de Mensagens',
  description: 'Plataforma profissional para automação e disparo de mensagens WhatsApp. Dispare mensagens em massa, gerencie campanhas e automatize processos com a solução mais completa do mercado.',
  keywords: 'WhatsApp, automação, disparo de mensagens, campanhas, marketing digital, WAHA, Evolution API',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}

