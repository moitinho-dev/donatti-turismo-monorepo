import Link from "next/link"
import type { Metadata } from "next"
import RealTimePromos from "@/components/home/RealTimePromos"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActivePromos, getDestinations, toPublicPromo } from "@/lib/publicPromos"
import { pageMeta } from "@/lib/seo"
import { absoluteUrl, destinationHeading } from "@/lib/site"

export const revalidate = 300

const title = "Pacotes de viagem com aéreo e hotel"
const description =
  "Pacotes nacionais, internacionais e cruzeiros com aéreo e hotel saindo de Campo Grande e São Paulo. Preço por pessoa e parcelado no cartão."

export const metadata: Metadata = {
  title,
  description,
  ...pageMeta({ title, description, path: "/pacotes" }),
}

export default async function PacotesPage() {
  const active = await getActivePromos().catch(() => [])
  const promos = active.slice(0, 120).map(toPublicPromo)
  const destinations = await getDestinations(active)

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <Breadcrumbs items={[{ name: "Pacotes", href: "/pacotes" }]} className="text-gray-500" />
        <div className="max-w-3xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Catálogo de pacotes</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Pacotes de viagem com <span className="gradient-text">aéreo e hotel</span>
          </h1>
          <p className="text-lg text-gray-600">
            Todas as ofertas da Donatti Turismo saindo de Campo Grande (CGR) e São Paulo (GRU). Filtre por preço, duração e saída, e fale com
            uma especialista no WhatsApp para confirmar data e tarifa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <Link href="/destinos">Ver destinos</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100">
              <Link href="/#ofertas">Ofertas da semana</Link>
            </Button>
          </div>
        </div>

        <RealTimePromos limit={120} promos={promos} />

        {destinations.length > 0 && (
          <section aria-labelledby="destinos-title" className="border-t border-gray-100 pt-10">
            <h2 id="destinos-title" className="mb-4 text-2xl font-bold">
              Pacotes por destino
            </h2>
            <ul className="flex flex-wrap gap-2">
              {destinations.map((d) => (
                <li key={d.slug}>
                  <Link href={`/destinos/${d.slug}`} className="inline-block rounded-full border border-gray-200 px-4 py-2 text-sm hover:border-primary hover:text-primary">
                    {destinationHeading(d.name)} ({d.promos.length})
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Pacotes de viagem Donatti Turismo",
          itemListElement: promos.slice(0, 50).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/pacotes/${p.SITE_SLUG}`),
            name: `${p.DESTINO} - ${p.HOTEL}`,
          })),
        }}
      />
    </div>
  )
}
