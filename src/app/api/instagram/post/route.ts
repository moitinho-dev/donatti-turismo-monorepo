import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { publishToInstagram } from "@/lib/instagram"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    const body = await request.json()
    const { imageUrl, caption, mediaType, promoId } = body as {
      imageUrl?: string
      caption?: string
      mediaType?: "FEED" | "STORIES"
      promoId?: string
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl obrigatorio" }, { status: 400 })
    }
    if (!caption) {
      return NextResponse.json({ error: "caption obrigatorio" }, { status: 400 })
    }
    if (!mediaType || !["FEED", "STORIES"].includes(mediaType)) {
      return NextResponse.json({ error: "mediaType deve ser FEED ou STORIES" }, { status: 400 })
    }

    const result = await publishToInstagram(imageUrl, caption, mediaType, promoId)

    return NextResponse.json({ ok: true, id: result.id })
  } catch (error) {
    console.error("Instagram post error:", error)
    const message = error instanceof Error ? error.message : "Erro ao postar no Instagram"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
