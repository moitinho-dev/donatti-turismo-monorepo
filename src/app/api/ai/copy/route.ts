import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { describeAiError } from "@/lib/ai/config"
import { AiRefusalError, writePromoCopy } from "@/lib/ai/claude"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // limite do plano Hobby da Vercel

const PROMO_FIELDS = [
  "DESTINO", "HOTEL", "DATA_FORMATADA", "VALOR", "VALOR_ORIGINAL", "PARCELAS", "NUMERO_DE_NOITES",
  "ALL_INCLUSIVE", "PENSAO_COMPLETA", "MEIA_PENSAO", "COM_CAFE", "AEREO", "SP", "CG", "SITE_INCLUSIONS", "CAMPAIGN",
]

/** Gera títulos, legenda, hashtags e descrição do site para uma promo */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = (await req.json()) as { promo?: Record<string, unknown>; tone?: string }
    if (!body.promo?.DESTINO) return NextResponse.json({ error: "Promo sem destino" }, { status: 400 })
    const promo = Object.fromEntries(PROMO_FIELDS.filter((k) => body.promo![k] != null).map((k) => [k, body.promo![k]]))
    const copy = await writePromoCopy(promo, body.tone?.slice(0, 500))
    return NextResponse.json(copy)
  } catch (error) {
    if (error instanceof AiRefusalError) return NextResponse.json({ error: error.message }, { status: 422 })
    console.error("AI copy error:", error)
    const { message, status } = describeAiError(error, "Não foi possível gerar o texto agora")
    return NextResponse.json({ error: message }, { status })
  }
}
