import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/img/logo_marca_02_trasp.png"
            alt="Fluxus Menssager"
            width={200}
            height={200}
            className="h-auto w-auto"
            priority
          />
        </div>
        <h1 className="text-6xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-secondary-800 dark:text-secondary-200 mb-2">
          Página não encontrada
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}

