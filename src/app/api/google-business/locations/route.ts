import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { listLocations } from "@/lib/googleBusiness"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const url = new URL(req.url)
  const accountName = url.searchParams.get("accountName")
  if (!accountName) return NextResponse.json({ error: "accountName é obrigatório" }, { status: 400 })

  const locations = await listLocations(accountName)
  return NextResponse.json(locations)
}
