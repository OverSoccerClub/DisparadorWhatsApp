'use client'

import Footer from '@/components/Footer'
import NotificationProvider from '@/components/NotificationProvider'
import ChunkErrorHandler from '@/components/ChunkErrorHandler'
import GlobalLoading from '@/components/GlobalLoading'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import PendingMaturationChecker from '@/components/PendingMaturationChecker'
import BackgroundMaturationWidget from '@/components/BackgroundMaturationWidget'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  // Para rotas dentro de (app), usar providers completos
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
    </>
  )
}

