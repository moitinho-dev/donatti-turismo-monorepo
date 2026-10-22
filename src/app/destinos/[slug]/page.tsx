import Image from "next/image"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import { PackageCard } from "@/components/site/PackageCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { findPublishedPromoBySlug, getDestinationBySlug, promoDepartures, promoRegime, type DestinationGroup } from "@/lib/publicPromos"
import { clampDescription, pageMeta } from "@/lib/seo"
import { WHATSAPP_NUMBER, absoluteUrl, destinationHeading, destinationOf } from "@/lib/site"
import { computeSlug, getPriceNumber, getSectionLabel } from "@/lib/utils"

export const revalidate = 300

type PageProps = {
  params: Promise<{ slug: string }>
}

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n)

/** Antes cada promo tinha sua página em /destinos/<slug-da-promo>; agora é uma página por destino */
async function resolve(slug: string): Promise<DestinationGroup> {
  const group = await getDestinationBySlug(slug)
  if (group) return group
  const promo = await findPublishedPromoBySlug(slug)
  if (promo) {
    const target = destinationOf(promo.destino).slug
    if (target && target !== slug) permanentRedirect(`/destinos/${target}`)
  }
  notFound()
}

function summarize(d: DestinationGroup) {
  const nights = d.promos.map((p) => parseInt(p.numeroDeNoites, 10)).filter((n) => n > 0)
  const departures = [...new Set(d.promos.flatMap(promoDepartures))]
  const regimes = [...new Set(d.promos.map(promoRegime).filter(Boolean))] as string[]
  const maxParcelas = Math.max(...d.promos.map((p) => p.parcelas || 0))
  const withFlight = d.promos.some((p) => p.aereo)
  return {
    minNights: nights.length ? Math.min(...nights) : null,
    maxNights: nights.length ? Math.max(...nights) : null,
    departures,
    regimes,
    maxParcelas,
    withFlight,
    minPrice: Number.isFinite(d.minPrice) ? d.minPrice : null,
  }
}

function faqFor(d: DestinationGroup) {
  const s = summarize(d)
  const faqs: { q: string; a: string }[] = []
  if (s.minPrice) {
    faqs.push({
      q: `Quanto custa um pacote para ${d.name}?`,
      a: `Hoje os pacotes para ${d.name} começam em ${brl(s.minPrice)} por pessoa${s.maxParcelas > 1 ? `, em até ${s.maxParcelas}x no cartão` : ""}. O valor final depende da data e é confirmado no atendimento.`,
    })
  }
  if (s.departures.length) {
    faqs.push({
      q: `De onde saem os pacotes para ${d.name}?`,
      a: `As saídas atuais são de ${s.departures.join(" e ")}. Também cotamos saídas de outras cidades pelo WhatsApp.`,
    })
  }
  if (s.minNights) {
    faqs.push({
      q: `Quantas noites tem o pacote para ${d.name}?`,
      a:
        s.minNights === s.maxNights
          ? `Os pacotes atuais têm ${s.minNights} noites${s.withFlight ? ", com aéreo ida e volta" : ""}.`
          : `Há opções de ${s.minNights} a ${s.maxNights} noites${s.withFlight ? ", com aéreo ida e volta" : ""}.`,
    })
  }
  if (s.regimes.length) {
    faqs.push({
      q: `O pacote para ${d.name} inclui alimentação?`,
      a: `Depende do hotel: temos opções com ${s.regimes.map((r) => r.toLowerCase()).join(", ")}. Cada pacote abaixo mostra o regime.`,
    })
  }
  faqs.push({
    q: `Como reservar o pacote para ${d.name}?`,
    a: "Escolha o pacote, toque em Solicitar orçamento e fale com uma especialista no WhatsApp. Ela confirma data, tarifa e forma de pagamento (cartão, Pix ou boleto).",
  })
  return faqs
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const d = await getDestinationBySlug(slug)
  if (!d) return { title: "Destino não encontrado", robots: { index: false } }

  const s = summarize(d)
  const heading = destinationHeading(d.name)
  // Nicho com pouca concorrência: "pacote <destino> saindo de Campo Grande"
  const title = s.departures.includes("Campo Grande") ? `${heading} saindo de Campo Grande` : `${heading} com aéreo e hotel`
  const description = clampDescription(
    `${heading} saindo de ${s.departures.length ? s.departures.join(" e ") : "Campo Grande e São Paulo"}${
      s.minPrice ? `, a partir de ${brl(s.minPrice)} por pessoa` : ""
    }${s.maxParcelas > 1 ? ` em até ${s.maxParcelas}x` : ""}. ${d.promos.length} ${d.promos.length === 1 ? "opção" : "opções"} de hotel e datas, com atendimento humano no WhatsApp.`,
  )
  return {
    title,
    description,
    ...pageMeta({ title, description, path: `/destinos/${d.slug}`, image: d.image, imageAlt: `Foto de ${d.name}` }),
  }
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params
  const d = await resolve(slug)
  const s = summarize(d)
  const heading = destinationHeading(d.name)
  const faqs = faqFor(d)
  const promos = [...d.promos].sort((a, b) => getPriceNumber(a.valor) - getPriceNumber(b.valor))
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Quero uma cotação de pacote para ${d.name}.`)}`

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="relative h-[380px] md:h-[480px] w-full overflow-hidden">
        <Image src={d.image} alt={`Foto de ${d.name}`} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <Breadcrumbs
              items={[
                { name: "Destinos", href: "/destinos" },
                { name: d.name, href: `/destinos/${d.slug}` },
              ]}
              className="mb-4 text-white/85"
            />
            <Badge className="bg-white/90 text-gray-900 mb-3">{getSectionLabel(d.section)}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{heading}</h1>
            <p className="text-white/90 max-w-2xl text-lg">
              Com aéreo e hotel, saindo de {s.departures.length ? s.departures.join(" e ") : "Campo Grande e São Paulo"}
              {s.minPrice ? `, a partir de ${brl(s.minPrice)} por pessoa` : ""}.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-12">
        <section aria-labelledby="pacotes-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="pacotes-title" className="text-2xl md:text-3xl font-bold">
                {d.promos.length} {d.promos.length === 1 ? "pacote disponível" : "pacotes disponíveis"} para {d.name}
              </h2>
              <p className="text-gray-600">Preços por pessoa, do menor para o maior. Tarifa e disponibilidade confirmadas no atendimento.</p>
            </div>
            <Link href="/pacotes" className="text-sm text-primary hover:underline">
              Ver pacotes de outros destinos
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <PackageCard key={p.id} promo={p} location="destination_page" />
            ))}
          </div>
        </section>

        <section aria-labelledby="sobre-title" className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <h2 id="sobre-title" className="text-2xl font-bold">
              Viajar para {d.name} com a Donatti
            </h2>
            {d.description && <p className="text-gray-700 leading-relaxed">{d.description}</p>}
            <p className="text-gray-700 leading-relaxed">
              Montamos pacotes para {d.name} com {s.withFlight ? "aéreo ida e volta, " : ""}hotel selecionado e atendimento humano antes, durante e
              depois da viagem. As saídas principais são de Campo Grande (CGR) e São Paulo (GRU), com parcelamento no cartão, Pix ou boleto.
            </p>
          </div>
          <aside className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <p className="font-semibold">Quer outra data ou hotel em {d.name}?</p>
            <p className="mt-1 text-sm text-gray-600">Uma especialista monta a cotação para você pelo WhatsApp.</p>
            <Button asChild className="mt-4 w-full bg-primary text-white hover:bg-primary/90">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-event="whatsapp_click"
                data-analytics-params={JSON.stringify({ location: "destination_page", destination_slug: d.slug, destination: d.name })}
              >
                Pedir cotação no WhatsApp
              </a>
            </Button>
          </aside>
        </section>

        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="mb-4 text-2xl font-bold">
            Perguntas sobre pacotes para {d.name}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-gray-900">{f.q}</summary>
                <p className="mt-2 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: d.name,
            description: d.description || undefined,
            image: absoluteUrl(d.image),
            url: absoluteUrl(`/destinos/${d.slug}`),
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            itemListElement: promos.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/pacotes/${computeSlug(p)}`),
              name: `${p.destino} - ${p.hotel}`,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />
    </div>
  )
}
