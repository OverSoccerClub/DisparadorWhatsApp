'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon, 
  MegaphoneIcon, 
  PaperAirplaneIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

// Mock data - em produção viria do Supabase
const mockStats = {
  totalClientes: 1247,
  clientesAtivos: 1156,
  totalCampanhas: 23,
  campanhasAtivas: 3,
  mensagensEnviadas: 15420,
  taxaEntrega: 94.2
}

const mockChartData = [
  { name: 'Jan', enviadas: 1200, entregues: 1150 },
  { name: 'Fev', enviadas: 1900, entregues: 1820 },
  { name: 'Mar', enviadas: 3000, entregues: 2850 },
  { name: 'Abr', enviadas: 2780, entregues: 2650 },
  { name: 'Mai', enviadas: 1890, entregues: 1800 },
  { name: 'Jun', enviadas: 2390, entregues: 2280 },
]

const mockStatusData = [
  { name: 'Entregues', value: 94.2, color: '#10b981' },
  { name: 'Pendentes', value: 3.8, color: '#f59e0b' },
  { name: 'Erros', value: 2.0, color: '#ef4444' },
]

const mockRecentCampaigns = [
  { id: 1, nome: 'Promoção Black Friday', status: 'concluida', enviadas: 450, entregues: 425 },
  { id: 2, nome: 'Lembrete de Pagamento', status: 'enviando', enviadas: 120, entregues: 95 },
  { id: 3, nome: 'Novo Produto', status: 'agendada', enviadas: 0, entregues: 0 },
]

export default function Dashboard() {
  const [stats, setStats] = useState(mockStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <ChartBarIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-primary-600" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-secondary-600 flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            Visão geral da sua plataforma de disparo WhatsApp
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Total de Clientes
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-secondary-900">
                    {stats.totalClientes.toLocaleString()}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-success-600">
                    <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                    <span className="sr-only">Aumentou em</span>
                    12%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MegaphoneIcon className="h-8 w-8 text-warning-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Campanhas Ativas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-secondary-900">
                    {stats.campanhasAtivas}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-secondary-500">
                    de {stats.totalCampanhas} total
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PaperAirplaneIcon className="h-8 w-8 text-success-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Mensagens Enviadas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-secondary-900">
                    {stats.mensagensEnviadas.toLocaleString()}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-success-600">
                    <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                    <span className="sr-only">Aumentou em</span>
                    8%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Taxa de Entrega
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-secondary-900">
                    {stats.taxaEntrega}%
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-success-600">
                    <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                    <span className="sr-only">Aumentou em</span>
                    2.1%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Messages Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Mensagens por Mês
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enviadas" fill="#2563eb" name="Enviadas" />
                <Bar dataKey="entregues" fill="#10b981" name="Entregues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Status das Mensagens
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {mockStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-secondary-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-secondary-900">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900">
            Campanhas Recentes
          </h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {mockRecentCampaigns.map((campaign) => (
            <div key={campaign.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-secondary-900">
                    {campaign.nome}
                  </h4>
                  <p className="text-sm text-secondary-500">
                    {campaign.enviadas} enviadas • {campaign.entregues} entregues
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    campaign.status === 'concluida' ? 'bg-success-100 text-success-800' :
                    campaign.status === 'enviando' ? 'bg-warning-100 text-warning-800' :
                    'bg-secondary-100 text-secondary-800'
                  }`}>
                    {campaign.status === 'concluida' ? 'Concluída' :
                     campaign.status === 'enviando' ? 'Enviando' :
                     'Agendada'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
