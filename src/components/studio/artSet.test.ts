import { describe, expect, it } from "vitest"
import {
  applyFamily,
  applyTemplateDocs,
  buildArtSet,
  completeArtSet,
  equivalentLayers,
  markEdited,
  propagate,
  setPhotoAll,
} from "./artSet"
import type { ImageLayer } from "./types"

const photos = (set: ReturnType<typeof buildArtSet>) =>
  Object.values(set.docs).flatMap((d) => d.layers.filter((l): l is ImageLayer => l.type === "image" && l.role === "photo"))

describe("artSet", () => {
  it("buildArtSet cria os 4 formatos com a foto", () => {
    const set = buildArtSet("black-november", "x.jpg")
    expect(Object.keys(set.docs)).toEqual(["story", "feed", "square", "landscape"])
    const ph = photos(set)
    expect(ph.length).toBeGreaterThan(0)
    expect(ph.every((l) => l.src === "x.jpg")).toBe(true)
    expect(set.edited).toEqual([])
    expect(set.generated).toEqual([])
    expect(set.captions).toBeNull()
  })

  it("completeArtSet mantém o salvo e gera o que falta", () => {
    const docStory = buildArtSet("clean", "p.jpg").docs.story
    const set = completeArtSet({ formats: { story: docStory }, family: "destaque", photo: "p.jpg" }, "destaque")
    expect(set.docs.story).toEqual(docStory)
    expect(set.generated).toEqual(["feed", "square", "landscape"])
    expect(Object.keys(set.docs)).toHaveLength(4)
    expect(completeArtSet({ formats: {}, family: null, photo: null }, "clean").family).toBe("clean")
  })

  it("completeArtSet sem foto não inventa foto", () => {
    const set = completeArtSet({ formats: {}, family: null, photo: null }, "destaque")
    expect(set.generated).toHaveLength(4)
    expect(set.photo).toBeNull()
  })

  it("applyFamily refaz os 4 e zera edited", () => {
    const set = buildArtSet("destaque", "a.jpg")
    const next = applyFamily(markEdited(set, "feed"), "clean")
    expect(next.edited).toEqual([])
    expect(next.family).toBe("clean")
    expect(next.docs.feed).not.toEqual(set.docs.feed)
  })

  it("markEdited é idempotente", () => {
    const set = markEdited(markEdited(buildArtSet("destaque", null), "feed"), "feed")
    expect(set.edited).toEqual(["feed"])
  })

  it("applyTemplateDocs usa os docs dados e completa o resto", () => {
    const set = buildArtSet("destaque", "a.jpg")
    const tpl = buildArtSet("clean", null).docs.story
    const next = applyTemplateDocs(markEdited(set, "feed"), { story: tpl }, "destaque")
    expect(next.edited).toEqual([])
    expect(next.generated).toEqual(["feed", "square", "landscape"])
    expect(photos(next).every((l) => l.src === "a.jpg")).toBe(true)
    expect(next.docs.story.layers).toEqual(
      tpl.layers.map((l) => (l.type === "image" && l.role === "photo" ? { ...l, src: "a.jpg" } : l)),
    )
  })

  it("setPhotoAll troca a foto nos 4", () => {
    const next = setPhotoAll(buildArtSet("destaque", "a.jpg"), "n.jpg")
    expect(next.photo).toBe("n.jpg")
    expect(photos(next).every((l) => l.src === "n.jpg")).toBe(true)
  })

  it("propagate só leva text/fill/src, nunca posição", () => {
    const set = buildArtSet("black-november", "x.jpg")
    const next = propagate(set, "story", "Destino", { text: "X", x: 999 } as never)
    let checked = 0
    for (const f of ["feed", "square", "landscape"] as const) {
      const before = set.docs[f].layers.find((l) => l.name === "Destino")
      const after = next.docs[f].layers.find((l) => l.name === "Destino")
      if (!before) continue
      checked++
      expect(after).toMatchObject({ text: "X", x: before.x })
    }
    expect(checked).toBeGreaterThan(0)
    expect(next.docs.story).toBe(set.docs.story)
  })

  it("equivalentLayers ignora formatos sem a camada", () => {
    const set = buildArtSet("black-november", null)
    expect(equivalentLayers(set, "story", "nao-existe")).toEqual([])
    const eq = equivalentLayers(set, "story", "Destino")
    expect(eq.every((e) => e.format !== "story")).toBe(true)
    for (const e of eq) expect(set.docs[e.format].layers.some((l) => l.id === e.layerId && l.name === "Destino")).toBe(true)
  })
})
