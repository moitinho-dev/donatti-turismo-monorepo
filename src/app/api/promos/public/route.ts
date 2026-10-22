import { NextRequest, NextResponse } from "next/server"
import { getPublicPromos } from "@/lib/publicPromos"

export const dynamic = "force-dynamic"

// Promos publicadas e ainda válidas, no formato do RealTimePromos
export async function GET(req: NextRequest) {
  try {
    const limitParam = new URL(req.url).searchParams.get("limit")
    const limit = Math.min(Math.max(Number.parseInt(limitParam || "12", 10) || 12, 1), 200)
    return NextResponse.json(await getPublicPromos(limit))
  } catch (error) {
    console.error("Error fetching public promos:", error)
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 })
  }
}
