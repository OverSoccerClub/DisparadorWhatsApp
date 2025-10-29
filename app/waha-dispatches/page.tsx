'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WahaCampaignsManager from '@/components/WahaCampaignsManager'
import WahaDispatchModal from '@/components/WahaDispatchModal'
import { Cliente } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function WahaDispatchesPage() {
  const { user: currentUser, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('campaigns')
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])

  // Carregar clientes quando o modal abrir
  useEffect(() => {
    if (showDispatchModal) {
      loadClientes()
    }
  }, [showDispatchModal])

  const loadClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      
      if (data.success) {
        setClientes(data.clientes || [])
      } else {
        console.error('Erro ao carregar clientes:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="px-3 md:px-4 lg:px-6">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-64 bg-secondary-200 rounded mb-4"></div>
                  <div className="h-4 w-80 bg-secondary-200 rounded mb-6"></div>
                  <div className="h-40 w-full bg-white border rounded"></div>
                </div>
              ) : !currentUser ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
                    <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
                    <a href="/auth" className="btn btn-primary">Fazer Login</a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header padronizado */}
                  <PageHeader
                    title="Disparos WAHA"
                    subtitle="Gerencie campanhas de disparo WhatsApp usando servidores WAHA"
                    icon={<DevicePhoneMobileIcon className="h-6 w-6" />}
                    actions={(
                      <button
                        onClick={() => setShowDispatchModal(true)}
                        className="btn btn-primary"
                      >
                        <i className="fas fa-paper-plane mr-2"></i>
                        Disparo Rápido
                      </button>
                    )}
                  />

                  {/* Tabs */}
                  <div className="tabs tabs-boxed mb-6">
                    <button
                      className={`tab ${activeTab === 'campaigns' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('campaigns')}
                    >
                      <i className="fas fa-bullhorn mr-2"></i>
                      Campanhas
                    </button>
                    <button
                      className={`tab ${activeTab === 'dispatches' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('dispatches')}
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      Disparos
                    </button>
                    <button
                      className={`tab ${activeTab === 'stats' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('stats')}
                    >
                      <i className="fas fa-chart-bar mr-2"></i>
                      Estatísticas
                    </button>
                  </div>

                  {/* Content */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6">
                      {activeTab === 'campaigns' && (
                        <WahaCampaignsManager userId={currentUser.id} />
                      )}
                      
                      {activeTab === 'dispatches' && (
                        <div className="text-center py-8">
                          <i className="fas fa-paper-plane text-4xl text-gray-400 mb-4"></i>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Histórico de Disparos
                          </h3>
                          <p className="text-gray-500">
                            Em desenvolvimento - Em breve você poderá ver o histórico detalhado de todos os disparos
                          </p>
                        </div>
                      )}
                      
                      {activeTab === 'stats' && (
                        <div className="text-center py-8">
                          <i className="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Estatísticas Detalhadas
                          </h3>
                          <p className="text-gray-500">
                            Em desenvolvimento - Em breve você terá acesso a relatórios completos de performance
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Disparo Rápido */}
      <WahaDispatchModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        clientes={clientes}
      />
    </div>
  )
}
