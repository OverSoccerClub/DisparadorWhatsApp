import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import LoadingOverlay from '@/components/LoadingOverlay'
import SuccessModal from '@/components/SuccessModal'
import { formatVersion } from '@/lib/config/version'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'

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
    name: '',
    phone: ''
  })
  const [activationCode, setActivationCode] = useState('')
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [activating, setActivating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Verificar se componente foi montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpar erro do campo ao digitar
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Nome é obrigatório'
      }
      if (!formData.phone) {
        newErrors.phone = 'Telefone é obrigatório'
      } else if (!/^[\d\s\(\)\-\+]{10,15}$/.test(formData.phone)) {
        newErrors.phone = 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulário antes de enviar
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setErrors({})
    
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
        : { email: formData.email, password: formData.password, name: formData.name, phone: formData.phone }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      // Verificar se a resposta é JSON válido antes de parsear
      let data
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          // Se não for JSON, criar objeto de erro
          const text = await response.text()
          data = {
            success: false,
            message: text || `Erro ${response.status}: ${response.statusText}`
          }
        }
      } catch (parseError) {
        // Se houver erro ao parsear JSON, criar objeto de erro
        console.error('Erro ao parsear resposta:', parseError)
        data = {
          success: false,
          message: `Erro ${response.status}: ${response.statusText || 'Erro ao processar resposta'}`
        }
      }

      if (data.success) {
        // Fechar LoadingOverlay
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        
        if (isLogin) {
          // Login: redirecionar para página protegida
          setSuccessModal({
            open: true,
            title: 'Login Realizado com Sucesso!',
            message: 'Bem-vindo de volta! Você será redirecionado para o dashboard.'
          })
          
          await new Promise(resolve => setTimeout(resolve, 500))
          // Redirecionar para o dashboard
          router.push('/dashboard')
        } else {
          // Registro: verificar se precisa ativação
          if (data.requiresActivation) {
            // Mostrar modal de ativação
            setShowActivationModal(true)
            if (data.activationCode) {
              setActivationCode(data.activationCode)
            }
            setSuccessModal({
              open: true,
              title: 'Conta Criada com Sucesso!',
              message: data.message || 'Você receberá o código de ativação no seu WhatsApp em instantes.'
            })
          } else {
            // Conta já ativada (não deveria acontecer, mas por segurança)
            setSuccessModal({
              open: true,
              title: 'Conta Criada com Sucesso!',
              message: 'Sua conta foi criada com sucesso! Você será redirecionado para o dashboard.'
            })
            await new Promise(resolve => setTimeout(resolve, 500))
            router.push('/dashboard')
          }
        }
      } else {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        
        // Mapear erros comuns para campos específicos
        const errorMessage = data.message || 'Erro ao processar solicitação'
        const errorType = data.error || ''
        
        // Erros de configuração do banco devem ser mostrados como modal
        if (errorType === 'database_schema_error' || errorType === 'missing_env_vars' || errorType === 'invalid_supabase_url') {
          setSuccessModal({
            open: true,
            title: 'Erro de Configuração',
            message: errorMessage
          })
        } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          setErrors({ email: errorMessage })
        } else if (errorMessage.includes('telefone') || errorMessage.includes('Telefone') || errorMessage.includes('phone')) {
          setErrors({ phone: errorMessage })
        } else if (errorMessage.includes('senha') || errorMessage.includes('Senha') || errorMessage.includes('password')) {
          setErrors({ password: errorMessage })
        } else {
          setSuccessModal({
            open: true,
            title: 'Erro na Autenticação',
            message: errorMessage
          })
        }
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

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setActivating(true)
    setLoadingOverlay({
      open: true,
      title: 'Ativando conta...',
      message: 'Estamos verificando seu código de ativação. Aguarde um momento.'
    })

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email, code: activationCode })
      })

      // Verificar se a resposta é JSON válido antes de parsear
      let data
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          // Se não for JSON, criar objeto de erro
          const text = await response.text()
          data = {
            success: false,
            message: text || `Erro ${response.status}: ${response.statusText}`
          }
        }
      } catch (parseError) {
        // Se houver erro ao parsear JSON, criar objeto de erro
        console.error('Erro ao parsear resposta:', parseError)
        data = {
          success: false,
          message: `Erro ${response.status}: ${response.statusText || 'Erro ao processar resposta'}`
        }
      }

      if (data.success) {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        setSuccessModal({
          open: true,
          title: 'Conta Ativada!',
          message: 'Sua conta foi ativada com sucesso! Faça login para continuar.'
        })
        setShowActivationModal(false)
        setIsLogin(true) // Redirecionar para o formulário de login
      } else {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        setSuccessModal({
          open: true,
          title: 'Erro na Ativação',
          message: data.message || 'Erro ao ativar conta. Verifique o código e tente novamente.'
        })
      }
    } catch (error) {
      console.error('Erro na ativação:', error)
      setLoadingOverlay(prev => ({ ...prev, open: false }))
      setSuccessModal({
        open: true,
        title: 'Erro Interno',
        message: 'Erro interno do servidor. Tente novamente.'
      })
    } finally {
      setActivating(false)
    }
  }

  // Evitar problemas de hidratação
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Registrar'} - Fluxus Message</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50/50 via-white to-accent-50/30 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

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
          autoCloseDelay={3000}
        />

        {showActivationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">Ativar Conta</h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-6">
                Um código de ativação foi enviado para o seu WhatsApp. Por favor, insira-o abaixo para ativar sua conta.
              </p>
              <form onSubmit={handleActivate}>
                <div className="mb-4">
                  <label htmlFor="activationCode" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Código de Ativação
                  </label>
                  <input
                    type="text"
                    id="activationCode"
                    className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Insira o código de 6 dígitos"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowActivationModal(false)}
                    className="px-4 py-2 text-secondary-600 dark:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center"
                    disabled={activating}
                  >
                    {activating ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Ativar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Header com Logo e Título */}
          <div className="bg-white dark:bg-secondary-800 px-6 pt-6 pb-4 text-center border-b border-secondary-200 dark:border-secondary-700 rounded-t-lg">
            <div className="flex justify-center mb-4">
              <img 
                src="/img/logo_marca_02_trasp.png" 
                alt="Fluxus Message" 
                className="h-32 md:h-40 lg:h-48 w-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {isLogin ? 'Faça login para acessar sua conta' : 'Preencha os dados para criar sua conta'}
            </p>
          </div>

          {/* Formulário */}
          <div className="bg-white dark:bg-secondary-800 py-8 px-4 shadow-lg rounded-b-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-error-600">{errors.email}</p>}
              </div>

              {/* Campo Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    )}
                  </div>
                </div>
                {errors.password && <p className="mt-2 text-sm text-error-600">{errors.password}</p>}
              </div>

              {/* Campos de Registro (condicional) */}
              {!isLogin && (
                <>
                  {/* Campo Nome */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Nome Completo
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    {errors.name && <p className="mt-2 text-sm text-error-600">{errors.name}</p>}
                  </div>

                  {/* Campo Telefone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Telefone (WhatsApp)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                        placeholder="(XX) XXXXX-XXXX"
                      />
                    </div>
                    {errors.phone && <p className="mt-2 text-sm text-error-600">{errors.phone}</p>}
                  </div>
                </>
              )}

              {/* Botão de Ação */}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    isLogin ? 'Entrar' : 'Registrar'
                  )}
                </button>
              </div>
            </form>

            {/* Alternar entre Login e Registro */}
            <div className="mt-6">
              <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                {' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setErrors({}) // Limpar erros ao alternar
                    setFormData({ ...formData, name: '', phone: '' }) // Limpar campos de registro
                  }}
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {isLogin ? 'Crie uma agora' : 'Faça login'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Informações de versão */}
        <div className="mt-6 text-center">
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            Fluxus Message {formatVersion()}
          </p>
        </div>
      </div>
    </>
  )
}

