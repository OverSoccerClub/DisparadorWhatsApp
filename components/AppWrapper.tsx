'use client'

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

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR, renderizar apenas children
  if (!mounted) {
    return <>{children}</>
  }

  // Após montagem, aplicar todos os providers
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

