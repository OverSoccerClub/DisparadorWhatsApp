import Head from 'next/head'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import ChangelogPage from '@/components/ChangelogPage'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function getServerSideProps() {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md')
    const changelogContent = readFileSync(changelogPath, 'utf-8')
    return {
      props: {
        changelogContent: changelogContent || '# Changelog\n\nConteúdo não disponível.'
      }
    }
  } catch (error) {
    console.error('Erro ao carregar changelog:', error)
    // Tentar caminho alternativo
    try {
      const altPath = join(process.cwd(), '..', 'CHANGELOG.md')
      const changelogContent = readFileSync(altPath, 'utf-8')
      return {
        props: {
          changelogContent: changelogContent || '# Changelog\n\nConteúdo não disponível.'
        }
      }
    } catch (altError) {
      return {
        props: {
          changelogContent: '# Changelog\n\nErro ao carregar o conteúdo do changelog. Por favor, entre em contato com o suporte.'
        }
      }
    }
  }
}

export default function Changelog({ changelogContent }: { changelogContent: string }) {
  return (
    <>
      <Head>
        <title>Changelog - Fluxus Message</title>
      </Head>

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Sidebar />
        
        <MainContent>
          <Header />
          
          <main className="flex-1">
            <div className="py-6">
              <div className="px-3 md:px-4 lg:px-6">
                <ChangelogPage content={changelogContent} />
              </div>
            </div>
          </main>
        </MainContent>
      </div>
    </>
  )
}

