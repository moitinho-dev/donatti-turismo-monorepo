import { NextResponse } from "next/server"
import { exchangeCode, listPages, saveMetaConnection, verifyState } from "@/lib/meta"

export const dynamic = "force-dynamic"

const back = (req: Request, status: string, msg?: string) => {
  const url = new URL("/promos", req.url)
  url.searchParams.set("meta", status)
  if (msg) url.searchParams.set("msg", msg.slice(0, 200))
  return NextResponse.redirect(url)
}

/** Retorno do Login do Facebook: troca o código pelo token e escolhe a Página (a que tem Instagram, se houver) */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  if (params.get("error")) return back(req, "error", params.get("error_description") || "Conexão cancelada")
  const email = verifyState(params.get("state"))
  if (!email) return back(req, "error", "Link de conexão expirado. Tente de novo.")
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
