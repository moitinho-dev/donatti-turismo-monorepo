import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyState } from "@/lib/meta"
import { GOOGLE_NONCE_COOKIE, autoPickTarget, exchangeCodeForTokens, upsertRefreshToken } from "@/lib/googleBusiness"
import { metaSession as panelSession } from "../../meta/session"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const back = (req: Request, status: string, msg?: string) => {
  const url = new URL("/promos", req.url)
  url.searchParams.set("google", status)
  if (msg) url.searchParams.set("msg", msg.slice(0, 200))
  const res = NextResponse.redirect(url)
  // O state vale uma vez só
  res.cookies.set(GOOGLE_NONCE_COOKIE, "", { path: "/api/google-business", maxAge: 0 })
  return res
}

/** Retorno do login do Google: troca o código pelo acesso e volta para /promos */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const error = params.get("error")
  if (error) return back(req, "error", error === "access_denied" ? "A conexão foi cancelada." : undefined)
  const email = verifyState(params.get("state"), (await cookies()).get(GOOGLE_NONCE_COOKIE)?.value)
  if (!email) return back(req, "error", "O link de conexão expirou. Tente de novo.")
  // Quem volta do Google precisa ser o mesmo admin logado que começou a conexão
  const user = await panelSession()
  if (!user?.admin || user.email !== email) return back(req, "forbidden")
  const code = params.get("code")
  if (!code) return back(req, "error")

  try {
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.refresh_token) return back(req, "incomplete")
    await upsertRefreshToken(tokens.refresh_token)
  } catch (err) {
    console.error("Google: erro no retorno do login", err)
    return back(req, "error")
  }

  // Uma conta e um local só: já escolhe; se não der, o admin escolhe no painel
  await autoPickTarget().catch((err) => console.error("Google: não deu para escolher o local sozinho", err))
  return back(req, "connected")
}
