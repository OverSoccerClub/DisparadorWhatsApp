'use client'

import { useState } from 'react'
import Head from 'next/head'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import ChipMaturationModal from '@/components/ChipMaturationModal'

export default function Maturacao() {
  // Na página dedicada, o modal sempre está aberto
  const [isOpen] = useState(true)
  
  const handleClose = () => {
    // Não permitir fechar na página dedicada - redirecionar para dashboard se necessário
    // Ou simplesmente não fazer nada
  }

  return (
    <>
      <Head>
        <title>Maturação - Fluxus Message</title>
      </Head>

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Sidebar />
        
        <MainContent>
          <Header />
          
          <main className="flex-1">
            <div className="py-6">
              <div className="px-3 md:px-4 lg:px-6">
                <ChipMaturationModal isOpen={isOpen} onClose={handleClose} />
              </div>
            </div>
          </main>
        </MainContent>
      </div>
    </>
  )
}

