import { describe, expect, it } from "vitest"
import { CHANNELS, type Channel } from "@/lib/channels"
import type { ChannelState } from "@/lib/publishState"
import { jobsFor } from "./bulkPlan"
import {
  apiJobs,
  bulkSelection,
  campaignOf,
  doneCount,
  feedGroups,
  groupCaptionDefault,
  promoCaptions,
  waMessageDefault,
  groupsSummary,
  maxDiscount,
  progressRows,
  republishMessage,
  sentPromoIds,
  type StatusByPromo,
} from "./bulkView"

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)
const none: ChannelState = { state: "none", at: null, by: null, error: null, stale: false }
const st = (over: Partial<Record<Channel, Partial<ChannelState>>> = {}): Record<Channel, ChannelState> =>
  Object.fromEntries(CHANNELS.map((c) => [c.id, { ...none, ...over[c.id] }])) as Record<Channel, ChannelState>
const sorted = (s: Set<Channel>) => [...s].sort()

describe("bulkSelection", () => {
  it("sem situação lida: Site e Google", () => {
    expect(sorted(bulkSelection({}, ids(2), ["ig-feed"]))).toEqual(["google", "site"])
  })
  it("lembrados: mantém o canal se alguma promo ainda falta", () => {
    const status: StatusByPromo = {
      p1: st({ "ig-feed": { state: "published" }, "ig-story": { state: "published" } }),
      p2: st({ "ig-feed": { state: "published" } }),
    }
    expect(sorted(bulkSelection(status, ["p1", "p2"], ["ig-feed", "ig-story"]))).toEqual(["ig-story"])
  })
  it("canal publicado mas desatualizado volta", () => {
    const status: StatusByPromo = { p1: st({ "ig-feed": { state: "published", stale: true } }), p2: st({ "ig-feed": { state: "published" } }) }
    expect(sorted(bulkSelection(status, ["p1", "p2"], ["ig-feed"]))).toEqual(["ig-feed"])
  })
  it("Site lembrado leva o Google; Site já publicado em todas sai, Google fica se faltar", () => {
    expect(sorted(bulkSelection({ p1: st() }, ["p1"], ["site"]))).toEqual(["google", "site"])
    const status: StatusByPromo = { p1: st({ site: { state: "published" } }), p2: st({ site: { state: "published" } }) }
    expect(sorted(bulkSelection(status, ["p1", "p2"], ["site", "google"]))).toEqual(["google"])
  })
  it("sem lembrança: a regra de sempre, juntando as promos", () => {
    const all = CHANNELS.map((c) => c.id)
    const done = Object.fromEntries(all.map((c) => [c, { state: "published" as const }]))
    const status: StatusByPromo = { p1: st(done), p2: st({ ...done, "fb-story": { state: "error" } }) }
    expect(sorted(bulkSelection(status, ["p1", "p2"], null))).toEqual(["fb-story"])
  })
})

describe("doneCount", () => {
  it("conta publicado, agendado e compartilhado em dia", () => {
    const status: StatusByPromo = {
      p1: st({ "fb-feed": { state: "scheduled" } }),
      p2: st({ "fb-feed": { state: "published", stale: true } }),
      p3: st({ "fb-feed": { state: "simulated" } }),
      p4: st({ "fb-feed": { state: "published" } }),
    }
    expect(doneCount(status, ids(5), "fb-feed")).toBe(2)
  })
})

describe("grupos", () => {
  it("12 → 10 + 2", () => {
    expect(feedGroups(ids(12)).map((g) => g.length)).toEqual([10, 2])
    expect(groupsSummary(feedGroups(ids(12)), false)).toBe("12 promoções em 2 carrosséis (10 + 2)")
    expect(groupsSummary(feedGroups(ids(3)), true)).toBe("3 promoções em 1 álbum")
    expect(groupsSummary(feedGroups(ids(21)), true)).toBe("21 promoções em 3 álbuns (10 + 10 + 1)")
  })
})

describe("republishMessage", () => {
  it("texto por canal, com singular", () => {
    expect(republishMessage("Instagram feed", 3)).toBe("Instagram feed: 3 promoções já publicadas. Publicar de novo?")
    expect(republishMessage("Site", 1)).toBe("Site: 1 promoção já publicada. Publicar de novo?")
  })
})

describe("progressRows", () => {
  it("carrossel ocupa a linha de cada promo do grupo, com o rótulo", () => {
    const jobs = jobsFor(ids(12), ["ig-feed", "fb-feed", "site"], "carousel", "batch")
    const rows = progressRows(ids(12), ["fb-feed", "site", "ig-feed"], jobs, { [jobs[12].key]: { phase: "busy" } })
    expect(rows).toHaveLength(12)
    expect(rows[0].cells.map((c) => c.channel)).toEqual(["site", "ig-feed", "fb-feed"])
    expect(rows[0].cells[1].label).toBe("Carrossel 1/2")
    expect(rows[0].cells[1].run).toEqual({ phase: "busy" })
    expect(rows[9].cells[1].job?.key).toBe(rows[0].cells[1].job?.key)
    expect(rows[10].cells[1].label).toBe("Carrossel 2/2")
    expect(rows[11].cells[2].label).toBe("Álbum 2/2")
    expect(rows[0].cells[0].label).toBeNull()
    expect(rows[0].cells[0].job?.key).toBe("site:p1")
  })
  it("uma publicação por promo: sem rótulo; '1 imagem + mensagem' só na primeira", () => {
    const jobs = jobsFor(ids(3), ["ig-feed", "wa-channel"], "single", "one")
    const rows = progressRows(ids(3), ["ig-feed", "wa-channel"], jobs, {})
    expect(rows[1].cells[0].label).toBeNull()
    expect(rows[0].cells[1].job?.promoIds).toEqual(["p1"])
    expect(rows[1].cells[1].job).toBeNull()
  })
  it("carrossel de 1 que sobra é post sem rótulo", () => {
    const jobs = jobsFor(ids(11), ["ig-feed"], "carousel", "batch")
    const rows = progressRows(ids(11), ["ig-feed"], jobs, {})
    expect(rows[0].cells[0].label).toBe("Carrossel 1/1")
    expect(rows[10].cells[0].label).toBeNull()
  })
})

describe("apiJobs e sentPromoIds", () => {
  it("WhatsApp fica fora do botão Publicar", () => {
    const jobs = jobsFor(ids(2), ["site", "wa-channel", "wa-status"], "single", "batch")
    expect(apiJobs(jobs).map((j) => j.key)).toEqual(["site:p1", "site:p2"])
  })
  it("só conta o que saiu de verdade, com todas as promos do grupo", () => {
    const jobs = jobsFor(ids(3), ["ig-feed", "site"], "carousel", "batch")
    const runs = {
      "site:p1": { phase: "done" as const, status: "simulated" as const },
      "site:p2": { phase: "error" as const, error: "x" },
      "ig-feed:p1,p2,p3": { phase: "done" as const, status: "published" as const },
    }
    expect([...sentPromoIds(jobs, runs)].sort()).toEqual(["p1", "p2", "p3"])
    expect([...sentPromoIds(jobs, { "site:p1": runs["site:p1"] })]).toEqual([])
  })
})

describe("campaignOf e maxDiscount", () => {
  it("campanha só se todas forem", () => {
    expect(campaignOf([{ CAMPAIGN: "black-friday" }, { CAMPAIGN: "black-friday" }])).toBe("Black November")
    expect(campaignOf([{ CAMPAIGN: "black-friday" }, {}])).toBeNull()
    expect(campaignOf([])).toBeNull()
  })
  it("maior desconto", () => {
    expect(maxDiscount([{ VALOR: "1000", VALOR_ORIGINAL: "2000" }, { VALOR: "700", VALOR_ORIGINAL: "1000" }])).toBe(50)
    expect(maxDiscount([{ VALOR: "1000" }])).toBeUndefined()
  })
})

describe("legendas", () => {
  const promo = (id: string, destino: string, extra: Record<string, unknown> = {}) => ({ id, DESTINO: destino, VALOR: "1000", PARCELAS: 10, ...extra })
  const saved = { instagram: "salva ig", facebook: "salva fb", whatsapp: "salva wa" }
  it("a salva com a arte vence; sem ela, gerada com o link da oferta", () => {
    expect(promoCaptions(promo("a", "Maceió"), saved)).toBe(saved)
    const gen = promoCaptions(promo("a", "Maceió"), null)
    expect(gen.facebook).toContain("/pacotes/")
    expect(gen.instagram).toContain("link na bio")
  })
  it("carrossel: uma linha por oferta, na ordem; campanha só se todas", () => {
    const text = groupCaptionDefault([promo("a", "Maceió"), promo("b", "Natal")])
    expect(text.indexOf("1. Maceió")).toBeLessThan(text.indexOf("2. Natal"))
    expect(text).not.toMatch(/BLACK NOVEMBER/)
    expect(groupCaptionDefault([promo("a", "Maceió", { CAMPAIGN: "black-friday" })])).toMatch(/^BLACK NOVEMBER/)
  })
  it("WhatsApp: lote com todas; uma só usa a mensagem da primeira", () => {
    const list = [promo("a", "Maceió"), promo("b", "Natal")]
    const batch = waMessageDefault("batch", list, () => null)
    expect(batch).toContain("Maceió")
    expect(batch).toContain("Natal")
    expect(waMessageDefault("one", list, (id) => (id === "a" ? saved : null))).toBe("salva wa")
    const one = waMessageDefault("one", list, () => null)
    expect(one).toContain("Maceió")
    expect(one).not.toContain("Natal")
  })
})
