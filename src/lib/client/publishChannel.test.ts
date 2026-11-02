import { afterEach, describe, expect, it, vi } from "vitest"
import { NETWORK_ERROR, SHARED_MARK_ERROR } from "@/components/studio/v2/publishView"
import { markShared, publishChannel } from "./publishChannel"

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })

afterEach(() => vi.unstubAllGlobals())

describe("publishChannel", () => {
  it("sobe a data URL antes e repassa legenda e group", async () => {
    const fetchMock = vi.fn(async (...args: [string, RequestInit?]) => (args[0] === "/api/meta/media" ? json({ url: "https://cdn/x.jpg" }) : json({ status: "published" })))
    vi.stubGlobal("fetch", fetchMock)
    const group = { kind: "carousel" as const, promoIds: ["a", "b"] }
    const res = await publishChannel("a", "ig-feed", { images: ["data:image/png;base64,AAA", "https://cdn/y.jpg"], caption: "oi", group })
    expect(res).toEqual({ ok: true, status: "published" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe("/api/meta/media")
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(body).toEqual({ promoId: "a", channel: "ig-feed", images: ["https://cdn/x.jpg", "https://cdn/y.jpg"], caption: "oi", group })
  })

  it("mostra o erro do servidor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "Sem permissão" }, 403)))
    expect(await publishChannel("a", "site", { images: ["https://cdn/y.jpg"] })).toEqual({ ok: false, error: "Sem permissão" })
  })

  it("falha de rede vira mensagem amigável", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    expect(await publishChannel("a", "site", { images: ["https://cdn/y.jpg"] })).toEqual({ ok: false, error: NETWORK_ERROR })
  })
})

describe("markShared", () => {
  it("marca o canal da promo e devolve a situação", async () => {
    const fetchMock = vi.fn(async () => json({ ok: true, status: "shared" }))
    vi.stubGlobal("fetch", fetchMock)
    expect(await markShared("a", "wa-status")).toEqual({ ok: true, status: "shared" })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/publish/shared")
    expect(JSON.parse(init.body as string)).toEqual({ promoId: "a", channel: "wa-status" })
  })
  it("erro do servidor ou de rede vira mensagem", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "Sem permissão para publicar esta promoção" }, 403)))
    expect(await markShared("a", "wa-channel")).toEqual({ ok: false, error: "Sem permissão para publicar esta promoção" })
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    expect(await markShared("a", "wa-channel")).toEqual({ ok: false, error: SHARED_MARK_ERROR })
  })
})
