import { NextResponse } from "next/server"
import { META_NONCE_COOKIE, isMetaConfigured, metaAuthUrl, newNonce, signState } from "@/lib/meta"
import { metaSession } from "../session"

export const dynamic = "force-dynamic"

/** Abre o Login do Facebook para Empresas (só administradores conectam a conta da Donatti) */
export async function GET(req: Request) {
  const user = await metaSession()
  if (!user?.admin) return NextResponse.redirect(new URL("/promos?meta=forbidden", req.url))
  if (!isMetaConfigured()) return NextResponse.redirect(new URL("/promos?meta=not-configured", req.url))
  // O nonce vai no state assinado e num cookie só deste navegador; o retorno exige os dois iguais
  const nonce = newNonce()
  const res = NextResponse.redirect(metaAuthUrl(signState(user.email, nonce)))
  res.cookies.set(META_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/meta",
    maxAge: 15 * 60,
  })
  return res
}
