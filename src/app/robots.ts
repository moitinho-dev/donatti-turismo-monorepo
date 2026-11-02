import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Fotos das promos guardadas no banco (/api/promos/<id>/image) e artes enviadas à Meta (/api/media/<id>)
      allow: ["/", "/api/promos/*/image", "/api/media/"],
      disallow: ["/admin/", "/agent/", "/promos/", "/login", "/api/", "/black-november/preview"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
