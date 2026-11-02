import { TEMPLATE_FAMILIES, withPhoto } from "./templates"
import { FORMAT_ORDER, type ArtFormat, type Layer, type StudioDoc } from "./types"
import type { SavedDesignData } from "./savedArt"

export interface Captions {
  instagram: string
  facebook: string
  whatsapp: string
}

export interface ArtSet {
  /** Sempre os 4 formatos */
  docs: Record<ArtFormat, StudioDoc>
  family: string | null
  photo: string | null
  /** Formatos ajustados à mão depois do template */
  edited: ArtFormat[]
  /** Formatos completados agora (não estavam salvos) */
  generated: ArtFormat[]
  captions: Captions | null
}

const buildDoc = (familyId: string | null, format: ArtFormat, photo: string | null): StudioDoc =>
  withPhoto((TEMPLATE_FAMILIES.find((f) => f.id === familyId) || TEMPLATE_FAMILIES[0]).build(format), photo)

const buildAll = (familyId: string | null, photo: string | null) =>
  Object.fromEntries(FORMAT_ORDER.map((f) => [f, buildDoc(familyId, f, photo)])) as Record<ArtFormat, StudioDoc>

export function buildArtSet(familyId: string | null, photo: string | null): ArtSet {
  return { docs: buildAll(familyId, photo), family: familyId, photo, edited: [], generated: [], captions: null }
}

export function completeArtSet(saved: SavedDesignData, fallbackFamily: string): ArtSet {
  const family = saved.family ?? fallbackFamily
  const docs = {} as Record<ArtFormat, StudioDoc>
  const generated: ArtFormat[] = []
  for (const f of FORMAT_ORDER) {
    const d = saved.formats?.[f]
    if (d) docs[f] = d
    else {
      docs[f] = buildDoc(family, f, saved.photo)
      generated.push(f)
    }
  }
  return {
    docs,
    family: saved.family,
    photo: saved.photo,
    edited: saved.edited ? FORMAT_ORDER.filter((f) => saved.edited!.includes(f)) : [],
    generated,
    captions: saved.captions ?? null,
  }
}

/** Refaz os 4 formatos com o modelo; zera os ajustes manuais */
export function applyFamily(set: ArtSet, familyId: string): ArtSet {
  return { ...set, docs: buildAll(familyId, set.photo), family: familyId, edited: [], generated: [] }
}

export function applyTemplateDocs(
  set: ArtSet,
  docs: Partial<Record<ArtFormat, StudioDoc>>,
  fallbackFamily: string,
): ArtSet {
  const next = {} as Record<ArtFormat, StudioDoc>
  const generated: ArtFormat[] = []
  for (const f of FORMAT_ORDER) {
    const d = docs[f]
    if (d) next[f] = set.photo ? withPhoto(d, set.photo) : d
    else {
      next[f] = buildDoc(fallbackFamily, f, set.photo)
      generated.push(f)
    }
  }
  return { ...set, docs: next, edited: [], generated }
}

export function setPhotoAll(set: ArtSet, url: string): ArtSet {
  const docs = Object.fromEntries(FORMAT_ORDER.map((f) => [f, withPhoto(set.docs[f], url)])) as Record<ArtFormat, StudioDoc>
  return { ...set, docs, photo: url }
}

export function markEdited(set: ArtSet, format: ArtFormat): ArtSet {
  return set.edited.includes(format) ? set : { ...set, edited: [...set.edited, format] }
}

export function equivalentLayers(set: ArtSet, from: ArtFormat, layerName: string): { format: ArtFormat; layerId: string }[] {
  const out: { format: ArtFormat; layerId: string }[] = []
  for (const f of FORMAT_ORDER) {
    if (f === from) continue
    const layer = set.docs[f].layers.find((l) => l.name === layerName)
    if (layer) out.push({ format: f, layerId: layer.id })
  }
  return out
}

const PROPAGATED = ["text", "fill", "src"] as const

/** Leva texto, cor e imagem da camada para as de mesmo nome nos outros formatos; nunca posição/tamanho */
export function propagate(set: ArtSet, from: ArtFormat, layerName: string, patch: Partial<Layer>): ArtSet {
  const safe: Record<string, unknown> = {}
  for (const k of PROPAGATED) if (k in patch) safe[k] = (patch as Record<string, unknown>)[k]
  const docs = { ...set.docs }
  for (const { format, layerId } of equivalentLayers(set, from, layerName)) {
    docs[format] = {
      ...docs[format],
      layers: docs[format].layers.map((l) => {
        if (l.id !== layerId) return l
        const applicable = Object.fromEntries(Object.entries(safe).filter(([k]) => k in l))
        return { ...l, ...applicable } as Layer
      }),
    }
  }
  return { ...set, docs }
}
