import Link from "next/link"
import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import { PackageCard } from "@/components/site/PackageCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActivePromos, getDestinations, promoDepartures } from "@/lib/publicPromos"
import { pageMeta } from "@/lib/seo"
import { WHATSAPP_NUMBER, absoluteUrl, destinationHeading } from "@/lib/site"
import { computeSlug, getPriceNumber } from "@/lib/utils"

export interface DepartureCity {
  city: "Campo Grande" | "São Paulo"
  airport: string
  path: string
  intro: string
}

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n)

export function departureMetadata(d: DepartureCity): Metadata {
  const title = `Pacotes de viagem saindo de ${d.city} (${d.airport})`
  const description = `Pacotes com aéreo e hotel saindo de ${d.city} (${d.airport}) para o Nordeste, Caribe, Rio e mais. Preço por pessoa, parcelado, com atendimento no WhatsApp.`
  return { title, description, ...pageMeta({ title, description, path: d.path }) }
}

/** Página por cidade de saída: "pacotes saindo de Campo Grande" */
export async function DeparturePage({ d }: { d: DepartureCity }) {
  const active = await getActivePromos().catch(() => [])
  const promos = active
    .filter((p) => promoDepartures(p).includes(d.city))
    .sort((a, b) => getPriceNumber(a.valor) - getPriceNumber(b.valor))
  const destinations = await getDestinations(promos)
  const minPrice = promos.length ? Math.min(...promos.map((p) => getPriceNumber(p.valor)).filter((n) => n > 0)) : 0
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Quero um pacote saindo de ${d.city}.`)}`

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <Breadcrumbs items={[{ name: `Saindo de ${d.city}`, href: d.path }]} className="text-gray-500" />
        <div className="max-w-3xl">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Saídas de {d.airport}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Pacotes de viagem saindo de <span className="gradient-text">{d.city}</span>
          </h1>
          <p className="text-lg text-gray-600">
            {d.intro}
            {minPrice > 0 ? ` Hoje são ${promos.length} pacotes, a partir de ${brl(minPrice)} por pessoa.` : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-analytics-event="whatsapp_click" data-analytics-params={JSON.stringify({ location: "departure_page", city: d.city })}>
                Pedir cotação no WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100">
              <Link href="/pacotes">Todos os pacotes</Link>
            </Button>
          </div>
        </div>

        {destinations.length > 0 && (
          <nav aria-label={`Destinos saindo de ${d.city}`}>
            <ul className="flex flex-wrap gap-2">
              {destinations.map((g) => (
                <li key={g.slug}>
                  <Link href={`/destinos/${g.slug}`} className="inline-block rounded-full border border-gray-200 px-4 py-2 text-sm hover:border-primary hover:text-primary">
                    {destinationHeading(g.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {promos.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <PackageCard key={p.id} promo={p} location="departure_page" />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Novas saídas de {d.city} chegando. Peça uma cotação no WhatsApp com o destino e as datas.</p>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Pacotes saindo de ${d.city}`,
          itemListElement: promos.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/pacotes/${computeSlug(p)}`),
            name: `${p.destino} - ${p.hotel}`,
          })),
        }}
      />
    </div>
  )
}
