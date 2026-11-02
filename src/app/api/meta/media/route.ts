import { NextResponse } from "next/server"
import { publicImageUrl } from "@/lib/meta"
import { metaSession } from "../session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 3.5 * 1024 * 1024 // abaixo do limite de corpo da Vercel (4,5 MB) já com o base64

/** Sobe uma arte (data URL JPEG/PNG) e devolve a URL pública que a Meta vai baixar */
export async function POST(req: Request) {
  const user = await metaSession()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { image } = (await req.json().catch(() => ({}))) as { image?: string }
  if (!image?.startsWith("data:image/")) return NextResponse.json({ error: "Envie a imagem como data URL" }, { status: 400 })
  if (image.length * 0.75 > MAX_BYTES) return NextResponse.json({ error: "Imagem grande demais (máx. 3,5 MB)" }, { status: 413 })
  try {
    return NextResponse.json({ url: await publicImageUrl(image) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao enviar a imagem" }, { status: 500 })
  }
}
