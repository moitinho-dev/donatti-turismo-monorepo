import { isPromoExpired } from "@/lib/utils"
import type { PromoData } from "./types"

/** Seleção de várias promos na lista: ids na ordem em que foram marcadas (é a ordem das ações em lote) */

/** Promo vencida não entra em ação em lote */
export function selectable(p: PromoData, now: Date = new Date()): { ok: boolean; reason: string | null } {
  return isPromoExpired(p.DATA_FORMATADA, now) ? { ok: false, reason: "Promoção vencida" } : { ok: true, reason: null }
}

/** Marca no fim da fila ou desmarca */
export function toggleSelection(sel: string[], id: string): string[] {
  return sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
}

/** Marca as selecionáveis que estão na tela, depois das que já estavam marcadas */
export function selectAllVisible(sel: string[], visible: PromoData[], now: Date = new Date()): string[] {
  const added = visible.filter((p) => !sel.includes(p.id) && selectable(p, now).ok).map((p) => p.id)
  return added.length ? [...sel, ...added] : sel
}

/** Desmarca as que estão na tela; as marcadas fora do filtro continuam */
export function unselectVisible(sel: string[], visible: PromoData[]): string[] {
  const ids = new Set(visible.map((p) => p.id))
  return sel.filter((id) => !ids.has(id))
}

/** Só as que ainda existem na lista (uma pode ter sido excluída), na ordem da seleção */
export function keepExisting(sel: string[], promos: PromoData[]): string[] {
  const ids = new Set(promos.map((p) => p.id))
  return sel.filter((id) => ids.has(id))
}
