import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Fotos das promos guardadas no banco são servidas por /api/promos/<id>/image
      allow: ["/", "/api/promos/*/image"],
      disallow: ["/admin/", "/agent/", "/promos/", "/login", "/api/", "/black-friday/preview"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
