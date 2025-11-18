'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'
import SuccessModal from '@/components/SuccessModal'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (!isLogin && !formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!isLogin && formData.phone) {
      const normalizedPhone = formData.phone.replace(/\D/g, '')
      if (normalizedPhone.length < 10) {
        newErrors.phone = 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
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

      const data = await response.json()

      if (data.success) {
        // Fechar LoadingOverlay
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        
        if (isLogin) {
          // Login: redirecionar normalmente
          setSuccessModal({
            open: true,
            title: 'Login Realizado com Sucesso!',
            message: 'Bem-vindo de volta! Você será redirecionado para o dashboard.'
          })
          
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.replace('/')
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
            window.location.replace('/')
          }
        }
      } else {
        setLoadingOverlay(prev => ({ ...prev, open: false }))
        
        // Mapear erros comuns para campos específicos
        const errorMessage = data.message || 'Erro ao processar solicitação'
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
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
        autoCloseDelay={5000}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Card do Formulário */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden">
          {/* Header com Logo e Título */}
          <div className="bg-white dark:bg-secondary-800 px-6 pt-6 pb-4 text-center border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex justify-center mb-4">
              <img 
                src="/img/logo_marca_02_trasp.png" 
                alt="Fluxus Menssager" 
                className="h-32 md:h-40 lg:h-48 w-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {isLogin 
                ? 'Entre para continuar' 
                : 'Comece a usar nossa plataforma'}
            </p>
          </div>

          {/* Indicador de modo (Login/Registro) */}
          <div className="bg-primary-50 dark:bg-primary-900/20 px-6 py-3 border-b border-primary-100 dark:border-primary-800/30">
            <div className="flex items-center justify-between">
              <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                {isLogin ? 'Login' : 'Registro'}
              </span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setErrors({})
                  setFormData({ email: '', password: '', name: '', phone: '' })
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
              >
                {isLogin ? 'Criar conta' : 'Já tenho conta'}
              </button>
            </div>
          </div>

          <form className="p-6 md:p-8 space-y-5" onSubmit={handleSubmit}>
            {/* Campo Nome (apenas no registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className={`h-5 w-5 ${errors.name ? 'text-error-500' : 'text-secondary-400 dark:text-secondary-500'}`} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.name 
                        ? 'border-error-500 dark:border-error-500' 
                        : 'border-secondary-300 dark:border-secondary-600'
                    } bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                    placeholder="Seu nome completo"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                    <span className="text-error-500">•</span> {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Campo Telefone (apenas no registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  Telefone/WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DevicePhoneMobileIcon className={`h-5 w-5 ${errors.phone ? 'text-error-500' : 'text-secondary-400 dark:text-secondary-500'}`} />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required={!isLogin}
                    value={formData.phone}
                    onChange={(e) => {
                      // Formatar telefone enquanto digita
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 11) {
                        if (value.length > 10) {
                          value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
                        } else if (value.length > 6) {
                          value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
                        } else if (value.length > 2) {
                          value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
                        } else {
                          value = value.replace(/^(\d*)/, '($1')
                        }
                        setFormData(prev => ({ ...prev, phone: value }))
                        if (errors.phone) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.phone
                            return newErrors
                          })
                        }
                      }
                    }}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.phone 
                        ? 'border-error-500 dark:border-error-500' 
                        : 'border-secondary-300 dark:border-secondary-600'
                    } bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                    <span className="text-error-500">•</span> {errors.phone}
                  </p>
                )}
              </div>
            )}

            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className={`h-5 w-5 ${errors.email ? 'text-error-500' : 'text-secondary-400 dark:text-secondary-500'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.email 
                      ? 'border-error-500 dark:border-error-500' 
                      : 'border-secondary-300 dark:border-secondary-600'
                  } bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <span className="text-error-500">•</span> {errors.email}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className={`h-5 w-5 ${errors.password ? 'text-error-500' : 'text-secondary-400 dark:text-secondary-500'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-2.5 border ${
                    errors.password 
                      ? 'border-error-500 dark:border-error-500' 
                      : 'border-secondary-300 dark:border-secondary-600'
                  } bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <span className="text-error-500">•</span> {errors.password}
                </p>
              )}
              {!isLogin && !errors.password && (
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            {/* Botão de Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{isLogin ? 'Fazendo login...' : 'Criando conta...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Entrar' : 'Criar conta'}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informações de versão */}
        <div className="mt-6 text-center">
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            Fluxus Menssager{process.env.NEXT_PUBLIC_APP_VERSION ? ` v${process.env.NEXT_PUBLIC_APP_VERSION}` : ''}
          </p>
        </div>
      </div>

      {/* Modal de Ativação de Conta */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-secondary-200 dark:border-secondary-700">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Ativar Conta
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Digite o código de ativação enviado para seu WhatsApp
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!activationCode || activationCode.length !== 6) {
                  setErrors({ activationCode: 'Código deve ter 6 dígitos' })
                  return
                }

                setActivating(true)
                try {
                  const response = await fetch('/api/auth/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: formData.email,
                      code: activationCode
                    })
                  })

                  const data = await response.json()

                  if (data.success) {
                    setSuccessModal({
                      open: true,
                      title: 'Conta Ativada!',
                      message: 'Sua conta foi ativada com sucesso! Faça login para continuar.'
                    })
                    setShowActivationModal(false)
                    setActivationCode('')
                    // Redirecionar para login
                    setIsLogin(true)
                    setFormData({ email: formData.email, password: '', name: '', phone: '' })
                  } else {
                    setErrors({ activationCode: data.message || 'Código inválido' })
                  }
                } catch (error) {
                  setErrors({ activationCode: 'Erro ao ativar conta. Tente novamente.' })
                } finally {
                  setActivating(false)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                  Código de Ativação
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={activationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setActivationCode(value)
                    if (errors.activationCode) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.activationCode
                        return newErrors
                      })
                    }
                  }}
                  className={`block w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border ${
                    errors.activationCode 
                      ? 'border-error-500 dark:border-error-500' 
                      : 'border-secondary-300 dark:border-secondary-600'
                  } bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  placeholder="000000"
                />
                {errors.activationCode && (
                  <p className="text-sm text-error-600 dark:text-error-400 mt-2 text-center">
                    {errors.activationCode}
                  </p>
                )}
                {process.env.NODE_ENV === 'development' && activationCode && (
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2 text-center">
                    Modo desenvolvimento: código visível no console
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowActivationModal(false)
                    setActivationCode('')
                    setErrors({})
                  }}
                  className="flex-1 btn btn-secondary btn-md"
                  disabled={activating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={activating || activationCode.length !== 6}
                  className="flex-1 btn btn-primary btn-md"
                >
                  {activating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Ativando...
                    </span>
                  ) : (
                    'Ativar Conta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

