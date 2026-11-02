/** Studio com várias promos: regras sem tela (grade, miniaturas, publicadas na sessão) */

import type { PublishState, PublishSummary } from "@/lib/publishState"
import type { ArtSet } from "../artSet"
import type { ArtFormat } from "../types"

/** Modelo padrão da promo (o mesmo que o Studio usa ao abrir uma promo sem arte salva) */
export function defaultFamilyOf(p: { CAMPAIGN?: unknown } | Record<string, unknown>): "black-november" | "destaque" {
  return p.CAMPAIGN === "black-friday" ? "black-november" : "destaque"
}

/** Promos com algum formato ajustado à mão depois do template */
export function editedPromos(sets: Record<string, ArtSet>): string[] {
  return Object.entries(sets)
    .filter(([, s]) => s.edited.length > 0)
    .map(([id]) => id)
}

/** Alguma promo aberta ainda não foi publicada nesta sessão */
export function hasUnpublished(promoIds: string[], publishedThisSession: Set<string>): boolean {
  return promoIds.some((id) => !publishedThisSession.has(id))
}

const DONE: PublishState[] = ["published", "scheduled", "shared"]
const isDone = (s: PublishState | undefined) => !!s && DONE.includes(s)

/** Promos com algum canal publicado, agendado ou compartilhado */
export function publishedPromoIds(summary: PublishSummary | null): Set<string> {
  const out = new Set<string>()
  for (const [id, channels] of Object.entries(summary || {})) {
    if (Object.values(channels).some(isDone)) out.add(id)
  }
  return out
}

/**
 * Promos com algum canal que passou a publicado / agendado / compartilhado entre a primeira leitura
 * (quando a grade abriu) e agora. Sem primeira leitura não dá para saber o que é novo: nada conta.
 */
export function newlyPublished(before: PublishSummary | null, now: PublishSummary): Set<string> {
  const out = new Set<string>()
  if (!before) return out
  for (const [id, channels] of Object.entries(now)) {
    const prev = before[id] || {}
    for (const [channel, state] of Object.entries(channels) as [keyof typeof channels, PublishState][]) {
      if (isDone(state) && prev[channel] !== state) {
        out.add(id)
        break
      }
    }
  }
  return out
}

/** Miniaturas da grade: uma por promo e formato, válida enquanto o conjunto de artes for o mesmo objeto */
export type ThumbCache = Map<string, { set: ArtSet; url: string | null }>

export const thumbKey = (promoId: string, format: ArtFormat) => `${promoId}:${format}`

/** Próxima promo a desenhar (na ordem da grade): já carregada e sem miniatura atual deste formato */
export function nextThumbJob(ids: string[], format: ArtFormat, sets: Record<string, ArtSet | undefined>, cache: ThumbCache): string | null {
  for (const id of ids) {
    const s = sets[id]
    if (!s) continue
    if (cache.get(thumbKey(id, format))?.set !== s) return id
  }
  return null
}
