import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import prisma from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { categoryLabels, computeSlug, getSectionLabel } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Destinos | Donatti Turismo",
  description: "Veja todos os destinos atendidos pela Donatti Turismo e escolha o pacote ideal com suporte 24/7.",
}


export default async function DestinosPage() {
  const packages = await prisma.promo.findMany({
    where: { sitePublished: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <div className="max-w-3xl">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Guia de Destinos</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Todos os <span className="gradient-text">destinos</span> Donatti
          </h1>
          <p className="text-lg text-gray-600">
            Explore nossa curadoria com pacotes nacionais, internacionais, cruzeiros e lua de mel. Clique para ver detalhes completos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <Link href="/pacotes">Ver pacotes</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100">
              <Link href="/#ofertas">Voltar para ofertas</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/destinos/${computeSlug(pkg)}`}
              data-analytics-event="select_destination"
              data-analytics-params={JSON.stringify({
                destination: pkg.destino,
                destination_slug: computeSlug(pkg),
              })}
              className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-48 w-full">
                <Image src={pkg.siteImage || "/images/hero-beach.jpg"} alt={pkg.destino} fill className="object-cover group-hover:scale-105 transition" sizes="400px" />
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-primary font-semibold">{getSectionLabel(pkg.siteSection)}</p>
                <h2 className="text-xl font-semibold text-gray-900">{pkg.destino}</h2>
                <p className="text-sm text-gray-600 line-clamp-2">{pkg.siteDescription}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
