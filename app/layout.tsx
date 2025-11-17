import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Dynamic import para evitar problemas de SSR
const ConditionalLayoutWrapper = dynamic(
  () => import('@/components/ConditionalLayoutWrapper'),
  { 
    ssr: false,
    loading: () => <>{null}</>
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
        <ConditionalLayoutWrapper>
          {children}
        </ConditionalLayoutWrapper>
      </body>
    </html>
  )
}
