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
  // Só "accounts/{id}": o valor vai no caminho da chamada ao Google
  if (!accountName || !/^accounts\/[\w-]+$/.test(accountName)) return NextResponse.json({ error: "Conta inválida" }, { status: 400 })

  try {
    return NextResponse.json(await listLocations(accountName))
  } catch (error) {
    console.error("Google: erro ao listar locais", error)
    return NextResponse.json({ error: "Não foi possível carregar os locais desta conta." }, { status: 502 })
  }
}
