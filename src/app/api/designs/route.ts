import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/lib/db"
import { parseDataUrl, uploadImage } from "@/lib/storage"

export const dynamic = "force-dynamic"

const designSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  kind: z.enum(["template", "design"]),
  format: z.enum(["story", "feed", "square", "landscape"]),
  data: z.record(z.unknown()),
  promoId: z.string().nullable().optional(),
  // Miniatura em data URL (PNG/JPEG pequeno); é enviada ao armazenamento
  thumbnail: z.string().startsWith("data:image/").max(2_000_000).optional(),
})

const listSelect = {
  id: true,
  name: true,
  kind: true,
  format: true,
  thumbnailUrl: true,
  promoId: true,
  updatedAt: true,
  createdById: true,
  createdBy: { select: { name: true } },
} as const

/** Lista templates (de toda a equipe) ou designs (filtrados por promo). Sem `data` para ficar leve. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const url = new URL(req.url)
  const kind = url.searchParams.get("kind") || "template"
  const format = url.searchParams.get("format")
  const promoId = url.searchParams.get("promoId")

  const designs = await prisma.design.findMany({
    where: {
      kind,
      ...(format ? { format } : {}),
      ...(promoId ? { promoId } : {}),
      // Agentes veem os templates da equipe e só os próprios designs
      ...(kind === "design" && session.user.role !== "admin" ? { createdById: session.user.id } : {}),
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return NextResponse.json(designs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const parsed = designSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 })
  }
  const { id, thumbnail, data, ...rest } = parsed.data

  let thumbnailUrl: string | undefined
  if (thumbnail) {
    try {
      const { buffer, contentType } = parseDataUrl(thumbnail)
      thumbnailUrl = await uploadImage(buffer, contentType, "studio/thumbs")
    } catch (err) {
      console.warn("Miniatura não salva:", err)
    }
  }

  if (id) {
    const existing = await prisma.design.findUnique({ where: { id }, select: { createdById: true, kind: true } })
    if (!existing) return NextResponse.json({ error: "Design não encontrado" }, { status: 404 })
    // Templates da equipe: qualquer um edita; designs: só o autor ou admin
    if (existing.kind === "design" && existing.createdById !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    const updated = await prisma.design.update({
      where: { id },
      data: { ...rest, data: data as object, ...(thumbnailUrl ? { thumbnailUrl } : {}) },
      select: listSelect,
    })
    return NextResponse.json(updated)
  }

  const created = await prisma.design.create({
    data: {
      name: rest.name,
      kind: rest.kind,
      format: rest.format,
      promoId: rest.promoId ?? null,
      data: data as object,
      thumbnailUrl,
      createdById: session.user.id,
    },
    select: listSelect,
  })
  return NextResponse.json(created, { status: 201 })
}
