import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import prisma from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Plane } from "lucide-react"
import { categoryLabels, computeSlug, getSectionLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: { slug: string }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  let destination = await prisma.promo.findFirst({
    where: { sitePublished: true, siteSlug: params.slug },
  })
  if (!destination) {
    const promos = await prisma.promo.findMany({ where: { sitePublished: true } })
    destination = promos.find((p) => computeSlug(p) === params.slug) || null
  }

  if (!destination) {
    return {
      title: "Destino não encontrado | Donatti Turismo",
      description: "Destino não encontrado",
    }
  }

  const title = `${destination.destino} | Donatti Turismo`
  const description =
    destination.siteDescription || `Conheça ${destination.destino} e encontre pacotes com suporte 24/7 e preço garantido.`
  const keywords = Array.from(
    new Set(
      [destination.siteSection, destination.destino, destination.hotel, "destinos", "Donatti Turismo"].filter(Boolean),
    ),
  ) as string[]

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://donattiturismo.com.br/destinos/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      images: destination.siteImage ? [{ url: destination.siteImage }] : undefined,
    },
  }
}

export default async function DestinationPage({ params }: PageProps) {
  let destination = await prisma.promo.findFirst({
    where: { sitePublished: true, siteSlug: params.slug },
  })
  if (!destination) {
    const promos = await prisma.promo.findMany({ where: { sitePublished: true } })
    destination = promos.find((p) => computeSlug(p) === params.slug) || null
  }
  if (!destination) notFound()

  const relatedPackages = await prisma.promo.findMany({
    where: { sitePublished: true, siteSection: destination.siteSection, id: { not: destination.id } },
    take: 4,
  })

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.destino,
    description: destination.siteDescription,
    image: destination.siteImage,
    url: `https://donattiturismo.com.br/destinos/${params.slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "200",
    },
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <div className="relative h-[420px] md:h-[560px] w-full overflow-hidden">
        <Image src={destination.siteImage || "/images/hero-beach.jpg"} alt={destination.destino} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <Badge className="bg-white/90 text-gray-900 mb-3">{getSectionLabel(destination.siteSection)}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{destination.destino}</h1>
            <p className="text-white/90 max-w-2xl">{destination.siteDescription}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Por que ir com a Donatti</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 bg-primary rounded-full" />
              Atendimento 24/7 antes, durante e depois da viagem
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 bg-primary rounded-full" />
              Preço garantido: se baixar, devolvemos a diferença
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 bg-primary rounded-full" />
              Cancelamento grátis em ofertas selecionadas
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 bg-primary rounded-full" />
              Roteiros personalizados de acordo com seu perfil
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Pacotes disponíveis</h2>
            <Link href="/pacotes" className="text-sm text-primary hover:underline">
              Ver todos os pacotes
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(relatedPackages.length ? relatedPackages : [destination]).map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative h-20 w-28 overflow-hidden rounded-lg flex-shrink-0">
                    <Image src={pkg.siteImage || "/images/hero-beach.jpg"} alt={pkg.destino} fill className="object-cover" sizes="200px" />
                  </div>
                  <div>
                    <p className="text-xs text-primary mb-1">{getSectionLabel(pkg.siteSection)}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.destino}</h3>
                    <p className="text-sm text-gray-600">{pkg.hotel}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                  <span className="inline-flex items-center gap-1">
                    <Plane className="h-4 w-4 text-primary" /> {pkg.aereo ? "Com aéreo" : "Sem aéreo"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" /> {pkg.dataFormatada}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" /> Saídas: {(pkg.siteDepartures?.length ? pkg.siteDepartures : ["Consulte"]).join(", ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    <Link
                      href={`/pacotes/${computeSlug(pkg)}`}
                      data-analytics-event="select_package"
                      data-analytics-params={JSON.stringify({
                        location: "destination_page",
                        destination_slug: params.slug,
                        package_slug: computeSlug(pkg),
                        destination: pkg.destino,
                      })}
                    >
                      Ver pacote
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <a
                      href={`https://wa.me/5567992167694?text=${encodeURIComponent(
                        `Quero falar sobre o destino ${pkg.destino} e o pacote ${pkg.hotel}`
                      )}`}
                      data-analytics-event="whatsapp_click"
                      data-analytics-params={JSON.stringify({
                        location: "destination_page",
                        destination_slug: params.slug,
                        package_slug: computeSlug(pkg),
                        destination: pkg.destino,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Falar agora
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
