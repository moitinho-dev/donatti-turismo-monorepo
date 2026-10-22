import type { Promo } from "@prisma/client"
import type { PublicPromo } from "@/components/home/RealTimePromos"
import prisma from "./db"
import { suggestSiteSection } from "./destinations"
import { destinationOf, promoImageUrl } from "./site"
import { computeSlug, getPriceNumber, isPromoExpired } from "./utils"

/** Promos publicadas no site cuja data de ida ainda não passou, mais recentes primeiro */
export async function getActivePromos(): Promise<Promo[]> {
  const all = await prisma.promo.findMany({ where: { sitePublished: true }, orderBy: { createdAt: "desc" } })
  const now = new Date()
  return all.filter((p) => !isPromoExpired(p.dataFormatada, now))
}

export function toPublicPromo(promo: Promo): PublicPromo {
  return {
    id: promo.id,
    DATA_FORMATADA: promo.dataFormatada,
    DESTINO: promo.destino,
    HOTEL: promo.hotel,
    VALOR: promo.valor,
    PARCELAS: promo.parcelas,
    COM_CAFE: promo.comCafe,
    SEM_CAFE: promo.semCafe,
    MEIA_PENSAO: promo.meiaPensao,
    PENSAO_COMPLETA: promo.pensaoCompleta,
    ALL_INCLUSIVE: promo.allInclusive,
    NUMERO_DE_NOITES: promo.numeroDeNoites,
    SP: promo.sp,
    CG: promo.cg,
    AEREO: promo.aereo,
    SITE_SECTION: promo.siteSection || suggestSiteSection(promo.destino) || "nacionais",
    SITE_SLUG: computeSlug(promo),
    SITE_IMAGE: promoImageUrl(promo),
    SITE_DESCRIPTION: promo.siteDescription,
    SITE_INCLUSIONS: promo.siteInclusions,
    SITE_DEPARTURES: promo.siteDepartures,
    VALOR_ORIGINAL: promo.valorOriginal,
    CAMPAIGN: promo.campaign,
  }
}

export async function getPublicPromos(limit = 60): Promise<PublicPromo[]> {
  return (await getActivePromos()).slice(0, limit).map(toPublicPromo)
}

/** Promo publicada pelo slug (inclui as já encerradas, que a página trata à parte) */
export async function findPublishedPromoBySlug(slug: string): Promise<Promo | null> {
  const direct = await prisma.promo.findFirst({ where: { sitePublished: true, siteSlug: slug } })
  if (direct) return direct
  const all = await prisma.promo.findMany({ where: { sitePublished: true } })
  return all.find((p) => computeSlug(p) === slug) || null
}

export interface DestinationGroup {
  name: string
  slug: string
  section: string
  image: string
  description: string | null
  minPrice: number
  promos: Promo[]
}

/** Agrupa as promos ativas por destino canônico (uma página por destino) */
export async function getDestinations(promos?: Promo[]): Promise<DestinationGroup[]> {
  const list = promos ?? (await getActivePromos())
  const groups = new Map<string, DestinationGroup>()
  for (const p of list) {
    const d = destinationOf(p.destino)
    if (!d.slug) continue
    let g = groups.get(d.slug)
    if (!g) {
      g = {
        name: d.name,
        slug: d.slug,
        section: p.siteSection || d.category || "nacionais",
        image: promoImageUrl(p),
        description: p.siteDescription,
        minPrice: Number.POSITIVE_INFINITY,
        promos: [],
      }
      groups.set(d.slug, g)
    }
    g.promos.push(p)
    if (!g.description && p.siteDescription) g.description = p.siteDescription
    if (g.image.endsWith("hero-beach.jpg") && p.siteImage) g.image = promoImageUrl(p)
    const price = getPriceNumber(p.valor)
    if (price > 0) g.minPrice = Math.min(g.minPrice, price)
  }
  return [...groups.values()].sort((a, b) => b.promos.length - a.promos.length || a.name.localeCompare(b.name, "pt-BR"))
}

export function promoRegime(p: Promo): string | null {
  if (p.allInclusive) return "All inclusive"
  if (p.pensaoCompleta) return "Pensão completa"
  if (p.meiaPensao) return "Meia pensão"
  if (p.comCafe) return "Café da manhã"
  if (p.semCafe) return "Sem refeições"
  return null
}

export function promoDepartures(p: Promo): string[] {
  if (p.siteDepartures?.length) return p.siteDepartures
  const cities: string[] = []
  if (p.cg) cities.push("Campo Grande")
  if (p.sp) cities.push("São Paulo")
  return cities
}

/** Encontra o grupo do destino pelo slug; aceita também nomes do catálogo sem ofertas ativas */
export async function getDestinationBySlug(slug: string): Promise<DestinationGroup | null> {
  const groups = await getDestinations()
  return groups.find((g) => g.slug === slug) || null
}
