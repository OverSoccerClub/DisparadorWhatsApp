'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/img/logo_marca_02_trasp.png" 
            alt="WhatsApp Dispatcher" 
            className="h-16 w-auto"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-error-600 dark:text-error-400 mb-2">
          Algo deu errado!
        </h2>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400 mb-6">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

