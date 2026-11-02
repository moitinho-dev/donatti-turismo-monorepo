import { NextResponse } from "next/server"
import { selectPage } from "@/lib/meta"
import { metaSession } from "../session"

export const dynamic = "force-dynamic"

/** Troca a Página (e o Instagram ligado a ela) usada para publicar */
export async function PUT(req: Request) {
  const user = await metaSession()
  if (!user?.admin) return NextResponse.json({ error: "Só administradores" }, { status: 403 })
  const { pageId } = (await req.json().catch(() => ({}))) as { pageId?: string }
  if (!pageId) return NextResponse.json({ error: "pageId obrigatório" }, { status: 400 })
  try {
    const conn = await selectPage(pageId)
    return NextResponse.json({ pageName: conn.pageName, igUsername: conn.igUsername })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 400 })
  }
}
