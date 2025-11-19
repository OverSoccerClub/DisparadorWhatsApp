import Head from 'next/head'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import ManualPage from '@/components/ManualPage'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function getStaticProps() {
  try {
    const manualPath = join(process.cwd(), 'docs', 'user-manual.md')
    const manualContent = readFileSync(manualPath, 'utf-8')
    return {
      props: {
        manualContent
      }
    }
  } catch (error) {
    console.error('Erro ao carregar manual:', error)
    return {
      props: {
        manualContent: '# Manual do Usuário\n\nErro ao carregar o conteúdo do manual.'
      }
    }
  }
}

export default function Manual({ manualContent }: { manualContent: string }) {
  return (
    <>
      <Head>
        <title>Manual do Usuário - Fluxus Message</title>
      </Head>

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Sidebar />
        
        <MainContent>
          <Header />
          
          <main className="flex-1">
            <div className="py-6">
              <div className="px-3 md:px-4 lg:px-6">
                <ManualPage content={manualContent} />
              </div>
            </div>
          </main>
        </MainContent>
      </div>
    </>
  )
}

