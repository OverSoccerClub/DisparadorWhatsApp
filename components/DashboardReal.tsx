'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon, 
  MegaphoneIcon, 
  PaperAirplaneIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { DisparosSMSService } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/hooks/useAuth'

// Interface para estatísticas
interface Stats {
  totalClientes: number
  clientesAtivos: number
  clientesInativos: number
  totalCampanhas: number
  campanhasAtivas: number
  mensagensEnviadas: number
  mensagensEntregues: number
  taxaEntrega: number
}

export default function DashboardReal() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    totalCampanhas: 0,
    campanhasAtivas: 0,
    mensagensEnviadas: 0,
    mensagensEntregues: 0,
    taxaEntrega: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  // Função para formatar data do último login
  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Primeiro acesso'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Há menos de 1 hora'
    if (diffInHours < 24) return `Há ${diffInHours} horas`
    if (diffInHours < 48) return 'Ontem'
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para obter saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const estatisticas = await DisparosSMSService.getEstatisticas()
      
      setStats({
        totalClientes: estatisticas.totalClientes,
        clientesAtivos: estatisticas.clientesAtivos,
        clientesInativos: estatisticas.clientesInativos,
        totalCampanhas: 0, // TODO: Implementar quando tiver campanhas
        campanhasAtivas: 0, // TODO: Implementar quando tiver campanhas
        mensagensEnviadas: 0, // TODO: Implementar quando tiver disparos
        mensagensEntregues: 0, // TODO: Implementar quando tiver disparos
        taxaEntrega: 0 // TODO: Implementar quando tiver disparos
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dados para gráficos (mock por enquanto)
  const performanceData = [
    { mes: 'Jan', enviadas: 1200, entregues: 1150 },
    { mes: 'Fev', enviadas: 1800, entregues: 1720 },
    { mes: 'Mar', enviadas: 2100, entregues: 1980 },
    { mes: 'Abr', enviadas: 1900, entregues: 1820 },
    { mes: 'Mai', enviadas: 2500, entregues: 2400 },
    { mes: 'Jun', enviadas: 2800, entregues: 2680 }
  ]

  const statusData = [
    { name: 'Ativos', value: stats.clientesAtivos, color: '#10b981' },
    { name: 'Inativos', value: stats.clientesInativos, color: '#ef4444' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com informações do usuário */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            {getGreeting()}, {user?.name || 'Usuário'}!
          </h1>
          <p className="mt-1 text-sm text-secondary-600 flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            Visão geral da sua plataforma de disparo WhatsApp
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Informações do usuário */}
          <div className="flex items-center space-x-3 bg-secondary-50 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-5 w-5 text-primary-600" />
              <div className="text-sm">
                <p className="font-medium text-secondary-900">{user?.name || 'Usuário'}</p>
                <p className="text-secondary-500">{user?.email || 'email@exemplo.com'}</p>
              </div>
            </div>
            {user?.is_admin && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-xs font-medium text-warning-700">Admin</span>
              </div>
            )}
          </div>
          
          {/* Status do sistema */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-secondary-600">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Informações do Usuário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Boas-vindas */}
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900">
                {getGreeting()}, {user?.name || 'Usuário'}!
              </h3>
              <p className="text-primary-700">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
          </div>
        </div>

        {/* Card de Informações da Conta */}
        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-secondary-600" />
            <div>
              <h3 className="text-sm font-medium text-secondary-600">Último Acesso</h3>
              <p className="text-lg font-semibold text-secondary-900">
                {formatLastLogin(user?.last_login)}
              </p>
            </div>
          </div>
        </div>

        {/* Card de Status da Conta */}
        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-6 w-6 text-secondary-600" />
            <div>
              <h3 className="text-sm font-medium text-secondary-600">Status da Conta</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${user?.is_active ? 'bg-success-500' : 'bg-error-500'}`}></div>
                <p className="text-lg font-semibold text-secondary-900">
                  {user?.is_active ? 'Ativa' : 'Inativa'}
                </p>
                {user?.is_admin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    Administrador
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total de Clientes</p>
              <p className="text-2xl font-semibold text-secondary-900">{stats.totalClientes}</p>
              <div className="flex items-center mt-1">
                <ArrowUpIcon className="h-4 w-4 text-success-500" />
                <span className="text-sm text-success-600 ml-1">+12% este mês</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MegaphoneIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Campanhas Ativas</p>
              <p className="text-2xl font-semibold text-secondary-900">{stats.campanhasAtivas}</p>
              <div className="flex items-center mt-1">
                <ArrowDownIcon className="h-4 w-4 text-error-500" />
                <span className="text-sm text-error-600 ml-1">-2 esta semana</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PaperAirplaneIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Mensagens Enviadas</p>
              <p className="text-2xl font-semibold text-secondary-900">{stats.mensagensEnviadas.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowUpIcon className="h-4 w-4 text-success-500" />
                <span className="text-sm text-success-600 ml-1">+8% esta semana</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Taxa de Entrega</p>
              <p className="text-2xl font-semibold text-secondary-900">{stats.taxaEntrega.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <ArrowUpIcon className="h-4 w-4 text-success-500" />
                <span className="text-sm text-success-600 ml-1">+2.1% este mês</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Performance de Campanhas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="enviadas" stroke="#2563eb" strokeWidth={2} name="Enviadas" />
              <Line type="monotone" dataKey="entregues" stroke="#10b981" strokeWidth={2} name="Entregues" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Status dos Clientes */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Status dos Clientes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Atividades Recentes</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-secondary-900">Login realizado com sucesso</p>
              <p className="text-xs text-secondary-500">
                {user?.name} acessou o sistema
                {user?.last_login && ` em ${new Date(user.last_login).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            <span className="text-xs text-secondary-500">Agora</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-secondary-900">Sistema conectado ao Supabase</p>
              <p className="text-xs text-secondary-500">Dados reais carregados da tabela disparos_sms</p>
            </div>
            <span className="text-xs text-secondary-500">Agora</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-secondary-900">
                {user?.is_admin ? 'Acesso administrativo ativo' : 'Conta de usuário ativa'}
              </p>
              <p className="text-xs text-secondary-500">
                {user?.is_admin 
                  ? 'Privilégios de administrador disponíveis' 
                  : 'Acesso padrão ao sistema'
                }
              </p>
            </div>
            <span className="text-xs text-secondary-500">Agora</span>
          </div>
        </div>
      </div>
    </div>
  )
}
