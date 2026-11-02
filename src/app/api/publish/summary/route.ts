import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { CHANNELS, type Channel } from "@/lib/channels"
import type { PublishState, PublishSummary } from "@/lib/publishState"
import { isPromoExpired } from "@/lib/utils"
import { metaSession } from "../../meta/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const KNOWN = new Set<string>(CHANNELS.map((c) => c.id))

/**
 * Situação de cada canal nas promos da lista (só as não vencidas que a pessoa vê):
 * `{ [promoId]: { [canal]: estado } }`. Canal sem registro não aparece (= "none").
 */
export async function GET() {
  const user = await metaSession()
  if (!user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  // Mesma regra do Publicar: admin vê todas; agente só as que criou
  const promos = await prisma.promo.findMany({
    where: user.admin ? {} : { createdById: user.id },
    select: { id: true, dataFormatada: true },
  })
  const ids = promos.filter((p) => !isPromoExpired(p.dataFormatada)).map((p) => p.id)

  const out: PublishSummary = {}
  for (const id of ids) out[id] = {}
  if (!ids.length) return NextResponse.json(out)

  // Uma consulta: o registro mais novo de cada promo + canal
  const logs = await prisma.publishLog.findMany({
    where: { promoId: { in: ids } },
    distinct: ["promoId", "channel"],
    orderBy: { createdAt: "desc" },
    select: { promoId: true, channel: true, status: true, createdAt: true },
  })

  const newest = new Map<string, Date>()
  for (const log of logs) {
    if (!KNOWN.has(log.channel) || !out[log.promoId]) continue
    const key = `${log.promoId}|${log.channel}`
    const prev = newest.get(key)
    if (prev && prev.getTime() >= log.createdAt.getTime()) continue
    newest.set(key, log.createdAt)
    out[log.promoId][log.channel as Channel] = log.status as PublishState
  }
  return NextResponse.json(out)
}
