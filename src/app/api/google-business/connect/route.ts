import { NextResponse } from "next/server"
import { newNonce, signState } from "@/lib/meta"
import { GOOGLE_NONCE_COOKIE, buildConnectUrl, isGoogleConfigured } from "@/lib/googleBusiness"
import { metaSession as panelSession } from "../../meta/session"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Abre o login do Google (só administradores conectam o Perfil da Empresa da Donatti) */
export async function GET(req: Request) {
  const user = await panelSession()
  if (!user?.admin) return NextResponse.redirect(new URL("/promos?google=forbidden", req.url))
  if (!isGoogleConfigured()) return NextResponse.redirect(new URL("/promos?google=not-configured", req.url))
  // O nonce vai no state assinado e num cookie só deste navegador; o retorno exige os dois iguais
  const nonce = newNonce()
  let state: string
  try {
    state = signState(user.email, nonce)
  } catch (err) {
    console.error("Google: não deu para iniciar o login", err)
    return NextResponse.redirect(new URL("/promos?google=not-configured", req.url))
  }
  const res = NextResponse.redirect(buildConnectUrl(state))
  res.cookies.set(GOOGLE_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/google-business",
    maxAge: 15 * 60,
  })
  return res
}
