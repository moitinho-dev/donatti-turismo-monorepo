import Link from "next/link"
import type { Metadata } from "next"
import RealTimePromos from "@/components/home/RealTimePromos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Pacotes de Viagem | Donatti Turismo",
  description: "Pacotes nacionais, internacionais, cruzeiros e lua de mel com melhor preço garantido e suporte 24/7.",
}

export default function PacotesPage() {
  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <div className="max-w-3xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Catálogo de Pacotes</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Escolha seu próximo <span className="gradient-text">pacote</span>
          </h1>
          <p className="text-lg text-gray-600">
            Filtre por preço, duração e saídas. Clique no card para ver detalhes e solicitar orçamento com um especialista.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <Link href="/destinos">Ver todos os destinos</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100">
              <Link href="/#ofertas">Voltar para ofertas</Link>
            </Button>
          </div>
        </div>

        <RealTimePromos limit={120} />
      </div>
    </div>
  )
}

