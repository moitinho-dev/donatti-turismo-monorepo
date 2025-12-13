import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { publishPromoPost } from "@/lib/googleBusiness"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({ promoId: z.string().min(1) })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  const created = await publishPromoPost(parsed.data.promoId)
  return NextResponse.json({ ok: true, created })
}
