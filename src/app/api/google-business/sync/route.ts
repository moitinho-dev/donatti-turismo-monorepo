import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { syncPublishedPromos } from "@/lib/googleBusiness"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const results = await syncPublishedPromos(20)
  return NextResponse.json({ ok: true, results })
}
