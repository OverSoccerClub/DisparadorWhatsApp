'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-error-600">Algo deu errado!</h2>
      <p className="mt-2 text-secondary-600">{error.message || 'Ocorreu um erro inesperado'}</p>
      <button
        onClick={() => reset()}
        className="mt-4 btn btn-primary"
      >
        Tentar novamente
      </button>
    </div>
  )
}

