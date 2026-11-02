import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  MetaError,
  getMetaConnection,
  publicImageUrl,
  publishFacebookPost,
  publishFacebookStory,
  publishInstagramPost,
  publishInstagramStory,
} from "@/lib/meta"
import { metaSession } from "../session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // limite do plano Hobby da Vercel

const schema = z.object({
  network: z.enum(["facebook", "instagram"]),
  /** post = 1 imagem, ou álbum/carrossel com 2 a 10; story = uma imagem por chamada */
  kind: z.enum(["post", "story"]),
  images: z.array(z.string().min(10)).min(1).max(10),
  caption: z.string().max(2200).optional(),
  /** Só Facebook: agenda entre 10 minutos e 30 dias */
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  /** Promo de origem quando é uma arte só (guarda o id do post) */
  promoId: z.string().optional(),
})

/** Publica no Facebook ou no Instagram pela conexão da Donatti (qualquer pessoa logada da equipe) */
export async function POST(req: Request) {
  const user = await metaSession()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 })
  const body = parsed.data

  const conn = await getMetaConnection()
  if (!conn?.pageId || !conn.pageAccessToken) return NextResponse.json({ error: "Conecte a Meta no painel antes de publicar" }, { status: 409 })
  if (body.network === "instagram" && !conn.igUserId) {
    return NextResponse.json({ error: "A Página conectada não tem Instagram profissional ligado" }, { status: 409 })
  }
  if (body.kind === "story" && body.images.length > 1) return NextResponse.json({ error: "Envie um story por vez" }, { status: 400 })

  let scheduledAt: Date | null = null
  if (body.scheduledAt) {
    if (body.network !== "facebook") return NextResponse.json({ error: "Agendamento direto só no Facebook por enquanto" }, { status: 400 })
    scheduledAt = new Date(body.scheduledAt)
    const ahead = scheduledAt.getTime() - Date.now()
    if (ahead < 10 * 60_000 || ahead > 30 * 86_400_000) {
      return NextResponse.json({ error: "Agende entre 10 minutos e 30 dias a partir de agora" }, { status: 400 })
    }
  }

  try {
    const images = []
    for (const img of body.images) images.push(await publicImageUrl(img))
    const token = conn.pageAccessToken
    const result =
      body.network === "facebook"
        ? body.kind === "story"
          ? await publishFacebookStory(conn.pageId, token, images[0])
          : await publishFacebookPost(conn.pageId, token, { images, caption: body.caption, scheduledAt })
        : body.kind === "story"
          ? await publishInstagramStory(conn.igUserId!, token, images[0])
          : await publishInstagramPost(conn.igUserId!, token, { images, caption: body.caption })

    const id = ("id" in result && result.id) || ("post_id" in result && result.post_id) || null
    if (body.promoId && id && body.network === "instagram" && body.kind === "post") {
      await prisma.promo.update({ where: { id: body.promoId }, data: { instagramPostId: String(id) } }).catch(() => undefined)
    }
    return NextResponse.json({ ok: true, id, scheduled: !!scheduledAt })
  } catch (error) {
    console.error("Meta: erro ao publicar", body.network, body.kind, error)
    const message = error instanceof MetaError || error instanceof Error ? error.message : "Erro ao publicar"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
