import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { isPromoExpired, slugify } from "@/lib/utils"
import { suggestSiteSection } from "@/lib/destinations"

export const dynamic = "force-dynamic"

// Public API to get recent promos for the homepage
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get("limit")
    const limit = Math.min(Math.max(Number.parseInt(limitParam || "12", 10) || 12, 1), 200)

    // Get only published promos for the website
    const allPromos = await prisma.promo.findMany({
      where: { sitePublished: true },
      orderBy: { createdAt: "desc" },
    })

    // Esconde promos cuja data de ida já passou
    const now = new Date()
    const promos = allPromos.filter((promo) => !isPromoExpired(promo.dataFormatada, now)).slice(0, limit)

    // Convert to the format expected by RealTimePromos
    const formattedPromos = promos.map((promo) => ({
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
      SITE_SLUG: promo.siteSlug || `${slugify(promo.destino || "pacote")}-${promo.id.slice(0, 6)}`,
      SITE_IMAGE: promo.siteImage,
      SITE_DESCRIPTION: promo.siteDescription,
      SITE_INCLUSIONS: promo.siteInclusions,
      SITE_DEPARTURES: promo.siteDepartures,
    }))

    return NextResponse.json(formattedPromos)
  } catch (error) {
    console.error("Error fetching public promos:", error)
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 })
  }
}
