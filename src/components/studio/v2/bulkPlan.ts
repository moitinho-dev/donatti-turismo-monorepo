import { CHANNELS, type Channel } from "@/lib/channels"
import { needsConfirm, type ChannelState } from "@/lib/publishState"

export type FeedMode = "single" | "carousel"
export type WaMode = "batch" | "one"

export interface BulkJob {
  /** estável: `${channel}:${promoIds.join(",")}` */
  key: string
  channel: Channel
  /** 1 = envio de uma promo; 2..10 = carrossel/álbum */
  promoIds: string[]
  kind: "post" | "story" | "carousel" | "album" | "site" | "share"
}

/** Carrossel do Instagram e álbum do Facebook: até 10 imagens */
export const MAX_GROUP = 10

const isWa = (c: Channel) => c === "wa-channel" || c === "wa-status"

const job = (channel: Channel, promoIds: string[], kind: BulkJob["kind"]): BulkJob => ({
  key: `${channel}:${promoIds.join(",")}`,
  channel,
  promoIds,
  kind,
})

function jobsOfChannel(promoIds: string[], channel: Channel, feed: FeedMode, wa: WaMode): BulkJob[] {
  if (promoIds.length === 0) return []
  switch (channel) {
    case "site":
      return promoIds.map((id) => job(channel, [id], "site"))
    case "google":
      return promoIds.map((id) => job(channel, [id], "post"))
    case "ig-story":
    case "fb-story":
      return promoIds.map((id) => job(channel, [id], "story"))
    case "wa-channel":
      return [job(channel, wa === "one" ? [promoIds[0]] : promoIds, "share")]
    case "wa-status":
      return [job(channel, promoIds, "share")]
    case "ig-feed":
    case "fb-feed": {
      if (feed === "single") return promoIds.map((id) => job(channel, [id], "post"))
      const out: BulkJob[] = []
      for (let i = 0; i < promoIds.length; i += MAX_GROUP) {
        const group = promoIds.slice(i, i + MAX_GROUP)
        out.push(job(channel, group, group.length < 2 ? "post" : channel === "ig-feed" ? "carousel" : "album"))
      }
      return out
    }
  }
}

/** Envios da rodada: todos os site, depois os google, depois os demais canais na ordem de CHANNELS */
export function jobsFor(promoIds: string[], channels: Channel[], feed: FeedMode, wa: WaMode): BulkJob[] {
  return CHANNELS.filter((c) => channels.includes(c.id)).flatMap((c) => jobsOfChannel(promoIds, c.id, feed, wa))
}

/** Canais com API em que há promos já publicadas (e atuais) que seriam publicadas de novo */
export function republishPrompts(
  jobs: BulkJob[],
  status: Record<string, Record<Channel, ChannelState>>,
): { channel: Channel; count: number }[] {
  return CHANNELS.filter((c) => !isWa(c.id))
    .map(({ id }) => {
      const promos = new Set(jobs.filter((j) => j.channel === id).flatMap((j) => j.promoIds))
      let count = 0
      for (const promoId of promos) {
        const s = status[promoId]?.[id]
        if (s && needsConfirm(s) && !s.stale) count++
      }
      return { channel: id, count }
    })
    .filter((e) => e.count > 0)
}

/** Google de uma promo cujo site falhou nesta rodada não deve ser publicado */
export function googleBlockedBySite(j: BulkJob, siteFailed: Set<string>): boolean {
  return j.channel === "google" && siteFailed.has(j.promoIds[0])
}
