import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import type { Promo } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import { PackageCard } from "@/components/site/PackageCard"
import { Calendar, Plane, UtensilsCrossed, Building2 } from "lucide-react"
import { findPublishedPromoBySlug, getActivePromos, promoDepartures, promoRegime } from "@/lib/publicPromos"
import { clampDescription, pageMeta } from "@/lib/seo"
import { SITE_NAME, SITE_URL, WHATSAPP_NUMBER, absoluteUrl, destinationOf, destinationPhrase, promoImageUrl } from "@/lib/site"
import { getPriceNumber, getSectionLabel, isPromoExpired, parsePromoDates } from "@/lib/utils"

export const revalidate = 300

type PageProps = {
  params: Promise<{ slug: string }>
}

const brlShort = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n)

function describe(pkg: Promo) {
  const total = getPriceNumber(pkg.valor)
  const parcelas = pkg.parcelas || 15
  const departures = promoDepartures(pkg)
  const regime = promoRegime(pkg)
  return clampDescription(
    `Pacote para ${pkg.destino} com ${pkg.numeroDeNoites} noites no ${pkg.hotel}${pkg.aereo ? " e aéreo ida e volta" : ""}${
      regime ? `, ${regime.toLowerCase()}` : ""
    }${departures.length ? `, saindo de ${departures.join(" e ")}` : ""}. ${
      total > 0 ? `${parcelas}x de ${brlShort(total / parcelas)} por pessoa. ` : ""
    }${pkg.dataFormatada}.`,
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pkg = await findPublishedPromoBySlug(slug)
  if (!pkg) return { title: "Pacote não encontrado", robots: { index: false } }

  const title = `Pacote ${pkg.destino}: ${pkg.numeroDeNoites} noites no ${pkg.hotel}`
  const description = describe(pkg)
  const expired = isPromoExpired(pkg.dataFormatada)
  return {
    title,
    description,
    // Oferta encerrada: some do Google, mas o link continua levando ao destino
    robots: expired ? { index: false, follow: true } : undefined,
    ...pageMeta({ title, description, path: `/pacotes/${slug}`, image: promoImageUrl(pkg), imageAlt: `Foto de ${pkg.destino}` }),
  }
}

export default async function PackagePage({ params }: PageProps) {
  const { slug } = await params
  const pkg = await findPublishedPromoBySlug(slug)
  if (!pkg) notFound()

  const expired = isPromoExpired(pkg.dataFormatada)
  const destination = destinationOf(pkg.destino)
  const active = await getActivePromos()
  const sameDestination = active.filter((p) => p.id !== pkg.id && destinationOf(p.destino).slug === destination.slug)
  const related = [...sameDestination, ...active.filter((p) => p.id !== pkg.id && !sameDestination.includes(p) && p.siteSection === pkg.siteSection)].slice(0, 3)
  const image = promoImageUrl(pkg)

  const totalValue = getPriceNumber(pkg.valor)
  const originalValue = getPriceNumber(pkg.valorOriginal || "")
  const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
  const parcelas = pkg.parcelas || 15
  const installmentValue = parcelas > 0 ? totalValue / parcelas : totalValue
  const installmentFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(installmentValue)

  const departureList = promoDepartures(pkg)
  const departures = departureList.length ? departureList.join(" e ") : "Consulte"

  const inclusions = pkg.siteInclusions?.length
    ? pkg.siteInclusions
    : ["Hotel", pkg.aereo ? "Aéreo incluso" : "Aéreo sob consulta", "Atendimento no WhatsApp"]

  const { end } = parsePromoDates(pkg.dataFormatada)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Pacote ${pkg.destino} - ${pkg.hotel} (${pkg.numeroDeNoites} noites)`,
    description: pkg.siteDescription || describe(pkg),
    image: absoluteUrl(image),
    category: "Pacote de viagem",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: totalValue.toFixed(2),
      availability: expired ? "https://schema.org/Discontinued" : "https://schema.org/InStock",
      ...(end ? { priceValidUntil: end.toISOString().slice(0, 10) } : {}),
      url: absoluteUrl(`/pacotes/${slug}`),
      seller: { "@id": `${SITE_URL}/#agencia` },
    },
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <JsonLd data={schemaData} />
      <div className="relative h-[420px] w-full overflow-hidden">
        <Image
          src={image}
          alt={`Foto de ${pkg.destino}`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <Breadcrumbs
              items={[
                { name: "Destinos", href: "/destinos" },
                { name: destination.name, href: `/destinos/${destination.slug}` },
                { name: pkg.hotel, href: `/pacotes/${slug}` },
              ]}
              className="mb-4 text-white/85"
            />
            <Badge className="bg-white/90 text-gray-900 mb-3">{getSectionLabel(pkg.siteSection)}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pacote {pkg.destino}: {pkg.numeroDeNoites} noites no {pkg.hotel}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">{pkg.siteDescription}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {expired && (
          <div role="status" className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-semibold">Esta oferta já encerrou.</p>
            <p className="text-sm">
              Veja os{" "}
              <Link href={`/destinos/${destination.slug}`} className="font-semibold underline">
                {destinationPhrase(destination.name)}
              </Link>{" "}
              disponíveis agora ou peça uma cotação para outra data.
            </p>
          </div>
        )}
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">O que está incluído</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Plane className="h-5 w-5 text-primary mt-1" />
                  <div>
                  <p className="font-semibold text-gray-900">Aéreo</p>
                  <p className="text-sm text-gray-600">
                      {pkg.aereo ? "Ida e volta com bagagem" : "Aéreo opcional sob consulta"}
                  </p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-1" />
                  <div>
                  <p className="font-semibold text-gray-900">Hotel</p>
                    <p className="text-sm text-gray-600">{pkg.hotel}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UtensilsCrossed className="h-5 w-5 text-primary mt-1" />
                  <div>
                  <p className="font-semibold text-gray-900">Refeições</p>
                    <p className="text-sm text-gray-600">{pkg.allInclusive ? "All Inclusive" : pkg.pensaoCompleta ? "Pensão Completa" : pkg.meiaPensao ? "Meia Pensão" : pkg.comCafe ? "Com Café" : "Sem pensão"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                  <p className="font-semibold text-gray-900">Datas e saídas</p>
                  <p className="text-sm text-gray-600">
                      {pkg.dataFormatada} — Saídas de {departures}
                  </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {inclusions.map((item) => (
                    <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sobre o destino</h2>
              <p className="text-gray-700 leading-relaxed">
                {pkg.siteDescription || `Conheça ${pkg.destino} com ${pkg.numeroDeNoites} noites de hospedagem.`}
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-gray-100 p-6 shadow-md bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Investimento por pessoa</p>
            {originalValue > totalValue && (
              <p className="mb-1 flex items-center gap-2 text-sm">
                <span className="text-gray-400 line-through">De {brl(originalValue)}</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-green-700">
                  -{Math.round((1 - totalValue / originalValue) * 100)}%
                </span>
              </p>
            )}
            <p className="text-4xl font-bold text-gray-900 mb-1">{installmentFormatted}</p>
            <p className="text-sm text-gray-600 mb-6">
              {parcelas}x • total {brl(totalValue)} • {pkg.numeroDeNoites} noites • {departures}
            </p>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Olá! Tenho interesse no pacote ${pkg.destino} (${pkg.dataFormatada}). Pode me enviar uma proposta?`
                  )}`}
                  data-analytics-event="whatsapp_click"
                  data-analytics-params={JSON.stringify({
                    location: "package_page",
                    package_slug: slug,
                    destination: pkg.destino,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar orçamento
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                <a
                  href="tel:+5567992167694"
                  data-analytics-event="phone_click"
                  data-analytics-params={JSON.stringify({
                    location: "package_page",
                    package_slug: slug,
                    destination: pkg.destino,
                  })}
                >
                  Falar com especialista
                </a>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Atendimento humano • Disponibilidade e tarifa confirmadas na hora
              </p>
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Por que reservar com a Donatti?</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Suporte antes, durante e após a viagem</li>
                <li>✓ Agência em Campo Grande/MS · CNPJ 41.887.394/0001-29</li>
                <li>✓ Emissão segura e proteção de dados (LGPD)</li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-12" aria-labelledby="relacionados-title">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 id="relacionados-title" className="text-xl font-semibold text-gray-900">
              {sameDestination.length ? `Outros pacotes para ${destination.name}` : related.length ? "Outros pacotes que você pode gostar" : "Mais opções"}
            </h2>
            <Link href={`/destinos/${destination.slug}`} className="text-sm text-primary hover:underline">
              Todos os {destinationPhrase(destination.name)}
            </Link>
          </div>
          {related.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <PackageCard key={item.id} promo={item} location="related_packages" />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              Procurando outra data ou hotel?{" "}
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                Fale com a gente no WhatsApp
              </a>
              .
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
