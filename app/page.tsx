import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import DashboardReal from '@/components/DashboardReal'
import MainContent from '@/components/MainContent'

export default function Home() {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <Sidebar />
      
      <MainContent>
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="px-3 md:px-4 lg:px-6">
              <DashboardReal />
            </div>
          </div>
        </main>
      </MainContent>
    </div>
  )
}
