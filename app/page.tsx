'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  BoltIcon,
  PaperAirplaneIcon,
  CpuChipIcon,
  QueueListIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Disparo Inteligente',
      description: 'Envie mensagens em massa com controle de velocidade, variações de texto e balanceamento de carga entre múltiplos servidores WAHA.',
      color: 'text-primary-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Gerenciamento de Clientes',
      description: 'CRUD completo com busca avançada, importação CSV, validação automática de números e organização por grupos.',
      color: 'text-success-500'
    },
    {
      icon: DocumentTextIcon,
      title: 'Templates Personalizáveis',
      description: 'Crie mensagens dinâmicas com variáveis {{nome}}, {{email}}, {{telefone}} para personalização automática.',
      color: 'text-warning-500'
    },
    {
      icon: CalendarDaysIcon,
      title: 'Agendamento Inteligente',
      description: 'Programe campanhas para execução futura com precisão de minutos e controle total sobre horários de envio.',
      color: 'text-accent-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Dashboard em Tempo Real',
      description: 'Métricas detalhadas, gráficos de desempenho, taxa de entrega e análise completa de campanhas.',
      color: 'text-primary-600'
    },
    {
      icon: QueueListIcon,
      title: 'Sistema de Filas',
      description: 'Processamento assíncrono com Bull/Redis, retry automático e controle de taxa de envio para máxima eficiência.',
      color: 'text-primary-700'
    },
    {
      icon: CpuChipIcon,
      title: 'Múltiplas Integrações',
      description: 'Suporte para Evolution API, WAHA API e integração com n8n para automações avançadas.',
      color: 'text-accent-600'
    },
    {
      icon: PaperAirplaneIcon,
      title: 'Integração Telegram',
      description: 'Envie mensagens para canais e grupos do Telegram com agendamento, formatação rica e gerenciamento completo de múltiplos bots.',
      color: 'text-blue-500'
    },
    {
      icon: BoltIcon,
      title: 'IA para Variações',
      description: 'Gere variações automáticas de mensagens usando Google Gemini para evitar bloqueios e aumentar entregabilidade.',
      color: 'text-warning-600'
    },
    {
      icon: PhoneIcon,
      title: 'Validação de Números',
      description: 'Validação automática, formatação inteligente e verificação de números válidos antes do envio.',
      color: 'text-accent-500'
    },
    {
      icon: ClockIcon,
      title: 'Histórico Completo',
      description: 'Log detalhado de todos os disparos, status de entrega, leitura e respostas dos destinatários.',
      color: 'text-secondary-600'
    },
    {
      icon: SparklesIcon,
      title: 'Relatórios Avançados',
      description: 'Análise de desempenho, exportação de dados, métricas por período e insights detalhados.',
      color: 'text-primary-500'
    }
  ]

  const benefits = [
    'Aumente sua produtividade em até 10x',
    'Reduza custos operacionais',
    'Melhore o relacionamento com clientes',
    'Automatize processos repetitivos',
    'Escalabilidade ilimitada',
    'Suporte a múltiplos usuários'
  ]

  const technologies = [
    { name: 'Next.js 14', description: 'Framework React moderno' },
    { name: 'TypeScript', description: 'Tipagem estática' },
    { name: 'Supabase', description: 'Backend completo' },
    { name: 'WAHA API', description: 'Integração WhatsApp' },
    { name: 'Evolution API', description: 'API profissional' },
    { name: 'Redis/Bull', description: 'Filas assíncronas' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/img/logo_marca_02_trasp.png" 
                alt="Fluxus Menssager" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                Fluxus Menssager
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth" 
                className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Entrar
              </Link>
              <Link 
                href="/auth?mode=register" 
                className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold mb-6">
              🚀 Plataforma Profissional de Automação para envios no WhatsApp e Telegram
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-secondary-900 dark:text-secondary-100 mb-6 leading-tight">
            Automação Inteligente de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700 mt-2">
              Mensagens WhatsApp e Telegram
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Dispare mensagens em massa via WhatsApp e Telegram, gerencie campanhas, automatize processos e aumente sua produtividade com a plataforma mais completa do mercado.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth?mode=register"
              className="group px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold text-lg hover:bg-primary-600 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/auth"
              className="px-8 py-4 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-xl font-semibold text-lg border-2 border-secondary-200 dark:border-secondary-700 hover:border-primary-500 transition-all"
            >
              Já tenho uma conta
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">10x</div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">Mais Produtividade</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-success-600 dark:text-success-400">99.9%</div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">Taxa de Entrega</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-warning-600 dark:text-warning-400">24/7</div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">Disponibilidade</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent-600 dark:text-accent-400">∞</div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">Escalável</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Tudo que você precisa para automatizar e escalar sua comunicação via WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-xl"
              >
                <div className={`w-12 h-12 ${feature.color} bg-opacity-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                Por que escolher o Fluxus Menssager?
              </h2>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8">
                Uma plataforma completa que transforma a forma como você se comunica com seus clientes.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-secondary-700 dark:text-secondary-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Tecnologias de Ponta</h3>
              <div className="grid grid-cols-2 gap-4">
                {technologies.map((tech, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="font-semibold mb-1">{tech.name}</div>
                    <div className="text-sm text-white/80">{tech.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-500 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar sua comunicação?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Comece agora e veja a diferença que a automação inteligente pode fazer no seu negócio.
          </p>
          <Link 
            href="/auth?mode=register"
            className="inline-flex items-center space-x-2 px-10 py-5 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-secondary-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
          >
            <span>Começar Agora - É Grátis</span>
            <ArrowRightIcon className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-secondary-900 dark:bg-black border-t border-secondary-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/img/logo_marca_02_trasp.png" 
                alt="Fluxus Menssager" 
                className="h-8 w-auto"
              />
               <span className="text-secondary-400">Fluxus Menssager v{process.env.NEXT_PUBLIC_APP_VERSION || require('../package.json').version}</span>
            </div>
            <div className="text-secondary-400 text-sm">
              © {mounted ? new Date().getFullYear() : '2025'} Fluxus Menssager. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
