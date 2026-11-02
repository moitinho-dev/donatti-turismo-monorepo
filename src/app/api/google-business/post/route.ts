import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { publishPromoPost } from "@/lib/googleBusiness"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({ promoId: z.string().min(1) })

/** Posta a promo no Google (qualquer pessoa logada da equipe) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  try {
    const created = await publishPromoPost(parsed.data.promoId)
    return NextResponse.json({ ok: true, created })
  } catch (error) {
    console.error("Google Business post error:", error)
    return NextResponse.json({ error: "Não foi possível postar no Google" }, { status: 502 })
  }
}
