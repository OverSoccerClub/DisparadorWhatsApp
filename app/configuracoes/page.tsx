import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ConfiguracoesPage from '@/components/ConfiguracoesPage'

export default function Configuracoes() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="px-3 md:px-4 lg:px-6">
              <ConfiguracoesPage />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
