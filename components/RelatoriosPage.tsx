'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import PageHeader from './PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { formatDate } from '@/lib/utils'

// Mock data para relatórios
const mockRelatorioData = [
  { name: 'Jan', enviadas: 1200, entregues: 1150, lidas: 980, erros: 50 },
  { name: 'Fev', enviadas: 1900, entregues: 1820, lidas: 1650, erros: 80 },
  { name: 'Mar', enviadas: 3000, entregues: 2850, lidas: 2500, erros: 150 },
  { name: 'Abr', enviadas: 2780, entregues: 2650, lidas: 2300, erros: 130 },
  { name: 'Mai', enviadas: 1890, entregues: 1800, lidas: 1600, erros: 90 },
  { name: 'Jun', enviadas: 2390, entregues: 2280, lidas: 2000, erros: 110 },
]

const mockStatusData = [
  { name: 'Entregues', value: 94.2, color: '#10b981' },
  { name: 'Pendentes', value: 3.8, color: '#f59e0b' },
  { name: 'Erros', value: 2.0, color: '#ef4444' },
]

const mockCampanhasData = [
  { nome: 'Promoção Black Friday', enviadas: 450, entregues: 425, taxaEntrega: 94.4 },
  { nome: 'Lembrete de Pagamento', enviadas: 120, entregues: 95, taxaEntrega: 79.2 },
  { nome: 'Novo Produto', enviadas: 300, entregues: 285, taxaEntrega: 95.0 },
  { nome: 'Pesquisa de Satisfação', enviadas: 200, entregues: 190, taxaEntrega: 95.0 },
]

const mockHorariosData = [
  { hora: '08:00', envios: 45 },
  { hora: '09:00', envios: 78 },
  { hora: '10:00', envios: 120 },
  { hora: '11:00', envios: 95 },
  { hora: '12:00', envios: 60 },
  { hora: '13:00', envios: 35 },
  { hora: '14:00', envios: 110 },
  { hora: '15:00', envios: 140 },
  { hora: '16:00', envios: 125 },
  { hora: '17:00', envios: 90 },
  { hora: '18:00', envios: 70 },
  { hora: '19:00', envios: 40 },
]

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('30d')
  const [tipoRelatorio, setTipoRelatorio] = useState('geral')
  const [loading, setLoading] = useState(false)

  const handleExport = async (formato: 'csv' | 'pdf' | 'excel') => {
    setLoading(true)
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Relatório exportado em ${formato.toUpperCase()} com sucesso!`)
    } catch (error) {
      alert('Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header padronizado */}
      <PageHeader
        title="Relatórios"
        subtitle="Análise detalhada do desempenho das suas campanhas"
        icon={<ChartBarIcon className="h-6 w-6" />}
        actions={(
          <div className="flex space-x-3">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="input w-40"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="btn btn-secondary btn-md"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="btn btn-primary btn-md"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
          </div>
        )}
      />

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="input w-48"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="1y">Último ano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                className="input w-48"
              >
                <option value="geral">Relatório Geral</option>
                <option value="campanhas">Por Campanhas</option>
                <option value="horarios">Por Horários</option>
                <option value="status">Por Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total Enviadas</p>
              <p className="text-2xl font-semibold text-secondary-900">13,160</p>
              <p className="text-sm text-success-600">+12% vs mês anterior</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Taxa de Entrega</p>
              <p className="text-2xl font-semibold text-secondary-900">94.2%</p>
              <p className="text-sm text-success-600">+2.1% vs mês anterior</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Taxa de Leitura</p>
              <p className="text-2xl font-semibold text-secondary-900">78.5%</p>
              <p className="text-sm text-success-600">+5.3% vs mês anterior</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-error-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Taxa de Erro</p>
              <p className="text-2xl font-semibold text-secondary-900">2.0%</p>
              <p className="text-sm text-success-600">-0.8% vs mês anterior</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Evolução Mensal */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Evolução Mensal de Envios
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRelatorioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="enviadas" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Area type="monotone" dataKey="entregues" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="lidas" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Distribuição por Status
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

      {/* Performance por Campanha */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">
          Performance por Campanha
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Enviadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Entregues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Taxa de Entrega
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {mockCampanhasData.map((campanha, index) => (
                <tr key={index} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {campanha.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {campanha.enviadas.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {campanha.entregues.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-secondary-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-success-500 h-2 rounded-full" 
                          style={{ width: `${campanha.taxaEntrega}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-secondary-900">
                        {campanha.taxaEntrega}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horários de Maior Engajamento */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">
          Horários de Maior Engajamento
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockHorariosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="envios" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Pontos Positivos</h4>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-success-500 rounded-full mr-2" />
                Taxa de entrega acima da média (94.2%)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-success-500 rounded-full mr-2" />
                Crescimento consistente no volume de envios
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-success-500 rounded-full mr-2" />
                Baixa taxa de erro (2.0%)
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Oportunidades de Melhoria</h4>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-warning-500 rounded-full mr-2" />
                Aumentar taxa de leitura (atual: 78.5%)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-warning-500 rounded-full mr-2" />
                Otimizar horários de envio
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-warning-500 rounded-full mr-2" />
                Personalizar mensagens por segmento
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
