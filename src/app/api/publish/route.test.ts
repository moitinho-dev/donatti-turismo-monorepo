import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: {
    promo: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    publishLog: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/meta", () => {
  class MetaError extends Error {}
  return { MetaError, publishMeta: vi.fn(), getMetaConnection: vi.fn() }
})
vi.mock("@/lib/googleBusiness", () => ({ publishPromoPost: vi.fn(), getBusinessConnection: vi.fn() }))
vi.mock("../meta/session", () => ({ metaSession: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/publishLog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/publishLog")>()
  return { ...actual, recordPublish: vi.fn() }
})

import prisma from "@/lib/db"
import { MetaError, getMetaConnection, publishMeta } from "@/lib/meta"
import { getBusinessConnection, publishPromoPost } from "@/lib/googleBusiness"
import { recordPublish } from "@/lib/publishLog"
import { revalidatePath } from "next/cache"
import { metaSession } from "../meta/session"
import { POST } from "./route"
import { POST as SHARED } from "./shared/route"

const db = prisma as unknown as {
  promo: Record<"findMany" | "findUnique" | "update" | "updateMany", ReturnType<typeof vi.fn>>
  publishLog: Record<"create" | "findMany" | "findFirst", ReturnType<typeof vi.fn>>
}

const promo = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  destino: "Porto Seguro",
  hotel: "Hotel X",
  dataFormatada: "10/11",
  valor: "999",
  parcelas: 10,
  numeroDeNoites: "5",
  sitePublished: true,
  siteSlug: null,
  googleBusinessPostName: null,
  ...extra,
})

const req = (body: unknown) =>
  new Request("http://localhost/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

const IMG = "https://cdn.example.com/a.jpg"

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.PUBLISH_SIMULATE
  vi.mocked(metaSession).mockResolvedValue({ id: "u1", email: "ana@donatti.com", admin: false })
  vi.mocked(getMetaConnection).mockResolvedValue({ pageId: "p1", pageAccessToken: "t", igUserId: "ig1" } as never)
  vi.mocked(getBusinessConnection).mockResolvedValue({ refreshToken: "r", accountName: "accounts/1", locationName: "accounts/1/locations/2" } as never)
  db.promo.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => where.id.in.map((id) => promo(id)))
  db.publishLog.findFirst.mockResolvedValue(null)
})

describe("POST /api/publish", () => {
  it("sem sessão responde 401", async () => {
    vi.mocked(metaSession).mockResolvedValue(null)
    const res = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG] }))
    expect(res.status).toBe(401)
    expect(recordPublish).not.toHaveBeenCalled()
  })

  it("simulação ligada não chama Meta nem Google e grava simulated", async () => {
    process.env.PUBLISH_SIMULATE = "on"
    for (const channel of ["ig-feed", "google", "site"] as const) {
      const res = await POST(req({ promoId: "a", channel, images: channel === "site" ? [] : [IMG] }))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true, status: "simulated", externalId: null })
    }
    expect(publishMeta).not.toHaveBeenCalled()
    expect(publishPromoPost).not.toHaveBeenCalled()
    expect(db.promo.update).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(recordPublish).toHaveBeenCalledTimes(3)
    for (const [arg] of vi.mocked(recordPublish).mock.calls) expect(arg).toMatchObject({ status: "simulated", promoId: "a", createdById: "u1" })
  })

  it("google com promo fora do site responde 409", async () => {
    db.promo.findMany.mockResolvedValue([promo("a", { sitePublished: false })])
    const res = await POST(req({ promoId: "a", channel: "google", images: [IMG] }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe("Publique no site antes")
    expect(publishPromoPost).not.toHaveBeenCalled()
  })

  it("google publica com a arte e substitui o post anterior", async () => {
    vi.mocked(publishPromoPost).mockResolvedValue({ name: "accounts/1/locations/2/localPosts/9" })
    const res = await POST(req({ promoId: "a", channel: "google", images: [IMG] }))
    expect(res.status).toBe(200)
    expect(publishPromoPost).toHaveBeenCalledWith("a", { imageUrl: IMG, replace: true })
    expect(await res.json()).toEqual({ ok: true, status: "published", externalId: "accounts/1/locations/2/localPosts/9" })
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "google", kind: "post", status: "published" }))
  })

  it("google não conectado responde 409 e grava erro", async () => {
    vi.mocked(getBusinessConnection).mockResolvedValue(null)
    const res = await POST(req({ promoId: "a", channel: "google", images: [IMG] }))
    expect(res.status).toBe(409)
    expect(publishPromoPost).not.toHaveBeenCalled()
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "google", status: "error" }))
  })

  it("ig-feed com erro da Meta responde 502 e grava o erro", async () => {
    vi.mocked(publishMeta).mockRejectedValue(new MetaError("x"))
    const res = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG], caption: "oi" }))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: "x" })
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ promoId: "a", channel: "ig-feed", status: "error", error: "x" }))
  })

  it("grupo com 3 promos grava 3 logs com o mesmo externalId", async () => {
    vi.mocked(publishMeta).mockResolvedValue({ externalId: "post-1", kind: "carousel" })
    const images = [IMG, "https://cdn.example.com/b.jpg", "https://cdn.example.com/c.jpg"]
    const res = await POST(
      req({ promoId: "b", channel: "ig-feed", images, caption: "c", group: { kind: "carousel", promoIds: ["a", "b", "c"] } }),
    )
    expect(res.status).toBe(200)
    expect(publishMeta).toHaveBeenCalledTimes(1)
    expect(publishMeta).toHaveBeenCalledWith("ig-feed", expect.anything(), images, "c", null)
    expect(recordPublish).toHaveBeenCalledTimes(3)
    const calls = vi.mocked(recordPublish).mock.calls.map(([a]) => a)
    expect(calls.map((c) => c.promoId).sort()).toEqual(["a", "b", "c"])
    for (const c of calls) expect(c).toMatchObject({ externalId: "post-1", kind: "carousel", status: "published" })
  })

  it("promoId fora do grupo responde 400", async () => {
    const res = await POST(req({ promoId: "z", channel: "ig-feed", images: [IMG, IMG], group: { kind: "carousel", promoIds: ["a", "b"] } }))
    expect(res.status).toBe(400)
    expect(publishMeta).not.toHaveBeenCalled()
  })

  it("site marca a promo no site, revalida e grava kind site", async () => {
    db.promo.findMany.mockResolvedValue([promo("abcdef123", { sitePublished: false, siteSlug: "porto" })])
    const res = await POST(req({ promoId: "abcdef123", channel: "site", images: [] }))
    expect(res.status).toBe(200)
    expect(db.promo.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "abcdef123" }, data: { sitePublished: true } }))
    expect(revalidatePath).toHaveBeenCalledWith("/")
    expect(revalidatePath).toHaveBeenCalledWith("/pacotes/porto")
    expect(revalidatePath).toHaveBeenCalledWith("/black-november")
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "site", kind: "site", status: "published" }))
  })

  it("fb-feed agendado grava scheduled", async () => {
    vi.mocked(publishMeta).mockResolvedValue({ externalId: "fb-1", kind: "post" })
    const when = new Date(Date.now() + 2 * 3_600_000).toISOString()
    const res = await POST(req({ promoId: "a", channel: "fb-feed", images: [IMG], scheduledAt: when }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, status: "scheduled", externalId: "fb-1" })
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ status: "scheduled", scheduledFor: new Date(when) }))
  })

  it("Meta não conectada responde 409 e grava erro", async () => {
    vi.mocked(getMetaConnection).mockResolvedValue(null)
    const res = await POST(req({ promoId: "a", channel: "fb-story", images: [IMG] }))
    expect(res.status).toBe(409)
    expect(publishMeta).not.toHaveBeenCalled()
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "fb-story", status: "error" }))
  })
})

describe("POST /api/publish/shared", () => {
  it("marca o canal do WhatsApp como compartilhado", async () => {
    db.promo.findUnique.mockResolvedValue(promo("a"))
    const res = await SHARED(req({ promoId: "a", channel: "wa-channel" }))
    expect(res.status).toBe(200)
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "wa-channel", kind: "message", status: "shared" }))
  })

  it("recusa canal que não é do WhatsApp", async () => {
    const res = await SHARED(req({ promoId: "a", channel: "ig-feed" }))
    expect(res.status).toBe(400)
  })
})
