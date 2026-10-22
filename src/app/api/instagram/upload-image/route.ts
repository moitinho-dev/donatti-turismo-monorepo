import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { uploadImage } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, filename } = body as {
      imageBase64?: string
      filename?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 obrigatorio" }, { status: 400 })
    }

    const buffer = Buffer.from(imageBase64, "base64")
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "Imagem muito grande (max 8MB)" }, { status: 400 })
    }

    const publicUrl = await uploadImage(buffer, "image/jpeg", "instagram")

    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error("Instagram upload error:", error)
    const message = error instanceof Error ? error.message : "Erro ao fazer upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
