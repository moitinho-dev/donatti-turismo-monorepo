import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/agent/",
        "/promos/",
        "/login/",
        "/api/",
      ],
    },
    sitemap: "https://donattiturismo.com.br/sitemap.xml",
  }
}