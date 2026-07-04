import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import prisma from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Plane, UtensilsCrossed, Building2, MapPin } from "lucide-react"
import { categoryLabels, computeSlug, getPriceNumber, getSectionLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: { slug: string }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  let pkg = await prisma.promo.findFirst({
    where: { sitePublished: true, siteSlug: params.slug },
  })

  if (!pkg) {
    const promos = await prisma.promo.findMany({ where: { sitePublished: true } })
    pkg = promos.find((p) => computeSlug(p) === params.slug) || null
  }

  if (!pkg) {
    return {
      title: "Pacote não encontrado | Donatti Turismo",
      description: "Pacote não encontrado",
    }
  }

  const title = `${pkg.destino} - ${pkg.hotel} | Donatti Turismo`
  const description =
    pkg.siteDescription ||
    `Pacote para ${pkg.destino} com ${pkg.numeroDeNoites} noites no ${pkg.hotel}. Consulte datas e saídas.`
  const keywords = Array.from(
    new Set([pkg.siteSection, pkg.destino, pkg.hotel, "pacotes de viagem", "Donatti Turismo"].filter(Boolean)),
  ) as string[]

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://donattiturismo.com.br/pacotes/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      images: pkg.siteImage ? [{ url: pkg.siteImage }] : undefined,
    },
  }
}

export default async function PackagePage({ params }: PageProps) {
  let pkg = await prisma.promo.findFirst({
    where: { sitePublished: true, siteSlug: params.slug },
  })

  if (!pkg) {
    const promos = await prisma.promo.findMany({ where: { sitePublished: true } })
    pkg = promos.find((p) => computeSlug(p) === params.slug) || null
  }

  if (!pkg) notFound()

  const related = await prisma.promo.findMany({
    where: { sitePublished: true, siteSlug: { not: null }, id: { not: pkg.id } },
    take: 3,
  })

  const totalValue = getPriceNumber(pkg.valor)
  const parcelas = pkg.parcelas || 15
  const installmentValue = parcelas > 0 ? totalValue / parcelas : totalValue
  const installmentFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(installmentValue)

  const departures = pkg.siteDepartures?.length
    ? pkg.siteDepartures.join(", ")
    : pkg.sp && pkg.cg
      ? "Campo Grande e São Paulo"
      : pkg.sp
        ? "São Paulo"
        : pkg.cg
          ? "Campo Grande"
          : "Consulte"

  const inclusions = pkg.siteInclusions?.length
    ? pkg.siteInclusions
    : ["Hotel", pkg.aereo ? "Aéreo incluso" : "Aéreo opcional", "Suporte 24/7"]

  const keywordTags = Array.from(
    new Set([pkg.siteSection, pkg.destino, pkg.hotel].filter(Boolean) as string[]),
  )

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.destino,
    description: pkg.siteDescription,
    brand: {
      "@type": "Organization",
      name: "Donatti Turismo",
    },
    image: pkg.siteImage,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "200",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: getPriceNumber(pkg.valor),
      availability: "https://schema.org/InStock",
      url: `https://donattiturismo.com.br/pacotes/${params.slug}`,
    },
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <div className="relative h-[420px] w-full overflow-hidden">
        <Image
          src={pkg.siteImage || "/images/hero-beach.jpg"}
          alt={pkg.destino}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <Badge className="bg-white/90 text-gray-900 mb-3">{getSectionLabel(pkg.siteSection)}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{pkg.destino}</h1>
            <p className="text-lg text-white/90 max-w-2xl">{pkg.siteDescription}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sobre o destino</h3>
              <p className="text-gray-700 leading-relaxed">
                {pkg.siteDescription || `Conheça ${pkg.destino} com ${pkg.numeroDeNoites} noites de hospedagem.`}
              </p>
              {keywordTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {keywordTags.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-gray-100 p-6 shadow-md bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Investimento por pessoa</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{installmentFormatted}</p>
            <p className="text-sm text-gray-600 mb-6">
              {parcelas}x sem juros • {pkg.numeroDeNoites} noites • {departures}
            </p>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                <a
                  href={`https://wa.me/5567992167694?text=${encodeURIComponent(
                    `Olá! Tenho interesse no pacote ${pkg.destino} (${pkg.dataFormatada}). Pode me enviar uma proposta?`
                  )}`}
                  data-analytics-event="whatsapp_click"
                  data-analytics-params={JSON.stringify({
                    location: "package_page",
                    package_slug: params.slug,
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
                    package_slug: params.slug,
                    destination: pkg.destino,
                  })}
                >
                  Falar com especialista
                </a>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Atendimento 24/7 • Melhor preço garantido • Cancelamento grátis em ofertas selecionadas
              </p>
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Por que reservar com a Donatti?</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Suporte antes, durante e após a viagem</li>
                <li>✓ 15 anos de experiência e 5.000+ clientes</li>
                <li>✓ Emissão segura e proteção de dados (LGPD)</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Outros pacotes que você pode gostar</h3>
            <Link href="/pacotes" className="text-sm text-primary hover:underline">
              Ver todos os pacotes
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/pacotes/${computeSlug(item)}`}
                data-analytics-event="select_package"
                data-analytics-params={JSON.stringify({
                  location: "related_packages",
                  from_package_slug: params.slug,
                  package_slug: computeSlug(item),
                  destination: item.destino,
                })}
                className="block rounded-xl border border-gray-100 p-4 hover:shadow-lg transition"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-lg mb-3">
                  <Image src={item.siteImage || "/images/hero-beach.jpg"} alt={item.destino} fill className="object-cover" sizes="400px" />
                </div>
                <p className="text-xs text-primary mb-1">{getSectionLabel(item.siteSection)}</p>
                <p className="font-semibold text-gray-900">{item.destino}</p>
                <p className="text-sm text-gray-600">{item.hotel}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
