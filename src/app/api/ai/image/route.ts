import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "../../auth/[...nextauth]/options"
import prisma from "@/lib/db"
import { describeAiError } from "@/lib/ai/config"
import { loadImage } from "@/lib/ai/fetchImage"
import { editArea, extendToFormat, generateImage, removeBackground } from "@/lib/ai/novaCanvas"
import { sniffImageType, uploadImage } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // limite do plano Hobby da Vercel

const format = z.enum(["story", "feed", "square", "landscape"])

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), prompt: z.string().min(3).max(1000), format, count: z.number().int().min(1).max(4).optional() }),
  z.object({ action: z.literal("extend"), image: z.string().min(1), format, prompt: z.string().max(1000).optional() }),
  z.object({ action: z.literal("remove-background"), image: z.string().min(1) }),
  z.object({ action: z.literal("edit"), image: z.string().min(1), target: z.string().min(2).max(300), prompt: z.string().max(1000).optional() }),
])

/** Gera ou edita imagens com Nova Canvas; o resultado vai para a biblioteca de imagens da equipe */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const raw = (await req.json()) as Record<string, unknown>
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido", details: parsed.error.format() }, { status: 400 })
  const data = parsed.data
  const destino = typeof raw.destino === "string" ? raw.destino.slice(0, 200) : undefined

  try {
    let images: Buffer[]
    let prompt: string
    switch (data.action) {
      case "generate":
        images = await generateImage(data.prompt, data.format, { count: data.count })
        prompt = data.prompt
        break
      case "extend":
        images = await extendToFormat(await loadImage(data.image), data.format, data.prompt)
        prompt = `Estender para ${data.format}${data.prompt ? `: ${data.prompt}` : ""}`
        break
      case "remove-background":
        images = await removeBackground(await loadImage(data.image))
        prompt = "Remover fundo"
        break
      case "edit":
        images = await editArea(await loadImage(data.image), data.target, data.prompt)
        prompt = `Editar "${data.target}"${data.prompt ? `: ${data.prompt}` : " (remover)"}`
        break
    }

    const assets = await Promise.all(
      images.map(async (buffer) => {
        const url = await uploadImage(buffer, sniffImageType(buffer) || "image/png", "ai")
        return prisma.asset.create({
          data: { url, source: "ai", prompt, destino, createdById: session.user.id },
        })
      }),
    )
    return NextResponse.json({ assets })
  } catch (error) {
    console.error("AI image error:", error)
    const { message, status } = describeAiError(error, error instanceof Error ? error.message : "Erro ao gerar imagem")
    return NextResponse.json({ error: message }, { status })
  }
}
