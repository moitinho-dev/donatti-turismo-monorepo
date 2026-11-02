import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getMetaConnection, isMetaConfigured, listPages } from "@/lib/meta"
import { metaSession } from "../session"

export const dynamic = "force-dynamic"

/** Situação da conexão; com ?pages=1 (admin) lista as Páginas para trocar */
export async function GET(req: Request) {
  const user = await metaSession()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const conn = await getMetaConnection().catch(() => null)
  const base = {
    configured: isMetaConfigured(),
    connected: !!conn?.pageId,
    canManage: user.admin,
    pageName: conn?.pageName ?? null,
    igUsername: conn?.igUsername ?? null,
    hasInstagram: !!conn?.igUserId,
    expiresAt: conn?.tokenExpiresAt ?? null,
  }
  if (!conn || !user.admin || !new URL(req.url).searchParams.get("pages")) return NextResponse.json(base)
  try {
    const pages = await listPages(conn.accessToken)
    return NextResponse.json({
      ...base,
      pages: pages.map((p) => ({ id: p.id, name: p.name, instagram: p.instagram_business_account?.username ?? null, selected: p.id === conn.pageId })),
    })
  } catch (error) {
    return NextResponse.json({ ...base, pagesError: error instanceof Error ? error.message : "Erro ao listar Páginas" })
  }
}

/** Desconecta (admin) */
export async function DELETE() {
  const user = await metaSession()
  if (!user?.admin) return NextResponse.json({ error: "Só administradores" }, { status: 403 })
  await prisma.metaConnection.deleteMany({})
  return NextResponse.json({ ok: true })
}
