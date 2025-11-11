'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon, 
  MegaphoneIcon, 
  PaperAirplaneIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  DevicePhoneMobileIcon,
  ServerIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTheme } from '@/lib/contexts/ThemeContext'
import PageHeader from './PageHeader'
import Link from 'next/link'

interface Stats {
  totalClientes: number
  clientesAtivos: number
  clientesInativos: number
  totalCampanhas: number
  campanhasAtivas: number
  campanhasConcluidas: number
  totalDisparos: number
  disparosEnviados: number
  disparosPendentes: number
  disparosFalhados: number
  taxaEntrega: number
  disparosHoje: number
  disparosSemana: number
  totalSessoesWaha: number
  sessoesWahaOnline: number
  totalServidoresWaha: number
  servidoresWahaOnline: number
  totalInstanciasEvolution: number
  instanciasEvolutionOnline: number
}

interface RecentActivity {
  id: string
  type: 'campanha' | 'disparo' | 'cliente'
  message: string
  time: string
  status?: string
}

export default function DashboardReal() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    totalCampanhas: 0,
    campanhasAtivas: 0,
    campanhasConcluidas: 0,
    totalDisparos: 0,
    disparosEnviados: 0,
    disparosPendentes: 0,
    disparosFalhados: 0,
    taxaEntrega: 0,
    disparosHoje: 0,
    disparosSemana: 0,
    totalSessoesWaha: 0,
    sessoesWahaOnline: 0,
    totalServidoresWaha: 0,
    servidoresWahaOnline: 0,
    totalInstanciasEvolution: 0,
    instanciasEvolutionOnline: 0
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentCampanhas, setRecentCampanhas] = useState<any[]>([])
  const [recentDisparos, setRecentDisparos] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      loadStats()
    }
  }, [user?.id])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Carregar clientes
      const clientesRes = await fetch('/api/clientes?limit=1000')
      const clientesData = await clientesRes.json()
      const clientes = clientesData.data || []
      
      // Carregar campanhas
      const campanhasRes = await fetch('/api/campanhas?limit=1000')
      const campanhasData = await campanhasRes.json()
      const campanhas = campanhasData.data || []
      
      // Carregar disparos
      const disparosRes = await fetch('/api/disparos?limit=1000')
      const disparosData = await disparosRes.json()
      const disparos = disparosData.data || []
      
      // Calcular estatísticas de clientes
      const clientesAtivos = clientes.filter((c: any) => c.status === 'ativo').length
      const clientesInativos = clientes.filter((c: any) => c.status === 'inativo').length
      
      // Calcular estatísticas de campanhas
      const campanhasAtivas = campanhas.filter((c: any) => 
        c.status === 'agendada' || c.status === 'enviando' || c.progresso?.status === 'enviando' || c.progresso?.status === 'agendada'
      ).length
      const campanhasConcluidas = campanhas.filter((c: any) => 
        c.status === 'concluida' || c.progresso?.status === 'concluida'
      ).length
      
      // Calcular estatísticas de disparos
      const disparosEnviados = disparos.filter((d: any) => d.status === 'enviado' || d.status === 'entregue' || d.status === 'lido').length
      const disparosPendentes = disparos.filter((d: any) => d.status === 'pendente').length
      const disparosFalhados = disparos.filter((d: any) => d.status === 'falhou' || d.status === 'erro').length
      
      // Calcular taxa de entrega
      const taxaEntrega = disparos.length > 0 
        ? ((disparosEnviados / disparos.length) * 100) 
        : 0
      
      // Disparos hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const disparosHoje = disparos.filter((d: any) => {
        const dataDisparo = d.enviado_em ? new Date(d.enviado_em) : new Date(d.created_at)
        return dataDisparo >= hoje
      }).length
      
      // Disparos esta semana
      const semanaPassada = new Date()
      semanaPassada.setDate(semanaPassada.getDate() - 7)
      semanaPassada.setHours(0, 0, 0, 0)
      const disparosSemana = disparos.filter((d: any) => {
        const dataDisparo = d.enviado_em ? new Date(d.enviado_em) : new Date(d.created_at)
        return dataDisparo >= semanaPassada
      }).length
      
      // Carregar sessões WAHA
      let totalSessoesWaha = 0
      let sessoesWahaOnline = 0
      try {
        const sessoesRes = await fetch('/api/waha/sessions/all')
        const sessoesData = await sessoesRes.json()
        if (sessoesData.success && sessoesData.sessions) {
          totalSessoesWaha = sessoesData.sessions.length
          sessoesWahaOnline = sessoesData.sessions.filter((s: any) => s.status === 'WORKING').length
        }
      } catch (error) {
        console.error('Erro ao carregar sessões WAHA:', error)
      }
      
      // Carregar servidores WAHA
      let totalServidoresWaha = 0
      let servidoresWahaOnline = 0
      try {
        const servidoresRes = await fetch('/api/config/waha/list')
        const servidoresData = await servidoresRes.json()
        if (servidoresData.success && servidoresData.servers) {
          totalServidoresWaha = servidoresData.servers.length
          // Verificar status dos servidores
          const serverIds = servidoresData.servers.map((s: any) => s.id).filter(Boolean)
          if (serverIds.length > 0) {
            const statusRes = await fetch('/api/config/waha/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ serverIds })
            })
            const statusData = await statusRes.json()
            if (statusData.results) {
              servidoresWahaOnline = statusData.results.filter((r: any) => r.status === 'online').length
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar servidores WAHA:', error)
      }
      
      // Carregar instâncias Evolution API
      let totalInstanciasEvolution = 0
      let instanciasEvolutionOnline = 0
      try {
        if (user?.id) {
          const instancesRes = await fetch(`/api/evolution/user-instances?userId=${user.id}`)
          const instancesData = await instancesRes.json()
          if (instancesData.success && instancesData.data) {
            totalInstanciasEvolution = instancesData.data.length
            instanciasEvolutionOnline = instancesData.data.filter((i: any) => 
              i.connection_status === 'open' || i.connectionStatus === 'connected'
            ).length
          }
        }
      } catch (error) {
        console.error('Erro ao carregar instâncias Evolution:', error)
      }
      
      // Preparar dados do gráfico (últimos 7 dias)
      const chartDataArray = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const disparosDia = disparos.filter((d: any) => {
          const dataDisparo = d.enviado_em ? new Date(d.enviado_em) : new Date(d.created_at)
          return dataDisparo >= date && dataDisparo < nextDate
        })
        
        const enviados = disparosDia.filter((d: any) => d.status === 'enviado' || d.status === 'entregue' || d.status === 'lido').length
        const falhados = disparosDia.filter((d: any) => d.status === 'falhou' || d.status === 'erro').length
        
        chartDataArray.push({
          dia: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
          enviados,
          falhados
        })
      }
      
      // Campanhas recentes (últimas 5)
      const recentCampanhasData = campanhas
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
      
      // Disparos recentes (últimos 5)
      const recentDisparosData = disparos
        .sort((a: any, b: any) => {
          const dateA = a.enviado_em ? new Date(a.enviado_em) : new Date(a.created_at)
          const dateB = b.enviado_em ? new Date(b.enviado_em) : new Date(b.created_at)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 5)
      
      setStats({
        totalClientes: clientes.length,
        clientesAtivos,
        clientesInativos,
        totalCampanhas: campanhas.length,
        campanhasAtivas,
        campanhasConcluidas,
        totalDisparos: disparos.length,
        disparosEnviados,
        disparosPendentes,
        disparosFalhados,
        taxaEntrega,
        disparosHoje,
        disparosSemana,
        totalSessoesWaha,
        sessoesWahaOnline,
        totalServidoresWaha,
        servidoresWahaOnline,
        totalInstanciasEvolution,
        instanciasEvolutionOnline
      })
      
      setChartData(chartDataArray)
      setRecentCampanhas(recentCampanhasData)
      setRecentDisparos(recentDisparosData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusData = [
    { name: 'Enviados', value: stats.disparosEnviados, color: '#10b981' },
    { name: 'Pendentes', value: stats.disparosPendentes, color: '#f59e0b' },
    { name: 'Falhados', value: stats.disparosFalhados, color: '#ef4444' }
  ]

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      'enviado': { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-400', label: 'Enviado' },
      'entregue': { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-400', label: 'Entregue' },
      'lido': { bg: 'bg-primary-100 dark:bg-primary-900/20', text: 'text-primary-800 dark:text-primary-400', label: 'Lido' },
      'pendente': { bg: 'bg-warning-100 dark:bg-warning-900/20', text: 'text-warning-800 dark:text-warning-400', label: 'Pendente' },
      'falhou': { bg: 'bg-error-100 dark:bg-error-900/20', text: 'text-error-800 dark:text-error-400', label: 'Falhou' },
      'erro': { bg: 'bg-error-100 dark:bg-error-900/20', text: 'text-error-800 dark:text-error-400', label: 'Erro' },
      'agendada': { bg: 'bg-primary-100 dark:bg-primary-900/20', text: 'text-primary-800 dark:text-primary-400', label: 'Agendada' },
      'enviando': { bg: 'bg-warning-100 dark:bg-warning-900/20', text: 'text-warning-800 dark:text-warning-400', label: 'Enviando' },
      'concluida': { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-400', label: 'Concluída' },
      'pausada': { bg: 'bg-secondary-100 dark:bg-secondary-700', text: 'text-secondary-800 dark:text-secondary-300', label: 'Pausada' },
      'rascunho': { bg: 'bg-secondary-100 dark:bg-secondary-700', text: 'text-secondary-800 dark:text-secondary-300', label: 'Rascunho' }
    }
    
    const badge = badges[status] || badges['pendente']
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Há menos de 1 hora'
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    if (diffInHours < 48) return 'Ontem'
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do seu sistema de disparos WhatsApp"
        icon={<ChartBarIcon className="h-6 w-6" />}
      />

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/clientes" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total de Clientes</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalClientes}</p>
              <div className="flex items-center mt-2 space-x-4 text-xs">
                <span className="text-success-600 dark:text-success-400">{stats.clientesAtivos} ativos</span>
                <span className="text-secondary-400 dark:text-secondary-500">•</span>
                <span className="text-secondary-600 dark:text-secondary-400">{stats.clientesInativos} inativos</span>
              </div>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <UsersIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Link>

        <Link href="/campanhas" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Campanhas</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalCampanhas}</p>
              <div className="flex items-center mt-2 space-x-4 text-xs">
                <span className="text-warning-600 dark:text-warning-400">{stats.campanhasAtivas} ativas</span>
                <span className="text-secondary-400 dark:text-secondary-500">•</span>
                <span className="text-success-600 dark:text-success-400">{stats.campanhasConcluidas} concluídas</span>
              </div>
            </div>
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <MegaphoneIcon className="h-8 w-8 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Link>

        <Link href="/disparos" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total de Disparos</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalDisparos.toLocaleString()}</p>
              <div className="flex items-center mt-2 space-x-4 text-xs">
                <span className="text-success-600 dark:text-success-400">{stats.disparosEnviados} enviados</span>
                <span className="text-secondary-400 dark:text-secondary-500">•</span>
                <span className="text-warning-600 dark:text-warning-400">{stats.disparosPendentes} pendentes</span>
              </div>
            </div>
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <PaperAirplaneIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Link>

        <div className="card p-6 dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Taxa de Entrega</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.taxaEntrega.toFixed(1)}%</p>
              <div className="flex items-center mt-2 space-x-4 text-xs">
                <span className="text-success-600 dark:text-success-400">{stats.disparosHoje} hoje</span>
                <span className="text-secondary-400 dark:text-secondary-500">•</span>
                <span className="text-secondary-600 dark:text-secondary-400">{stats.disparosSemana} esta semana</span>
              </div>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Infraestrutura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/waha-sessions" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Sessões WAHA</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalSessoesWaha}</p>
              <div className="flex items-center mt-2 space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.sessoesWahaOnline > 0 ? 'bg-success-500' : 'bg-error-500'}`}></div>
                <span className={`text-xs font-medium ${stats.sessoesWahaOnline > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {stats.sessoesWahaOnline} online
                </span>
              </div>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <DevicePhoneMobileIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Link>

        <Link href="/waha-sessions" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Servidores WAHA</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalServidoresWaha}</p>
              <div className="flex items-center mt-2 space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.servidoresWahaOnline > 0 ? 'bg-success-500' : 'bg-error-500'}`}></div>
                <span className={`text-xs font-medium ${stats.servidoresWahaOnline > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {stats.servidoresWahaOnline} online
                </span>
              </div>
            </div>
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <ServerIcon className="h-8 w-8 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Link>

        <Link href="/configuracoes/evolution-api" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Instâncias Evolution</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2">{stats.totalInstanciasEvolution}</p>
              <div className="flex items-center mt-2 space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.instanciasEvolutionOnline > 0 ? 'bg-success-500' : 'bg-error-500'}`}></div>
                <span className={`text-xs font-medium ${stats.instanciasEvolutionOnline > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {stats.instanciasEvolutionOnline} conectadas
                </span>
              </div>
            </div>
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Disparos (Últimos 7 dias) */}
        <div className="card p-6 dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Disparos - Últimos 7 Dias</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-secondary-700" />
              <XAxis dataKey="dia" stroke="#6b7280" className="dark:stroke-secondary-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-secondary-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#f1f5f9' : '#111827'
                }} 
              />
              <Bar dataKey="enviados" fill="#10b981" name="Enviados" radius={[8, 8, 0, 0]} />
              <Bar dataKey="falhados" fill="#ef4444" name="Falhados" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Status dos Disparos */}
        <div className="card p-6 dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Status dos Disparos</h3>
            <ChartBarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#f1f5f9' : '#111827'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campanhas e Disparos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campanhas Recentes */}
        <div className="card p-6 dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Campanhas Recentes</h3>
            <Link href="/campanhas" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Ver todas →
            </Link>
          </div>
          {recentCampanhas.length === 0 ? (
            <div className="text-center py-8">
              <MegaphoneIcon className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-2" />
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Nenhuma campanha ainda</p>
              <Link href="/campanhas" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-2 inline-block">
                Criar primeira campanha
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampanhas.map((campanha: any) => (
                <div key={campanha.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">{campanha.nome}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      {getStatusBadge(campanha.status || campanha.progresso?.status || 'rascunho')}
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        {formatDate(campanha.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disparos Recentes */}
        <div className="card p-6 dark:bg-secondary-800 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Disparos Recentes</h3>
            <Link href="/disparos" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Ver todos →
            </Link>
          </div>
          {recentDisparos.length === 0 ? (
            <div className="text-center py-8">
              <PaperAirplaneIcon className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-2" />
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Nenhum disparo ainda</p>
              <Link href="/disparos" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-2 inline-block">
                Fazer primeiro disparo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDisparos.map((disparo: any) => (
                <div key={disparo.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {disparo.telefone}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      {getStatusBadge(disparo.status)}
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        {formatDate(disparo.enviado_em || disparo.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
