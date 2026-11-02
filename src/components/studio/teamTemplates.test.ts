import { describe, expect, it } from "vitest"
import { fixedTextHits, replaceFixedText, templateDataToSet } from "./teamTemplates"
import { emptyDoc, type StudioDoc, type TextLayer } from "./types"

const text = (id: string, t: string): TextLayer => ({
  id, name: id, type: "text", x: 0, y: 0, width: 100, height: 50, rotation: 0, opacity: 1,
  text: t, fontFamily: "Inter", fontSize: 40, fontWeight: "700", fill: "#000", align: "left", lineHeight: 1, letterSpacing: 0,
})

const docWith = (...ts: string[]): StudioDoc => ({ ...emptyDoc("story"), layers: ts.map((t, i) => text("t" + i, t)) })

describe("templateDataToSet", () => {
  it("aceita StudioDoc antigo", () => {
    const d = emptyDoc("story")
    expect(templateDataToSet(d)).toEqual({ story: d })
  })
  it("aceita { formats } e filtra chaves desconhecidas", () => {
    const f = emptyDoc("feed")
    expect(templateDataToSet({ formats: { feed: f, foo: f } })).toEqual({ feed: f })
  })
  it("lixo vira {}", () => {
    expect(templateDataToSet(null)).toEqual({})
    expect(templateDataToSet("x")).toEqual({})
    expect(templateDataToSet({})).toEqual({})
  })
})

describe("fixedTextHits / replaceFixedText", () => {
  const vars = { DESTINO: "Maceió", OFF: "OFF" }
  it("acha texto fixo, ignora variável e valor curto", () => {
    const doc = docWith("  maceió ", "{DESTINO}", "OFF")
    expect(fixedTextHits(doc, vars)).toEqual([{ layerId: "t0", key: "DESTINO" }])
  })
  it("substitui por {KEY}", () => {
    const doc = docWith("Maceió", "outro")
    const out = replaceFixedText(doc, fixedTextHits(doc, vars))
    expect((out.layers[0] as TextLayer).text).toBe("{DESTINO}")
    expect((out.layers[1] as TextLayer).text).toBe("outro")
    expect((doc.layers[0] as TextLayer).text).toBe("Maceió")
  })
})
