import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhatsApp Dispatcher - Automação Inteligente',
  description: 'Plataforma profissional para automação e disparo de mensagens WhatsApp com integração Supabase e Evolution API',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || ''
  const isLandingPage = pathname === '/' || pathname.endsWith('/')

  // Se for a página raiz, renderizar sem wrapper
  if (isLandingPage) {
    return (
      <html lang="pt-BR">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    )
  }

  // Para outras rotas, usar wrapper completo
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
