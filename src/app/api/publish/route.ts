import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/db"
import { getMetaConnection, publishMeta } from "@/lib/meta"
import { getBusinessConnection, publishPromoPost } from "@/lib/googleBusiness"
import { CHANNELS, isMetaChannel, publishKind, type Channel } from "@/lib/channels"
import { canPublish, channelStatus, offerHash, recordPublish, type PublishState } from "@/lib/publishLog"
import { computeSlug } from "@/lib/utils"
import { resolveSiteFields } from "@/lib/siteFields"
import { isOwnMediaUrl } from "@/lib/mediaHosts"
import { CAMPAIGN_PATH } from "@/config/blackFriday"
import { metaSession } from "../meta/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // limite do plano Hobby da Vercel

const channelIds = CHANNELS.map((c) => c.id) as [Channel, ...Channel[]]

const schema = z.object({
  promoId: z.string().min(1),
  channel: z.enum(channelIds),
  /** URLs públicas já enviadas por /api/meta/media; vazio para "site" */
  images: z.array(z.string().url("Arte inválida").startsWith("https://", "Arte inválida")).max(10).default([]),
  caption: z.string().max(2200).optional(),
  /** Só feed do Facebook: agenda entre 10 minutos e 30 dias */
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  /** Uma publicação com as artes de várias promos (carrossel no Instagram, álbum no Facebook) */
  group: z
    .object({ kind: z.enum(["carousel", "album"]), promoIds: z.array(z.string().min(1)).min(2).max(10) })
    .optional(),
})

type PromoRow = {
  id: string
  destino: string
  hotel: string
  dataFormatada: string
  valor: string
  parcelas: number
  numeroDeNoites: string
  sitePublished: boolean
  siteSection: string | null
  siteSlug: string | null
  siteImage: string | null
  createdById: string
}

type Kind = "post" | "story" | "carousel" | "album" | "message" | "site"

const bad = (error: string, status: number) => NextResponse.json({ error }, { status })

const FORBIDDEN = "Sem permissão para publicar esta promoção"

const channelLabel = (c: Channel) => CHANNELS.find((x) => x.id === c)?.label ?? c

/** Publica a promo em um canal e grava o registro (um por promo quando é carrossel/álbum) */
export async function POST(req: Request) {
  const user = await metaSession()
  if (!user?.id) return bad("Não autorizado", 401)

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return bad(parsed.error.issues[0]?.message || "Dados inválidos", 400)
  const body = parsed.data
  const { channel, group } = body

  if (channel === "wa-channel" || channel === "wa-status") return bad("O WhatsApp é compartilhado pelo celular", 400)

  if (group) {
    if (channel !== "ig-feed" && channel !== "fb-feed") return bad("Carrossel e álbum só no feed do Instagram ou do Facebook", 400)
    if (group.kind !== (channel === "ig-feed" ? "carousel" : "album")) return bad("Carrossel é do Instagram e álbum é do Facebook", 400)
    if (!group.promoIds.includes(body.promoId)) return bad("A promoção não faz parte do grupo", 400)
    if (new Set(group.promoIds).size !== group.promoIds.length) return bad("Promoção repetida no grupo", 400)
    if (body.images.length !== group.promoIds.length) return bad("Envie uma arte por promoção do grupo", 400)
  }

  // Imagens
  if (isMetaChannel(channel)) {
    if (!body.images.length) return bad("Envie a arte antes de publicar", 400)
    if ((channel === "ig-story" || channel === "fb-story") && body.images.length > 1) return bad("Envie um story por vez", 400)
    if (!group && body.images.length > 1) return bad("Mais de uma arte só em carrossel ou álbum", 400)
  }
  if (channel === "google") {
    if (body.images.length !== 1) return bad("Envie uma arte para o Google", 400)
    if (!isOwnMediaUrl(body.images[0])) return bad("Arte do Google inválida", 400)
  }

  let scheduledAt: Date | null = null
  if (body.scheduledAt) {
    if (channel !== "fb-feed") return bad("Agendamento direto só no feed do Facebook", 400)
    scheduledAt = new Date(body.scheduledAt)
    const ahead = scheduledAt.getTime() - Date.now()
    if (ahead < 10 * 60_000 || ahead > 30 * 86_400_000) return bad("Agende entre 10 minutos e 30 dias a partir de agora", 400)
  }

  const ids = group ? group.promoIds : [body.promoId]
  const rows = (await prisma.promo.findMany({ where: { id: { in: ids } } })) as PromoRow[]
  const promos = ids.map((id) => rows.find((r) => r.id === id))
  if (promos.some((p) => !p)) return bad("Promoção não encontrada", 404)
  const targets = promos as PromoRow[]
  const main = targets.find((p) => p.id === body.promoId)!
  if (!targets.every((p) => canPublish(user, p))) return bad(FORBIDDEN, 403)

  const simulate = process.env.PUBLISH_SIMULATE === "on"

  if (channel === "google" && !main.sitePublished) {
    // Na simulação o site não muda de verdade: vale o site simulado
    const simulatedSite = simulate
      ? await prisma.publishLog.findFirst({ where: { promoId: main.id, channel: "site", status: "simulated" } })
      : null
    if (!simulatedSite) return bad("Publique no site antes", 409)
  }

  const kind: Kind =
    channel === "site" ? "site" : channel === "google" ? "post" : publishKind(channel, body.images.length)

  /** Grava um registro por promo; falha do banco não desfaz o que já foi publicado */
  const record = async (status: PublishState, extra: { externalId?: string | null; error?: string; kind?: Kind } = {}) => {
    try {
      for (const p of targets) {
        await recordPublish({
          promoId: p.id,
          channel,
          kind: extra.kind ?? kind,
          externalId: extra.externalId ?? null,
          status,
          error: extra.error ?? null,
          scheduledFor: status === "scheduled" ? scheduledAt : null,
          offerHash: offerHash(p),
          createdById: user.id,
        })
      }
    } catch (err) {
      console.error("Publicar: erro ao gravar o registro", channel, err)
    }
  }

  if (simulate) {
    await record("simulated")
    return NextResponse.json({ ok: true, status: "simulated", externalId: null })
  }

  try {
    if (channel === "site") {
      // Igual à lista (/api/promos): completa seção, foto do destino e slug único antes de ir ao ar
      const site = await resolveSiteFields({
        id: main.id,
        DESTINO: main.destino,
        SITE_PUBLISHED: true,
        SITE_SECTION: main.siteSection,
        SITE_SLUG: main.siteSlug,
        SITE_IMAGE: main.siteImage,
      })
      await prisma.promo.update({ where: { id: main.id }, data: site })
      revalidatePath("/")
      revalidatePath("/pacotes/" + computeSlug({ ...main, siteSlug: site.siteSlug }))
      revalidatePath(CAMPAIGN_PATH)
      await record("published")
      return NextResponse.json({
        ok: true,
        status: "published",
        externalId: null,
        // Campos do site como ficaram (o Studio atualiza a promo aberta com eles)
        promo: { SITE_PUBLISHED: site.sitePublished, SITE_SECTION: site.siteSection, SITE_SLUG: site.siteSlug, SITE_IMAGE: site.siteImage },
      })
    }

    if (channel === "google") {
      const conn = await getBusinessConnection()
      if (!conn?.refreshToken || !conn.accountName || !conn.locationName) {
        const error = "Conecte o Google no painel antes de publicar"
        await record("error", { error })
        return bad(error, 409)
      }
      const { name } = await publishPromoPost(main.id, { imageUrl: body.images[0], replace: true })
      await record("published", { externalId: name })
      return NextResponse.json({ ok: true, status: "published", externalId: name })
    }

    const conn = await getMetaConnection()
    const notConnected =
      !conn?.pageId || !conn.pageAccessToken
        ? "Conecte a Meta no painel antes de publicar"
        : (channel === "ig-feed" || channel === "ig-story") && !conn.igUserId
          ? "A Página conectada não tem Instagram profissional ligado"
          : null
    if (!conn || notConnected) {
      const error = notConnected || "Conecte a Meta no painel antes de publicar"
      await record("error", { error })
      return bad(error, 409)
    }

    const result = await publishMeta(channel, conn, body.images, body.caption, scheduledAt)
    const status: PublishState = scheduledAt ? "scheduled" : "published"
    await record(status, { externalId: result.externalId, kind: result.kind })
    if (channel === "ig-feed" && !group && result.externalId) {
      // Compatibilidade: o painel antigo lê o post do Instagram na promo
      try {
        await prisma.promo.updateMany({
          where: { id: main.id, ...(user.admin ? {} : { createdById: user.id }) },
          data: { instagramPostId: result.externalId },
        })
      } catch (err) {
        console.error("Publicar: erro ao guardar o post do Instagram na promo", err)
      }
    }
    return NextResponse.json({ ok: true, status, externalId: result.externalId })
  } catch (err) {
    console.error("Publicar: erro", channel, err)
    // O registro guarda o erro técnico; a equipe vê uma mensagem simples
    const error = err instanceof Error && err.message ? err.message : "Erro ao publicar"
    await record("error", { error })
    return bad(`Não foi possível publicar no ${channelLabel(channel)}. Tente de novo em alguns minutos.`, 502)
  }
}

/** Situação de cada canal da promo: `?promoId=` */
export async function GET(req: Request) {
  const user = await metaSession()
  if (!user?.id) return bad("Não autorizado", 401)

  const promoId = new URL(req.url).searchParams.get("promoId")
  if (!promoId) return bad("Informe a promoção", 400)

  const promo = await prisma.promo.findUnique({ where: { id: promoId } })
  if (!promo) return bad("Promoção não encontrada", 404)
  if (!canPublish(user, promo)) return bad(FORBIDDEN, 403)

  const logs = await prisma.publishLog.findMany({
    where: { promoId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { name: true, email: true } } },
  })
  const states = channelStatus(
    logs.map((l) => ({
      channel: l.channel as Channel,
      status: l.status,
      createdAt: l.createdAt,
      createdByName: l.createdBy?.name || l.createdBy?.email || null,
      error: l.error,
      offerHash: l.offerHash,
      scheduledFor: l.scheduledFor,
    })),
    offerHash(promo),
  )
  return NextResponse.json(states)
}
