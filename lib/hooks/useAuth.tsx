'use client'

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useInactivityTimeout } from './useInactivityTimeout'
import { useAlertContext } from '@/lib/contexts/AlertContext'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  is_active: boolean
  is_admin: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Componente interno que usa o contexto de alertas
function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const alertContext = useAlertContext()

  // Verificar se usuário está autenticado (memoizado)
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Login (memoizado)
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        alertContext.showSuccess('Login realizado com sucesso!')
        return true
      } else {
        alertContext.showError(data.message || 'Erro ao fazer login')
        return false
      }
    } catch (error) {
      alertContext.showError('Erro interno do servidor')
      return false
    }
  }, [alertContext, setUser])

  // Registro (memoizado)
  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        alertContext.showSuccess('Conta criada com sucesso!')
        return true
      } else {
        alertContext.showError(data.message || 'Erro ao criar conta')
        return false
      }
    } catch (error) {
      alertContext.showError('Erro interno do servidor')
      return false
    }
  }, [alertContext, setUser])

  // Logout (memoizado)
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      // Erro silencioso no logout
    } finally {
      setUser(null)
      alertContext.showSuccess('Logout realizado com sucesso!')
      router.push('/auth')
    }
  }, [router, alertContext, setUser])

  // Atualizar dados do usuário (memoizado)
  const refreshUser = useCallback(async (): Promise<void> => {
    await checkAuth()
  }, [checkAuth])

  // Verificar autenticação na inicialização
  useEffect(() => {
    // Só verificar autenticação no cliente
    if (typeof window !== 'undefined') {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [checkAuth])

  // Monitorar inatividade e fazer logout automático após 30 minutos
  const handleInactivityTimeout = useCallback(async () => {
    if (user) {
      // Mostrar notificação antes de fazer logout
      alertContext.showError('Sessão expirada por inatividade. Faça login novamente.', 'Sessão Expirada', 5000)
      
      // Fazer logout
      await logout()
    }
  }, [user, logout, alertContext])

  // Configurar timeout de inatividade (30 minutos = 30 * 60 * 1000 ms)
  useInactivityTimeout({
    timeout: 30 * 60 * 1000, // 30 minutos em milissegundos
    onTimeout: handleInactivityTimeout,
    enabled: !!user // Só monitorar se o usuário estiver logado
  })

  // Memoizar o valor do contexto
  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshUser
  }), [user, loading, login, register, logout, refreshUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

