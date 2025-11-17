'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ClientLayoutWrapper from './ClientLayoutWrapper'

interface ConditionalLayoutWrapperProps {
  children: React.ReactNode
}

export default function ConditionalLayoutWrapper({ children }: ConditionalLayoutWrapperProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Se for a página raiz, renderizar sem wrapper
  if (pathname === '/') {
    return <>{children}</>
  }

  // Para outras rotas, usar o ClientLayoutWrapper completo
  return <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
}

