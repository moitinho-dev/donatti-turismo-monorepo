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

  try {
    return NextResponse.json(await listAccounts())
  } catch (error) {
    console.error("Google: erro ao listar contas", error)
    // Cota zero = o Google ainda não aprovou o projeto para as APIs do Perfil da Empresa
    if (error instanceof Error && /\b429\b/.test(error.message) && /quota/i.test(error.message)) {
      return NextResponse.json(
        { error: "O Google ainda não liberou o acesso da Donatti a esta função (cota zero). Assim que liberar, funciona sozinho." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Não foi possível carregar as contas do Google. Tente reconectar." }, { status: 502 })
  }
}
