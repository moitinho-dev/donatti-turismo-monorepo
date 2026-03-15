import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { buildConnectUrl } from "@/lib/instagram"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    const url = buildConnectUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Instagram connect error:", error)
    const message = error instanceof Error ? error.message : "Erro ao conectar Instagram"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
