import type { MetadataRoute } from "next"
import { getActivePromos, getDestinations } from "@/lib/publicPromos"
import { SITE_URL, absoluteUrl, promoImageUrl } from "@/lib/site"
import { computeSlug } from "@/lib/utils"
import { getBlackFridayPhase, isBlackFridayActive } from "@/config/blackFriday"
import { getBlackFridaySettings } from "@/lib/blackFridaySettings"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pacotes`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/destinos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/saindo-de-campo-grande`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/saindo-de-sao-paulo`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ]
  // Página da Black só entra no sitemap enquanto está no ar
  if (isBlackFridayActive(getBlackFridayPhase(await getBlackFridaySettings()))) {
    staticRoutes.push({ url: `${SITE_URL}/black-friday`, lastModified: now, changeFrequency: "daily", priority: 0.9 })
  }

  try {
    // Só ofertas ativas: as encerradas ficam com noindex e saem do sitemap
    const active = await getActivePromos()
    const destinations = await getDestinations(active)
    const latest = (dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())))

    return [
      ...staticRoutes,
      ...destinations.map((d) => ({
        url: `${SITE_URL}/destinos/${d.slug}`,
        lastModified: latest(d.promos.map((p) => p.updatedAt)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: [absoluteUrl(d.image)],
      })),
      ...active.map((p) => ({
        url: `${SITE_URL}/pacotes/${computeSlug(p)}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: [absoluteUrl(promoImageUrl(p))],
      })),
    ]
  } catch {
    return staticRoutes
  }
}
