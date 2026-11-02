"use client"

import type { ArtFormat, StudioDoc } from "./types"
import { buildArtSet, completeArtSet, type ArtSet, type Captions } from "./artSet"
import { renderDoc } from "./render"
import { promoVariables } from "./variables"

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

/**
 * Arte da promo para abrir: a salva ou, sem arte salva, os 4 formatos no modelo com a foto da promo
 * (sem foto: a primeira da busca pelo destino). Mesma arte no Studio e na grade de várias promos.
 */
export async function openArt(
  promo: { id: string; DESTINO: string; SITE_IMAGE?: unknown },
  family: string,
  { saved: readSaved = true }: { saved?: boolean } = {},
): Promise<{ set: ArtSet; designId: string | null }> {
  if (readSaved) {
    try {
      const saved = await loadSavedArt(promo, family)
      if (saved) {
        const { designId, ...set } = saved
        return { set, designId }
      }
    } catch {
      // segue com o modelo padrão
    }
  }
  let photo = typeof promo.SITE_IMAGE === "string" && promo.SITE_IMAGE ? promo.SITE_IMAGE : null
  if (!photo) {
    try {
      const data = await fetch(`/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=1&orientation=portrait`).then((r) => r.json())
      photo = data.results?.[0]?.urls?.regular || null
    } catch {
      photo = null
    }
  }
  return { set: buildArtSet(family, photo), designId: null }
}

/** Miniatura para a lista; foto sem liberação de origem: salva sem miniatura */
export async function thumbnailOf(d: StudioDoc, vars: Record<string, string>): Promise<string | undefined> {
  try {
    return await renderDoc(d, vars, { mime: "image/jpeg", quality: 0.75, maxWidth: 360 })
  } catch {
    return undefined
  }
}

/**
 * Grava os 4 formatos como a arte da promo (POST /api/designs). Com designId, atualiza o mesmo design.
 * A miniatura sai do formato `format`. Falha: lança Error com a mensagem do servidor.
 */
export async function saveArtSet(
  promo: Record<string, unknown> & { id: string; DESTINO: string },
  set: ArtSet,
  designId?: string | null,
  opts: { format?: ArtFormat; vars?: Record<string, string> } = {},
): Promise<{ designId: string }> {
  const format = opts.format ?? "story"
  const vars = opts.vars ?? promoVariables(promo)
  const data: SavedDesignData = { formats: set.docs, family: set.family, photo: set.photo, captions: set.captions ?? undefined, edited: set.edited }
  const res = await fetch("/api/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: designId || undefined,
      name: `${promo.DESTINO} - artes`,
      kind: "design",
      format,
      data,
      promoId: promo.id,
      thumbnail: await thumbnailOf(set.docs[format], vars),
    }),
  })
  const saved = await res.json().catch(() => ({}))
  if (!res.ok || !saved?.id) throw new Error(saved?.error || "Erro ao salvar")
  return { designId: saved.id }
}
