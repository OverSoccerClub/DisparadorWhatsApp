'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'
import SuccessModal from '@/components/SuccessModal'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState({
    open: false,
    title: 'Carregando...',
    message: 'Estamos processando sua solicitação. Aguarde um momento.'
  })
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: 'Sucesso!',
    message: 'Operação realizada com sucesso.'
  })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  // Verificar se componente foi montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Mostrar LoadingOverlay com mensagem específica
    setLoadingOverlay({
      open: true,
      title: isLogin ? 'Fazendo login...' : 'Criando conta...',
      message: isLogin 
        ? 'Estamos verificando suas credenciais. Aguarde um momento.'
        : 'Estamos criando sua conta. Aguarde um momento.'
    })

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        // Fechar LoadingOverlay
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        
        // Mostrar SuccessModal
        setSuccessModal({
          open: true,
          title: isLogin ? 'Login Realizado com Sucesso!' : 'Conta Criada com Sucesso!',
          message: isLogin 
            ? 'Bem-vindo de volta! Você será redirecionado para o dashboard.'
            : 'Sua conta foi criada com sucesso! Você será redirecionado para o dashboard.'
        })
        
        // Garantir que os cookies estejam aplicados e forçar navegação completa
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.replace('/')
      } else {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        setSuccessModal({
          open: true,
          title: 'Erro na Autenticação',
          message: data.message
        })
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
      setSuccessModal({
        open: true,
        title: 'Erro Interno',
        message: 'Erro interno do servidor. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Evitar problemas de hidratação
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <LoadingOverlay 
        open={loadingOverlay.open}
        title={loadingOverlay.title}
        message={loadingOverlay.message}
      />
      <SuccessModal 
        open={successModal.open}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal(prev => ({ ...prev, open: false }))}
        autoCloseDelay={5000}
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/img/logo_dispatcher.png" 
            alt="WhatsApp Dispatcher" 
            className="h-16 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Faça login em sua conta' : 'Crie sua conta'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Ou{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                crie uma nova conta
              </button>
            </>
          ) : (
            <>
              Ou{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                faça login com sua conta existente
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Fazendo login...' : 'Criando conta...'}
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar conta'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Conta padrão</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Usuário administrador:</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Email: <code className="bg-gray-200 px-1 rounded">admin@dispatcher.com</code>
                </p>
                <p className="text-sm text-gray-500">
                  Senha: <code className="bg-gray-200 px-1 rounded">admin123</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

