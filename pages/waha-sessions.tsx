import Head from 'next/head'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import WahaServersManager from '@/components/WahaServersManager'

export default function WahaSessions() {
  return (
    <>
      <Head>
        <title>WAHA Sessions - Fluxus Message</title>
      </Head>

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Sidebar />
        
        <MainContent>
          <Header />
          
          <main className="flex-1">
            <div className="py-8">
              <div className="px-4 md:px-6 lg:px-8">
                <WahaServersManager />
              </div>
            </div>
          </main>
        </MainContent>
      </div>
    </>
  )
}

