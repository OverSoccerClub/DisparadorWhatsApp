import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Dynamic import para evitar problemas de SSR na landing page
const ClientLayoutWrapper = dynamic(
  () => import('@/components/ClientLayoutWrapper'),
  { 
    ssr: true, // Manter SSR mas com carregamento dinâmico
  }
)

export const metadata: Metadata = {
  title: 'WhatsApp Dispatcher - Automação Inteligente',
  description: 'Plataforma profissional para automação e disparo de mensagens WhatsApp com integração Supabase e Evolution API',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}
