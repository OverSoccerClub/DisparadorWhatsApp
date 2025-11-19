import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import AppProviders from '@/components/AppProviders'
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  // Páginas públicas (sem providers)
  const isPublicPage = router.pathname === '/' || router.pathname === '/landing'
  
  // Página de auth
  const isAuthPage = router.pathname === '/auth'

  if (isPublicPage || isAuthPage) {
    return (
      <>
        <style jsx global>{`
          html {
            font-family: ${inter.style.fontFamily};
          }
        `}</style>
        <Component {...pageProps} />
      </>
    )
  }

  // Páginas protegidas (com todos os providers)
  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      <AppProviders>
        <Component {...pageProps} />
      </AppProviders>
    </>
  )
}

