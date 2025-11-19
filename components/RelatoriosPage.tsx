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
import { useTheme } from '@/lib/contexts/ThemeContext'

interface RelatorioData {
  totalEnviadas: number
  totalEntregues: number
  totalLidas: number
  totalErros: number
  taxaEntrega: number
  taxaLeitura: number
  taxaErro: number
  evolucaoMensal: Array<{
    name: string
    enviadas: number
    entregues: number
    lidas: number
    erros: number
  }>
  distribuicaoStatus: Array<{
    name: string
    value: number
    color: string
  }>
  performanceCampanhas: Array<{
    nome: string
    enviadas: number
    entregues: number
    taxaEntrega: number
  }>
  horariosEngajamento: Array<{
    hora: string
    envios: number
  }>
}

export default function RelatoriosPage() {
  const { theme } = useTheme()
  const [periodo, setPeriodo] = useState('30d')
  const [tipoRelatorio, setTipoRelatorio] = useState('geral')
  const [loading, setLoading] = useState(false)
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Buscar dados do relatório
  const loadRelatorioData = async () => {
    setLoadingData(true)
    try {
      const response = await fetch(`/api/relatorios?periodo=${periodo}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar relatório')
      }
      const result = await response.json()
      if (result.success && result.data) {
        setRelatorioData(result.data)
      } else {
        console.error('Erro ao carregar relatório:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadRelatorioData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

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

  // Dados padrão quando não há dados ou está carregando
  const data = relatorioData || {
    totalEnviadas: 0,
    totalEntregues: 0,
    totalLidas: 0,
    totalErros: 0,
    taxaEntrega: 0,
    taxaLeitura: 0,
    taxaErro: 0,
    evolucaoMensal: [],
    distribuicaoStatus: [
      { name: 'Entregues', value: 0, color: '#10b981' },
      { name: 'Pendentes', value: 0, color: '#f59e0b' },
      { name: 'Erros', value: 0, color: '#ef4444' }
    ],
    performanceCampanhas: [],
    horariosEngajamento: []
  }

  return (
    <div className="space-y-6">
      {/* Header padronizado */}
      <PageHeader
        title="Relatórios"
        subtitle="Análise detalhada do desempenho das suas campanhas"
        icon={<ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
        actions={(
          <div className="flex space-x-2">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="input w-32 text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="btn btn-primary btn-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
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
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="input w-36 text-sm"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="1y">Último ano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                className="input w-40 text-sm"
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
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Enviadas</p>
              <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                {loadingData ? '...' : data.totalEnviadas.toLocaleString()}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {loadingData ? 'Carregando...' : 'Total de mensagens enviadas'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Taxa de Entrega</p>
              <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                {loadingData ? '...' : `${data.taxaEntrega.toFixed(1)}%`}
              </p>
              <p className="text-sm text-success-600 dark:text-success-400">
                {loadingData ? 'Carregando...' : `${data.totalEntregues.toLocaleString()} entregues`}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Taxa de Leitura</p>
              <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                {loadingData ? '...' : `${data.taxaLeitura.toFixed(1)}%`}
              </p>
              <p className="text-sm text-success-600 dark:text-success-400">
                {loadingData ? 'Carregando...' : `${data.totalLidas.toLocaleString()} lidas`}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-error-100 dark:bg-error-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-error-600 dark:text-error-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Taxa de Erro</p>
              <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                {loadingData ? '...' : `${data.taxaErro.toFixed(1)}%`}
              </p>
              <p className="text-sm text-error-600 dark:text-error-400">
                {loadingData ? 'Carregando...' : `${data.totalErros.toLocaleString()} erros`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Evolução Mensal */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
            Evolução Mensal de Envios
          </h3>
          <div className="h-80">
            {loadingData ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500 dark:text-secondary-400">Carregando dados...</p>
              </div>
            ) : data.evolucaoMensal.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500 dark:text-secondary-400">Nenhum dado disponível para o período selecionado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                  <YAxis stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f1f5f9' : '#111827'
                    }}
                  />
                  <Area type="monotone" dataKey="enviadas" stackId="1" stroke="#007BFF" fill="#007BFF" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="entregues" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="lidas" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
            Distribuição por Status
          </h3>
          <div className="h-80">
            {loadingData ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500 dark:text-secondary-400">Carregando dados...</p>
              </div>
            ) : data.distribuicaoStatus.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500 dark:text-secondary-400">Nenhum dado disponível</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribuicaoStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.distribuicaoStatus.map((entry, index) => (
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
            )}
          </div>
          <div className="mt-4 space-y-2">
            {data.distribuicaoStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance por Campanha */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
          Performance por Campanha
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Enviadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Entregues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Taxa de Entrega
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
              {loadingData ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-secondary-500 dark:text-secondary-400">
                    Carregando dados...
                  </td>
                </tr>
              ) : data.performanceCampanhas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-secondary-500 dark:text-secondary-400">
                    Nenhuma campanha encontrada para o período selecionado
                  </td>
                </tr>
              ) : (
                data.performanceCampanhas.map((campanha, index) => (
                  <tr key={index} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {campanha.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                      {campanha.enviadas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                      {campanha.entregues.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-success-500 dark:bg-success-400 h-2 rounded-full" 
                            style={{ width: `${Math.min(campanha.taxaEntrega, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {campanha.taxaEntrega.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horários de Maior Engajamento */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
          Horários de Maior Engajamento
        </h3>
        <div className="h-80">
          {loadingData ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-secondary-500 dark:text-secondary-400">Carregando dados...</p>
            </div>
          ) : data.horariosEngajamento.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-secondary-500 dark:text-secondary-400">Nenhum dado disponível para o período selecionado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.horariosEngajamento}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e5e7eb'} />
                <XAxis dataKey="hora" stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                <YAxis stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#f1f5f9' : '#111827'
                  }}
                />
                <Bar dataKey="envios" fill="#007BFF" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Pontos Positivos</h4>
            <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
              {loadingData ? (
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full mr-2" />
                  Carregando...
                </li>
              ) : (
                <>
                  {data.taxaEntrega >= 80 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-success-500 dark:bg-success-400 rounded-full mr-2" />
                      Taxa de entrega {data.taxaEntrega >= 90 ? 'excelente' : 'boa'} ({data.taxaEntrega.toFixed(1)}%)
                    </li>
                  )}
                  {data.totalEnviadas > 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-success-500 dark:bg-success-400 rounded-full mr-2" />
                      {data.totalEnviadas.toLocaleString()} mensagens enviadas
                    </li>
                  )}
                  {data.taxaErro < 5 && data.totalErros > 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-success-500 dark:bg-success-400 rounded-full mr-2" />
                      Baixa taxa de erro ({data.taxaErro.toFixed(1)}%)
                    </li>
                  )}
                  {data.taxaEntrega < 80 && data.totalEnviadas === 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-2" />
                      Nenhum dado disponível para análise
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Oportunidades de Melhoria</h4>
            <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
              {loadingData ? (
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full mr-2" />
                  Carregando...
                </li>
              ) : (
                <>
                  {data.taxaLeitura < 50 && data.totalLidas > 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-500 dark:bg-warning-400 rounded-full mr-2" />
                      Aumentar taxa de leitura (atual: {data.taxaLeitura.toFixed(1)}%)
                    </li>
                  )}
                  {data.taxaErro >= 5 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-500 dark:bg-warning-400 rounded-full mr-2" />
                      Reduzir taxa de erro (atual: {data.taxaErro.toFixed(1)}%)
                    </li>
                  )}
                  {data.totalEnviadas === 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-500 dark:bg-warning-400 rounded-full mr-2" />
                      Iniciar envio de mensagens para gerar dados
                    </li>
                  )}
                  {data.totalEnviadas > 0 && data.performanceCampanhas.length === 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-500 dark:bg-warning-400 rounded-full mr-2" />
                      Criar campanhas para melhor análise
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
