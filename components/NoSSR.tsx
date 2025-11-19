'use client'

import { useEffect, useState } from 'react'

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que garante que seus children NUNCA sejam renderizados durante SSR.
 * Isso resolve problemas de hidratação ao garantir que o servidor nunca renderize
 * o conteúdo, apenas o cliente após a montagem completa.
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // Aguardar dois ciclos de renderização para garantir que estamos no cliente
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

