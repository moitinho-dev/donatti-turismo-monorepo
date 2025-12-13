import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

// Helper function to parse Brazilian date format (DD/MM/YYYY) to Date
function parseBrazilianDate(dateStr: string): Date | null {
  // Handle formats like "15/01/2025" or "15 a 20/01/2025"
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return null

  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

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

    // Calculate date threshold (1 day ago at midnight)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Filter promos: include if dataFormatada is >= yesterday
    const promos = allPromos.filter((promo) => {
      const promoDate = parseBrazilianDate(promo.dataFormatada)
      if (!promoDate) return true // Keep if can't parse date
      return promoDate >= yesterday
    }).slice(0, limit)

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
      SITE_SECTION: promo.siteSection || "nacionais",
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
