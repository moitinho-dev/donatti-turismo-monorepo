import type { MetadataRoute } from "next"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const computeSlug = (promo: { siteSlug: string | null; destino: string; id: string }) =>
  promo.siteSlug || `${slugify(promo.destino || "destino")}-${promo.id.slice(0, 6)}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://donattiturismo.com.br"

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/destinos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pacotes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  try {
    const promos = await prisma.promo.findMany({
      where: { sitePublished: true },
      select: { id: true, destino: true, siteSlug: true, siteSection: true, updatedAt: true },
    })

    const destinoSlugs = new Set<string>()
    const pacoteUrls: MetadataRoute.Sitemap = []

    for (const promo of promos) {
      const slug = computeSlug(promo)
      const section = promo.siteSection || "destino"

      // Add unique destino pages
      if (!destinoSlugs.has(slug)) {
        destinoSlugs.add(slug)
        pacoteUrls.push({
          url: `${baseUrl}/destinos/${slug}`,
          lastModified: promo.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      }

      // Add individual pacote pages
      pacoteUrls.push({
        url: `${baseUrl}/pacotes/${slug}`,
        lastModified: promo.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    return [...staticRoutes, ...pacoteUrls]
  } catch {
    // Fallback: return static routes only if DB fails
    return staticRoutes
  }
}