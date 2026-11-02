import { CHANNELS, type Channel } from "@/lib/channels"
import type { ChannelState, PublishState } from "@/lib/publishState"
import { captionsFor, carouselCaption, whatsappChannelMessage, type CaptionPromo } from "@/lib/promoCaptions"
import { computeSlug, getPriceNumber } from "@/lib/utils"
import type { Captions } from "../artSet"
import { MAX_GROUP, republishPrompts, type BulkJob, type WaMode } from "./bulkPlan"
import { initialSelectionWith, isApiChannel } from "./publishView"

/** Publicar todas: regras e textos sem tela (seleção, andamento por promo × canal) */

/** Andamento de um envio nesta rodada */
export type JobRun =
  | { phase: "busy" }
  | { phase: "done"; status: PublishState }
  | { phase: "error"; error: string }
  /** A pessoa não quis publicar de novo neste canal */
  | { phase: "skipped" }

export type StatusByPromo = Record<string, Record<Channel, ChannelState>>

const DEFAULT_SELECTION: Channel[] = ["site", "google"]

/**
 * Marcados ao abrir: parte da escolha lembrada (ou da regra de sempre) e tira os canais em que todas as promos
 * já estão publicadas e em dia. Site marcado leva o Google.
 */
export function bulkSelection(status: StatusByPromo, promoIds: string[], remembered: Channel[] | null): Set<Channel> {
  const known = promoIds.filter((id) => status[id])
  if (!known.length) return new Set(DEFAULT_SELECTION)
  const out = new Set<Channel>()
  for (const id of known) for (const c of initialSelectionWith(status[id], remembered)) out.add(c)
  if (out.has("site")) out.add("google")
  return out
}

const isDone = (s: ChannelState | undefined) => !!s && !s.stale && (s.state === "published" || s.state === "scheduled" || s.state === "shared")

/** Quantas promos já estão publicadas (agendadas ou compartilhadas) e em dia no canal */
export function doneCount(status: StatusByPromo, promoIds: string[], channel: Channel): number {
  return promoIds.filter((id) => isDone(status[id]?.[channel])).length
}

/**
 * Confirmações de republicar: a situação lida do servidor mais o que já saiu de verdade nesta sessão
 * (publicado, agendado ou compartilhado; simulado não conta). Assim uma situação ainda não relida
 * não deixa publicar de novo sem perguntar.
 */
export function bulkRepublishPrompts(jobs: BulkJob[], status: StatusByPromo, runs: Record<string, JobRun>): { channel: Channel; count: number }[] {
  const merged: StatusByPromo = { ...status }
  for (const [key, run] of Object.entries(runs)) {
    if (run.phase !== "done" || (run.status !== "published" && run.status !== "scheduled" && run.status !== "shared")) continue
    // key = "canal:promo1,promo2" (BulkJob.key)
    const cut = key.indexOf(":")
    const channel = key.slice(0, cut) as Channel
    for (const id of key.slice(cut + 1).split(",")) {
      const cur = merged[id]
      const s = cur?.[channel]
      if (s && !s.stale && (s.state === "published" || s.state === "scheduled" || s.state === "shared")) continue
      merged[id] = { ...(cur || ({} as Record<Channel, ChannelState>)), [channel]: { state: run.status, at: null, by: null, error: null, stale: false } }
    }
  }
  return republishPrompts(jobs, merged)
}

/** Grupos do carrossel / álbum: até 10 promos, na ordem da seleção */
export function feedGroups(promoIds: string[]): string[][] {
  const out: string[][] = []
  for (let i = 0; i < promoIds.length; i += MAX_GROUP) out.push(promoIds.slice(i, i + MAX_GROUP))
  return out
}

const promocoes = (n: number) => (n === 1 ? "1 promoção" : `${n} promoções`)

/** "Instagram feed: 3 promoções já publicadas. Publicar de novo?" */
export function republishMessage(channelLabel: string, count: number): string {
  return `${channelLabel}: ${promocoes(count)} ${count === 1 ? "já publicada" : "já publicadas"}. Publicar de novo?`
}

/** "12 promoções em 2 carrosséis (10 + 2)" */
export function groupsSummary(groups: string[][], album: boolean): string {
  const total = groups.reduce((n, g) => n + g.length, 0)
  const word = album ? (groups.length === 1 ? "álbum" : "álbuns") : groups.length === 1 ? "carrossel" : "carrosséis"
  const sizes = groups.length > 1 ? ` (${groups.map((g) => g.length).join(" + ")})` : ""
  return `${promocoes(total)} em ${groups.length} ${word}${sizes}`
}

export interface ProgressCell {
  channel: Channel
  /** Envio que cobre esta promo neste canal (null: o canal não manda esta promo, como no "1 imagem + mensagem") */
  job: BulkJob | null
  /** "Carrossel 1/2" / "Álbum 2/2" nos envios em grupo */
  label: string | null
  run: JobRun | undefined
}

export interface ProgressRow {
  promoId: string
  cells: ProgressCell[]
}

/** Tabela de andamento: uma linha por promo, uma coluna por canal marcado (na ordem da lista de canais) */
export function progressRows(promoIds: string[], channels: Iterable<Channel>, jobs: BulkJob[], runs: Record<string, JobRun>): ProgressRow[] {
  const set = new Set(channels)
  const cols = CHANNELS.map((c) => c.id).filter((c) => set.has(c))
  const labels = new Map<string, string>()
  for (const c of cols) {
    const groups = jobs.filter((j) => j.channel === c && (j.kind === "carousel" || j.kind === "album"))
    groups.forEach((j, i) => labels.set(j.key, `${j.kind === "carousel" ? "Carrossel" : "Álbum"} ${i + 1}/${groups.length}`))
  }
  return promoIds.map((promoId) => ({
    promoId,
    cells: cols.map((channel) => {
      const job = jobs.find((j) => j.channel === channel && j.promoIds.includes(promoId)) || null
      return { channel, job, label: job ? labels.get(job.key) || null : null, run: job ? runs[job.key] : undefined }
    }),
  }))
}

/** Envios pelo botão Publicar (o WhatsApp sai pelos botões de compartilhar) */
export const apiJobs = (jobs: BulkJob[]) => jobs.filter((j) => isApiChannel(j.channel))

/** Promos com algum envio que saiu de verdade nesta rodada (publicado, agendado ou compartilhado; simulado não conta) */
export function sentPromoIds(jobs: BulkJob[], runs: Record<string, JobRun>): Set<string> {
  const out = new Set<string>()
  for (const j of jobs) {
    const r = runs[j.key]
    if (r?.phase === "done" && (r.status === "published" || r.status === "scheduled" || r.status === "shared")) for (const id of j.promoIds) out.add(id)
  }
  return out
}

/** Campanha das legendas em conjunto: só quando todas as promos são da campanha */
export function campaignOf(promos: { CAMPAIGN?: unknown }[]): string | null {
  return promos.length > 0 && promos.every((p) => p.CAMPAIGN === "black-friday") ? "Black November" : null
}

/** Maior desconto entre as promos (para o título da mensagem do WhatsApp); undefined se nenhuma tiver */
export function maxDiscount(promos: { VALOR?: unknown; VALOR_ORIGINAL?: unknown }[]): number | undefined {
  let best = 0
  for (const p of promos) {
    const now = getPriceNumber(String(p.VALOR ?? ""))
    const before = getPriceNumber(String(p.VALOR_ORIGINAL ?? ""))
    if (before > now && now > 0) best = Math.max(best, Math.round((1 - now / before) * 100))
  }
  return best || undefined
}

// ---------------------------------------------------------------------------
// Legendas
// ---------------------------------------------------------------------------
type CaptionSource = { id: string; DESTINO: string; SITE_SLUG?: unknown; CAMPAIGN?: unknown; VALOR?: unknown; VALOR_ORIGINAL?: unknown }

/** Promo com o link da oferta como o site vai ter (as legendas levam o link) */
export const captionPromo = (p: CaptionSource) =>
  ({
    ...p,
    SITE_SLUG: computeSlug({ siteSlug: typeof p.SITE_SLUG === "string" && p.SITE_SLUG ? p.SITE_SLUG : null, destino: p.DESTINO, id: p.id }),
  }) as unknown as CaptionPromo

/** As legendas de uma promo: as salvas com a arte, ou geradas com os dados da oferta */
export const promoCaptions = (p: CaptionSource, saved: Captions | null | undefined): Captions =>
  saved ?? captionsFor(captionPromo(p), p.CAMPAIGN === "black-friday" ? "Black November" : null)

/** Legenda de um carrossel / álbum: uma linha por oferta, na ordem das imagens */
export const groupCaptionDefault = (promos: CaptionSource[]) => carouselCaption(promos.map(captionPromo), { campaign: campaignOf(promos) })

/** Mensagem do Canal do WhatsApp: a lista de todas, ou a mensagem da primeira promo */
export function waMessageDefault(mode: WaMode, promos: CaptionSource[], savedOf: (id: string) => Captions | null | undefined): string {
  if (mode === "one") return promos[0] ? promoCaptions(promos[0], savedOf(promos[0].id)).whatsapp : ""
  const campaign = campaignOf(promos)
  return whatsappChannelMessage(promos.map(captionPromo), { campaign, maxDiscount: campaign ? maxDiscount(promos) : undefined })
}
