import { describe, expect, it } from "vitest"
import type { PublishSummary } from "@/lib/publishState"
import { buildArtSet, markEdited, type ArtSet } from "../artSet"
import {
  defaultFamilyOf,
  editedPromos,
  hasUnpublished,
  newlyPublished,
  nextThumbJob,
  publishedPromoIds,
  thumbKey,
  type ThumbCache,
} from "./multiState"

const set = (edited = false): ArtSet => {
  const s = buildArtSet("destaque", null)
  return edited ? markEdited(s, "feed") : s
}

describe("defaultFamilyOf", () => {
  it("Black Friday usa Black November; o resto, Destaque", () => {
    expect(defaultFamilyOf({ CAMPAIGN: "black-friday" })).toBe("black-november")
    expect(defaultFamilyOf({ CAMPAIGN: null })).toBe("destaque")
    expect(defaultFamilyOf({})).toBe("destaque")
  })
})

describe("editedPromos", () => {
  it("só as promos com algum formato ajustado à mão", () => {
    expect(editedPromos({ a: set(), b: set(true), c: set(true) })).toEqual(["b", "c"])
    expect(editedPromos({})).toEqual([])
  })
})

describe("hasUnpublished", () => {
  it("true se alguma promo não foi publicada nesta sessão", () => {
    expect(hasUnpublished(["a", "b"], new Set(["a"]))).toBe(true)
    expect(hasUnpublished(["a", "b"], new Set(["a", "b", "x"]))).toBe(false)
    expect(hasUnpublished([], new Set())).toBe(false)
  })
})

describe("publishedPromoIds", () => {
  it("promo com algum canal publicado, agendado ou compartilhado", () => {
    const summary: PublishSummary = {
      a: { site: "published" },
      b: { "fb-feed": "scheduled" },
      c: { "wa-channel": "shared" },
      d: { "ig-feed": "simulated", site: "error" },
      e: {},
    }
    expect([...publishedPromoIds(summary)].sort()).toEqual(["a", "b", "c"])
    expect(publishedPromoIds(null).size).toBe(0)
  })
})

describe("newlyPublished", () => {
  it("canal que passou a publicado/agendado/compartilhado depois da primeira leitura", () => {
    const before: PublishSummary = { a: { site: "published" }, b: {}, c: { "ig-feed": "error" }, d: { "fb-feed": "scheduled" } }
    const now: PublishSummary = {
      a: { site: "published" }, // já estava: não conta
      b: { "ig-story": "published" },
      c: { "ig-feed": "published" },
      d: { "fb-feed": "published" }, // agendado → publicado: mudou
      e: { site: "shared" }, // promo que não estava na primeira leitura
    }
    expect([...newlyPublished(before, now)].sort()).toEqual(["b", "c", "d", "e"])
  })
  it("sem primeira leitura: nada conta (não dá para saber o que é novo)", () => {
    expect(newlyPublished(null, { a: { site: "published" } }).size).toBe(0)
  })
  it("simulado e erro não contam", () => {
    expect(newlyPublished({ a: {} }, { a: { site: "simulated", google: "error" } }).size).toBe(0)
  })
})

describe("nextThumbJob", () => {
  it("primeira promo carregada sem miniatura do formato e do conjunto atuais", () => {
    const sa = set()
    const sb = set()
    const cache: ThumbCache = new Map([[thumbKey("a", "story"), { set: sa, url: "a.jpg" }]])
    expect(nextThumbJob(["a", "b", "c"], "story", { a: sa, b: sb }, cache)).toBe("b")
  })
  it("conjunto trocado (outro objeto) desenha de novo", () => {
    const sa = set()
    const cache: ThumbCache = new Map([[thumbKey("a", "story"), { set: sa, url: "a.jpg" }]])
    expect(nextThumbJob(["a"], "story", { a: set() }, cache)).toBe("a")
  })
  it("outro formato é outra miniatura; tudo pronto → null", () => {
    const sa = set()
    const cache: ThumbCache = new Map([[thumbKey("a", "story"), { set: sa, url: null }]])
    expect(nextThumbJob(["a"], "feed", { a: sa }, cache)).toBe("a")
    expect(nextThumbJob(["a"], "story", { a: sa }, cache)).toBeNull()
    expect(nextThumbJob(["a", "b"], "story", { a: sa }, cache)).toBeNull() // b ainda carregando
  })
})
