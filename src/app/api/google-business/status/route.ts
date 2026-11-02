import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { getBusinessConnection, isGoogleConfigured } from "@/lib/googleBusiness"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Se o Google está conectado e com local escolhido (qualquer pessoa logada; trocar a conta continua só admin) */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const conn = await getBusinessConnection()
  const connected = Boolean(conn?.refreshToken)
  const ready = connected && Boolean(conn?.accountName && conn?.locationName)
  return NextResponse.json({
    configured: isGoogleConfigured(),
    connected,
    ready,
    canManage: session.user.role === "admin",
    locationTitle: ready ? conn?.locationTitle || null : null,
    // Simulação: o Publicar não chama o Google, então dá para "postar" sem conexão
    simulate: process.env.PUBLISH_SIMULATE === "on",
  })
}
