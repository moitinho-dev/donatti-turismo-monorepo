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

// ---------------------------------------------------------------------------
// Textos das ações em lote
// ---------------------------------------------------------------------------
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const noDot = (s: string) => s.trim().replace(/\.+$/, "")

/** Marcadas que não aparecem no filtro atual (visible null: a lista ainda não disse o que mostra) */
export function hiddenCount(sel: string[], visible: string[] | null): number {
  if (!visible) return 0
  const shown = new Set(visible)
  return sel.filter((id) => !shown.has(id)).length
}

export const unpublishConfirm = (n: number) => `Tirar ${plural(n, "promoção", "promoções")} do site?`

export function deleteConfirm(n: number, hidden: number): string {
  const middle = !hidden
    ? ""
    : n === 1
      ? " Ela não aparece no filtro atual."
      : hidden === 1
        ? " 1 delas não aparece no filtro atual."
        : ` ${hidden} delas não aparecem no filtro atual.`
  return `Excluir ${plural(n, "promoção", "promoções")}?${middle} Isso não pode ser desfeito.`
}

/**
 * Aviso do "Publicar no site" em lote. Promo que entrou no site e só o Google falhou conta como
 * publicada no site; a falha do Google vem à parte, com a primeira mensagem.
 */
export function bulkPublishNotice(
  ok: number,
  siteErrors: string[],
  googleErrors: string[],
): { type: "success" | "error"; text: string } {
  const published = `${plural(ok, "publicada", "publicadas")} no site`
  const site = siteErrors.length ? `${published}; ${siteErrors.length} com erro: ${noDot(siteErrors[0])}.` : `${published}.`
  if (!googleErrors.length) return { type: siteErrors.length ? "error" : "success", text: site }
  return { type: "error", text: `${site} Google falhou em ${googleErrors.length}: ${noDot(googleErrors[0])}.` }
}
