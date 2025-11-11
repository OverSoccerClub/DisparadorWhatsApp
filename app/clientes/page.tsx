import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import ClientesPageReal from '@/components/ClientesPageReal'

export default function Clientes() {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <Sidebar />
      
      <MainContent>
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="px-3 md:px-4 lg:px-6">
              <ClientesPageReal />
            </div>
          </div>
        </main>
      </MainContent>
    </div>
  )
}
