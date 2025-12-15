import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

function dataUrlToBuffer(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  if (!dataUrl.startsWith("data:")) return null

  const commaIndex = dataUrl.indexOf(",")
  if (commaIndex === -1) return null

  const meta = dataUrl.slice("data:".length, commaIndex)
  const dataPart = dataUrl.slice(commaIndex + 1)

  const isBase64 = meta.endsWith(";base64")
  const contentType = (isBase64 ? meta.slice(0, -";base64".length) : meta) || "application/octet-stream"

  try {
    const buffer = isBase64 ? Buffer.from(dataPart, "base64") : Buffer.from(decodeURIComponent(dataPart), "utf8")
    return { contentType, buffer }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Parâmetro 'id' é obrigatório" }, { status: 400 })
    }

    const layout = await prisma.layout.findUnique({
      where: { id },
      select: { imageUrl: true },
    })

    if (!layout?.imageUrl) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 })
    }

    const decoded = dataUrlToBuffer(layout.imageUrl)
    if (!decoded) {
      // For non-data URLs, just redirect to the stored value.
      if (layout.imageUrl.startsWith("/")) {
        const redirectUrl = new URL(req.url)
        redirectUrl.pathname = layout.imageUrl
        redirectUrl.search = ""
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.redirect(layout.imageUrl)
    }

    return new NextResponse(decoded.buffer, {
      status: 200,
      headers: {
        "Content-Type": decoded.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[LAYOUTS IMAGE] Error:", error)
    return NextResponse.json({ error: "Erro ao carregar imagem" }, { status: 500 })
  }
}

