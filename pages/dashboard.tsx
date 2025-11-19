import Head from 'next/head'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import DashboardReal from '@/components/DashboardReal'

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard - Fluxus Message</title>
      </Head>

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
    </>
  )
}

