import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ default: { publishLog: { create: vi.fn() } } }))

import { offerHash, channelStatus, needsConfirm } from "./publishLog"

const base = { destino: "Porto", hotel: "H", dataFormatada: "10/11", valor: "999", parcelas: 10, numeroDeNoites: "5" }

describe("offerHash", () => {
  it("é igual para os mesmos campos e muda com o valor", () => {
    expect(offerHash(base)).toBe(offerHash({ ...base }))
    expect(offerHash(base)).not.toBe(offerHash({ ...base, valor: "1000" }))
  })
})

describe("channelStatus", () => {
  const h = offerHash(base)
  it("canal sem log é none", () => {
    const s = channelStatus([], h)
    expect(s["ig-feed"]).toEqual({ state: "none", at: null, by: null, error: null, stale: false })
  })
  it("pega o log mais novo", () => {
    const s = channelStatus(
      [
        { channel: "site", status: "error", createdAt: new Date("2026-01-02"), error: "x", offerHash: h },
        { channel: "site", status: "published", createdAt: new Date("2026-01-03"), createdByName: "Ana", offerHash: h },
      ],
      h,
    )
    expect(s.site.state).toBe("published")
    expect(s.site.by).toBe("Ana")
    expect(s.site.at).toBe("2026-01-03T00:00:00.000Z")
    const s2 = channelStatus(
      [
        { channel: "site", status: "published", createdAt: new Date("2026-01-03"), offerHash: h },
        { channel: "site", status: "error", createdAt: new Date("2026-01-04"), error: "boom", offerHash: h },
      ],
      h,
    )
    expect(s2.site.state).toBe("error")
    expect(s2.site.error).toBe("boom")
    expect(s2.site.stale).toBe(false)
  })
  it("stale quando o hash difere", () => {
    const s = channelStatus([{ channel: "google", status: "published", createdAt: new Date(), offerHash: "old" }], h)
    expect(s.google.stale).toBe(true)
  })
  it("agendado traz quando o post sai", () => {
    const when = new Date("2026-11-20T15:00:00.000Z")
    const s = channelStatus([{ channel: "fb-feed", status: "scheduled", createdAt: new Date(), offerHash: h, scheduledFor: when }], h)
    expect(s["fb-feed"].scheduledFor).toBe(when.toISOString())
  })
})

describe("needsConfirm", () => {
  it("erro e none não pedem confirmação", () => {
    const b = { at: null, by: null, error: null, stale: false }
    expect(needsConfirm({ ...b, state: "error" })).toBe(false)
    expect(needsConfirm({ ...b, state: "none" })).toBe(false)
    expect(needsConfirm({ ...b, state: "published" })).toBe(true)
    expect(needsConfirm({ ...b, state: "scheduled" })).toBe(true)
    expect(needsConfirm({ ...b, state: "shared" })).toBe(true)
    expect(needsConfirm({ ...b, state: "simulated" })).toBe(true)
  })
})
