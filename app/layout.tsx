import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Carregar ClientLayoutWrapper dinamicamente sem SSR para evitar problemas de hidratação
const ClientLayoutWrapper = dynamic(
  () => import('@/components/ClientLayoutWrapper'),
  { 
    ssr: false,
    loading: () => <>{/* Fallback vazio durante carregamento */}</>
  }
)

export const metadata: Metadata = {
  title: 'Fluxus Menssager - Automação Inteligente',
  description: 'Plataforma profissional para automação e disparo de mensagens WhatsApp e Telegram com integração Supabase, Evolution API e WAHA',
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
