import { FORMAT_ORDER, type ArtFormat, type StudioDoc } from "./types"
import { VARIABLES } from "./variables"

/** Dados de um template da equipe salvo pelo Studio v2 (kind "template", format "set") */
export interface TeamTemplateData {
  formats: Partial<Record<ArtFormat, StudioDoc>>
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)

/** Aceita { formats } (novo) ou um StudioDoc de um formato só (antigo). */
export function templateDataToSet(data: unknown): Partial<Record<ArtFormat, StudioDoc>> {
  if (!isObj(data)) return {}
  if (Array.isArray(data.layers) && typeof data.format === "string") {
    return FORMAT_ORDER.includes(data.format as ArtFormat) ? { [data.format]: data as unknown as StudioDoc } : {}
  }
  if (isObj(data.formats)) {
    const out: Partial<Record<ArtFormat, StudioDoc>> = {}
    for (const f of FORMAT_ORDER) {
      const d = data.formats[f]
      if (d) out[f] = d as StudioDoc
    }
    return out
  }
  return {}
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase()

/** Camadas de texto cujo conteúdo é o valor fixo de uma variável (deveria ser {VARIÁVEL}). */
export function fixedTextHits(doc: StudioDoc, vars: Record<string, string>): { layerId: string; key: string }[] {
  const hits: { layerId: string; key: string }[] = []
  for (const layer of doc.layers) {
    if (layer.type !== "text" || layer.text.includes("{")) continue
    const t = norm(layer.text)
    const v = VARIABLES.find(({ key }) => {
      const val = vars[key]
      return typeof val === "string" && val.trim().length >= 3 && norm(val) === t
    })
    if (v) hits.push({ layerId: layer.id, key: v.key })
  }
  return hits
}

export function replaceFixedText(doc: StudioDoc, hits: { layerId: string; key: string }[]): StudioDoc {
  const byId = new Map(hits.map((h) => [h.layerId, h.key]))
  return {
    ...doc,
    layers: doc.layers.map((l) => (l.type === "text" && byId.has(l.id) ? { ...l, text: `{${byId.get(l.id)}}` } : l)),
  }
}
