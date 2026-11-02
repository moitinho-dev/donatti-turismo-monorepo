import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { canPublish, offerHash, recordPublish } from "@/lib/publishLog"
import { metaSession } from "../../meta/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  promoId: z.string().min(1),
  channel: z.enum(["wa-channel", "wa-status"]),
})

/** Marca que a arte foi compartilhada no WhatsApp (a equipe posta pelo celular) */
export async function POST(req: Request) {
  const user = await metaSession()
  if (!user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Canal inválido" }, { status: 400 })
  const { promoId, channel } = parsed.data

  const promo = await prisma.promo.findUnique({ where: { id: promoId } })
  if (!promo) return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
  if (!canPublish(user, promo)) return NextResponse.json({ error: "Sem permissão para publicar esta promoção" }, { status: 403 })

  const status = process.env.PUBLISH_SIMULATE === "on" ? "simulated" : "shared"
  try {
    await recordPublish({
      promoId,
      channel,
      kind: channel === "wa-channel" ? "message" : "story",
      status,
      offerHash: offerHash(promo),
      createdById: user.id,
    })
  } catch (err) {
    console.error("Publicar: erro ao marcar o WhatsApp", channel, err)
    return NextResponse.json({ error: "Não foi possível marcar como compartilhado" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status, externalId: null })
}
