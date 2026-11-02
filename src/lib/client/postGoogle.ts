"use client"

import { loadSavedArt } from "@/components/studio/savedArt"
import { buildArtSet } from "@/components/studio/artSet"
import { renderDoc } from "@/components/studio/render"
import { promoVariables, type PromoLike } from "@/components/studio/variables"
import { IMAGE_ERROR, NETWORK_ERROR, UPLOAD_ERROR, friendlyError } from "@/components/studio/v2/publishView"
import { uploadImage } from "@/hooks/usePublish"
import type { ChannelState } from "@/lib/publishState"
import type { PromoData } from "@/components/promos/dashboard/types"

export type PostGoogleResult = { ok: true } | { ok: false; error: string }

/** Erro do resultado, ou null se deu certo (o projeto roda sem strict: `ok` não separa os casos sozinho) */
export const googleError = (r: PostGoogleResult): string | null => ("error" in r ? r.error : null)

/** Modelo padrão da promo: Black November na campanha, senão Destaque (o mesmo do Studio) */
export const defaultFamilyOf = (promo: Pick<PromoData, "CAMPAIGN">) =>
  promo.CAMPAIGN === "black-friday" ? "black-november" : "destaque"

/**
 * Posta a promo (já no site) no Google com a arte paisagem: a salva no Studio ou, sem arte,
 * o modelo padrão com a foto da promo. Substitui o post anterior. Nunca lança: devolve o erro pronto para a tela.
 * `photo`: foto de reserva quando a promo não tem SITE_IMAGE (a que a lista mostra).
 */
export async function postGoogleAfterSite(promo: PromoData, opts: { photo?: string | null } = {}): Promise<PostGoogleResult> {
  try {
    const family = defaultFamilyOf(promo)
    const saved = await loadSavedArt(promo, family)
    const doc = (saved ?? buildArtSet(family, promo.SITE_IMAGE || opts.photo || null)).docs.landscape

    let dataUrl: string
    try {
      dataUrl = await renderDoc(doc, promoVariables(promo as unknown as PromoLike), { mime: "image/jpeg", quality: 0.9 })
    } catch {
      return { ok: false, error: IMAGE_ERROR }
    }

    let url: string
    try {
      url = await uploadImage(dataUrl)
    } catch (err) {
      return { ok: false, error: err instanceof TypeError ? NETWORK_ERROR : UPLOAD_ERROR }
    }

    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promoId: promo.id, channel: "google", images: [url] }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null
      return { ok: false, error: friendlyError(typeof data?.error === "string" ? data.error : null, "Google") }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof TypeError ? NETWORK_ERROR : friendlyError(null, "Google") }
  }
}

/**
 * Promo salva que está no site: o Google precisa de post novo? Sim quando não tem post, deu erro
 * ou a oferta mudou depois do post. Se não der para ler a situação, posta (o post novo substitui o anterior).
 */
export async function googleNeedsPost(promoId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/publish?promoId=${encodeURIComponent(promoId)}`, { cache: "no-store" })
    if (!res.ok) return true
    const google = ((await res.json()) as Record<string, ChannelState | undefined>).google
    return !google || google.state === "none" || google.state === "error" || google.stale
  } catch {
    return true
  }
}
