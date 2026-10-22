import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/lib/db"
import { MAX_IMAGE_BYTES, parseDataUrl, sniffImageType, uploadImage } from "@/lib/storage"

export const dynamic = "force-dynamic"

/** Biblioteca de imagens da equipe (uploads e geradas por IA), mais recentes primeiro */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const source = new URL(req.url).searchParams.get("source")
  const assets = await prisma.asset.findMany({
    where: source ? { source } : {},
    orderBy: { createdAt: "desc" },
    take: 120,
  })
  return NextResponse.json(assets)
}

/** Upload: multipart com campo "file", ou JSON { dataUrl, source?, prompt?, destino? } */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    let buffer: Buffer
    let source = "upload"
    let prompt: string | undefined
    let destino: string | undefined

    if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file")
      if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
      if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Imagem maior que 10MB" }, { status: 400 })
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      const body = (await req.json()) as { dataUrl?: string; source?: string; prompt?: string; destino?: string }
      if (!body.dataUrl) return NextResponse.json({ error: "Imagem ausente" }, { status: 400 })
      buffer = parseDataUrl(body.dataUrl).buffer
      source = body.source === "ai" ? "ai" : "upload"
      prompt = body.prompt?.slice(0, 2000)
      destino = body.destino?.slice(0, 200)
    }

    const contentType = sniffImageType(buffer)
    if (!contentType) return NextResponse.json({ error: "Use PNG, JPG ou WEBP" }, { status: 400 })

    const url = await uploadImage(buffer, contentType, source === "ai" ? "ai" : "assets")
    const asset = await prisma.asset.create({
      data: { url, source, prompt, destino, createdById: session.user.id },
    })
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Asset upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro no upload" }, { status: 500 })
  }
}
