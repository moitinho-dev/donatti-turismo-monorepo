import { NextResponse } from "next/server"
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

// Public API to get recent promos for the homepage
export async function GET() {
  try {
    // Get all promos first, then filter by date
    const allPromos = await prisma.promo.findMany({
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
    }).slice(0, 12) // Limit to 12

    // Convert to the format expected by RealTimePromos
    const formattedPromos = promos.map((promo) => ({
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
    }))

    return NextResponse.json(formattedPromos)
  } catch (error) {
    console.error("Error fetching public promos:", error)
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 })
  }
}
