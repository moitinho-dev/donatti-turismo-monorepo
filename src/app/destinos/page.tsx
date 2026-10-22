import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDestinations } from "@/lib/publicPromos"
import { pageMeta } from "@/lib/seo"
import { absoluteUrl, destinationHeading } from "@/lib/site"
import { getSectionLabel } from "@/lib/utils"

export const revalidate = 300

const title = "Destinos de viagem com aéreo e hotel"
const description =
  "Escolha o destino e veja os pacotes com aéreo e hotel saindo de Campo Grande e São Paulo: Nordeste, Rio, Caribe, cruzeiros e mais, com preço por pessoa."

export const metadata: Metadata = {
  title,
  description,
  ...pageMeta({ title, description, path: "/destinos" }),
}

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n)

export default async function DestinosPage() {
  const destinations = await getDestinations().catch(() => [])

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <Breadcrumbs items={[{ name: "Destinos", href: "/destinos" }]} className="text-gray-500" />
        <div className="max-w-3xl">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Guia de destinos</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Destinos com pacotes <span className="gradient-text">saindo de Campo Grande e São Paulo</span>
          </h1>
          <p className="text-lg text-gray-600">
            Cada destino reúne os pacotes ativos com aéreo e hotel, datas, regime de alimentação e preço por pessoa. Não achou o seu? A gente cota
            pelo WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <Link href="/pacotes">Ver todos os pacotes</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100">
              <Link href="/#contato">Pedir cotação</Link>
            </Button>
          </div>
        </div>

        {destinations.length === 0 ? (
          <p className="text-gray-600">Novas ofertas chegando. Fale com a gente no WhatsApp para uma cotação.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <Link
                key={d.slug}
                href={`/destinos/${d.slug}`}
                data-analytics-event="select_destination"
                data-analytics-params={JSON.stringify({ destination: d.name, destination_slug: d.slug })}
                className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
              >
                <div className="relative h-48 w-full">
                  <Image src={d.image} alt={`Foto de ${d.name}`} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 400px" />
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-xs text-primary font-semibold">{getSectionLabel(d.section)}</p>
                  <h2 className="text-xl font-semibold text-gray-900">{destinationHeading(d.name)}</h2>
                  <p className="text-sm text-gray-600">
                    {d.promos.length} {d.promos.length === 1 ? "pacote" : "pacotes"}
                    {Number.isFinite(d.minPrice) ? ` · a partir de ${brl(d.minPrice)} por pessoa` : ""}
                  </p>
                  {d.description && <p className="text-sm text-gray-600 line-clamp-2">{d.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Destinos Donatti Turismo",
          itemListElement: destinations.map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/destinos/${d.slug}`),
            name: destinationHeading(d.name),
          })),
        }}
      />
    </div>
  )
}
