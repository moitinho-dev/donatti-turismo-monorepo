import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { META_NONCE_COOKIE, exchangeCode, listPages, saveMetaConnection, verifyState } from "@/lib/meta"
import { metaSession } from "../session"

export const dynamic = "force-dynamic"

const back = (req: Request, status: string, msg?: string) => {
  const url = new URL("/promos", req.url)
  url.searchParams.set("meta", status)
  if (msg) url.searchParams.set("msg", msg.slice(0, 200))
  const res = NextResponse.redirect(url)
  // O state vale uma vez só
  res.cookies.set(META_NONCE_COOKIE, "", { path: "/api/meta", maxAge: 0 })
  return res
}

/** Retorno do Login do Facebook: troca o código pelo token e escolhe a Página (a que tem Instagram, se houver) */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  if (params.get("error")) return back(req, "error", params.get("error_description") || "Conexão cancelada")
  const email = verifyState(params.get("state"), (await cookies()).get(META_NONCE_COOKIE)?.value)
  if (!email) return back(req, "error", "Link de conexão expirado. Tente de novo.")
  // Quem volta do Facebook precisa ser o mesmo admin logado que começou a conexão
  const user = await metaSession()
  if (!user?.admin || user.email !== email) return back(req, "forbidden")
  const code = params.get("code")
  if (!code) return back(req, "error", "A Meta não devolveu o código de acesso")
  try {
    const token = await exchangeCode(code)
    const pages = await listPages(token.access_token)
    const page = pages.find((p) => p.instagram_business_account) || pages[0] || null
    await saveMetaConnection(token.access_token, token.expires_in, email, page)
    return back(req, page ? "connected" : "no-page")
  } catch (error) {
    console.error("Meta: erro no retorno do login", error)
    return back(req, "error", error instanceof Error ? error.message : "Erro ao conectar")
  }
}
