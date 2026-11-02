import { NextResponse } from "next/server"
import { isMetaConfigured, metaAuthUrl, signState } from "@/lib/meta"
import { metaSession } from "../session"

export const dynamic = "force-dynamic"

/** Abre o Login do Facebook para Empresas (só administradores conectam a conta da Donatti) */
export async function GET(req: Request) {
  const user = await metaSession()
  if (!user?.admin) return NextResponse.redirect(new URL("/promos?meta=forbidden", req.url))
  if (!isMetaConfigured()) return NextResponse.redirect(new URL("/promos?meta=not-configured", req.url))
  return NextResponse.redirect(metaAuthUrl(signState(user.email)))
}
