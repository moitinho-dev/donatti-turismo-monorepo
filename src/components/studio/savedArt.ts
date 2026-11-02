"use client"

import type { ArtFormat, StudioDoc } from "./types"
import { completeArtSet, type ArtSet, type Captions } from "./artSet"

/** O que o Studio guarda em designs.data para a arte de uma promo */
export interface SavedDesignData {
  formats: Partial<Record<ArtFormat, StudioDoc>>
  family: string | null
  photo: string | null
  captions?: Captions
  edited?: ArtFormat[]
}

export type SavedArt = ArtSet & { designId: string }

/**
 * Arte salva no Studio para a promo (a mais recente), pronta para desenhar.
 * Arte salva sem foto: usa a foto atual da promo nos espaços de foto vazios.
 * Usado pelo Studio ao abrir e pelo gerador em lote, para os dois mostrarem a mesma arte.
 */
export async function loadSavedArt(promo: { id: string; SITE_IMAGE?: unknown }, fallbackFamily = "destaque"): Promise<SavedArt | null> {
  const list = await fetch(`/api/designs?kind=design&promoId=${encodeURIComponent(promo.id)}`).then((r) => (r.ok ? r.json() : []))
  if (!list[0]?.id) return null
  const saved = await fetch(`/api/designs/${list[0].id}`).then((r) => (r.ok ? r.json() : null))
  const data = saved?.data as SavedDesignData | undefined
  if (!data?.formats) return null
  const photo = data.photo || (typeof promo.SITE_IMAGE === "string" ? promo.SITE_IMAGE : null) || null
  // Arte salva sem foto: usa a foto atual da promo nos espaços de foto vazios
  const formats = data.photo
    ? data.formats
    : (Object.fromEntries(
        Object.entries(data.formats).map(([f, d]) => [
          f,
          d && { ...d, layers: d.layers.map((l) => (l.type === "image" && l.role === "photo" && !l.src && photo ? { ...l, src: photo } : l)) },
        ]),
      ) as SavedDesignData["formats"])
  return { ...completeArtSet({ ...data, formats, photo }, fallbackFamily), designId: saved.id }
}
