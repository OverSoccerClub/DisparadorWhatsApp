'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

// Carregar componentes dinamicamente apenas quando necessário
const AppProviders = dynamic(
  () => import('@/components/AppProviders'),
  { ssr: false }
)

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsLandingPage(pathname === '/')
  }, [pathname])

  // Durante SSR e antes da montagem, sempre renderizar apenas children
  if (!mounted) {
    return <>{children}</>
  }

  // Se for a página raiz (landing page), renderizar apenas children sem providers
  if (isLandingPage) {
    return <>{children}</>
  }

  // Para outras rotas, usar providers completos (carregados dinamicamente)
  return (
    <AppProviders>
      {children}
    </AppProviders>
  )
}

