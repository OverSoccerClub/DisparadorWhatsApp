import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import RelatoriosPage from '@/components/RelatoriosPage'

export default function Relatorios() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="px-3 md:px-4 lg:px-6">
              <RelatoriosPage />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
