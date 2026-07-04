"use client"

import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center bg-white text-gray-900 px-4">
      <div className="text-center max-w-lg">
        <p className="text-6xl font-bold text-red-500 mb-4">Oops!</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Algo deu errado</h1>
        <p className="text-gray-600 text-lg mb-8">
          Ocorreu um erro inesperado. Por favor, tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Voltar para Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            ID do erro: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}