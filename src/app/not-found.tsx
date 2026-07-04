import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Página não encontrada | Donatti Turismo",
  description: "A página que você procura não foi encontrada.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center bg-white text-gray-900 px-4">
      <div className="text-center max-w-lg">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Página não encontrada</h1>
        <p className="text-gray-600 text-lg mb-8">
          A página que você procura pode ter sido removida, renomeada ou está temporariamente indisponível.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Voltar para Home
          </Link>
          <Link
            href="/pacotes"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Ver Pacotes
          </Link>
        </div>
      </div>
    </main>
  )
}