'use client'

import Footer from '@/components/Footer'
import NotificationProvider from '@/components/NotificationProvider'
import ChunkErrorHandler from '@/components/ChunkErrorHandler'
import GlobalLoading from '@/components/GlobalLoading'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { AlertProvider, useAlertContext } from '@/lib/contexts/AlertContext'
import PendingMaturationChecker from '@/components/PendingMaturationChecker'
import BackgroundMaturationWidget from '@/components/BackgroundMaturationWidget'
import AlertModal from '@/components/AlertModal'
import ButtonTooltipManager from '@/components/ButtonTooltipManager'
import { Toaster } from 'react-hot-toast'

interface AppProvidersProps {
  children: React.ReactNode
}

function AlertModalWrapper() {
  const { alert, closeAlert } = useAlertContext()
  return (
    <AlertModal
      open={alert.open}
      title={alert.title}
      message={alert.message}
      variant={alert.variant}
      onClose={closeAlert}
      autoCloseDelay={alert.autoCloseDelay}
    />
  )
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <GlobalLoading />
      <ChunkErrorHandler />
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <SidebarProvider>
              <NotificationProvider>
                <PendingMaturationChecker />
                <ButtonTooltipManager />
                {children}
                <BackgroundMaturationWidget />
                <Footer />
                <AlertModalWrapper />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--color-secondary-900)',
                      color: 'var(--color-secondary-100)',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </NotificationProvider>
            </SidebarProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </>
  )
}

