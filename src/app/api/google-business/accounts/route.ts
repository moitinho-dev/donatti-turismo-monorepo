import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { listAccounts } from "@/lib/googleBusiness"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const accounts = await listAccounts()
  return NextResponse.json(accounts)
}
