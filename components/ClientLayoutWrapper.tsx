'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import NotificationProvider from '@/components/NotificationProvider'
import ChunkErrorHandler from '@/components/ChunkErrorHandler'
import GlobalLoading from '@/components/GlobalLoading'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import PendingMaturationChecker from '@/components/PendingMaturationChecker'
import BackgroundMaturationWidget from '@/components/BackgroundMaturationWidget'
import { Toaster } from 'react-hot-toast'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR ou antes da montagem, renderizar apenas children
  // Isso evita problemas de hidratação
  if (!mounted) {
    return <>{children}</>
  }

  // Se for a página raiz (landing page), renderizar apenas children sem providers
  if (pathname === '/') {
    return <>{children}</>
  }

  // Para outras rotas, usar providers completos
  return (
    <>
      <GlobalLoading />
      <ChunkErrorHandler />
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <NotificationProvider>
              <PendingMaturationChecker />
              {children}
              <BackgroundMaturationWidget />
              <Footer />
            </NotificationProvider>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

