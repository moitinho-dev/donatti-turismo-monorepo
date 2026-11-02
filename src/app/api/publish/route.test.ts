import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: {
    promo: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    publishLog: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/meta", () => {
  class MetaError extends Error {}
  return { MetaError, publishMeta: vi.fn(), getMetaConnection: vi.fn(), appBaseUrl: () => "https://app.donatti.com" }
})
vi.mock("@/lib/googleBusiness", () => ({ publishPromoPost: vi.fn(), getBusinessConnection: vi.fn() }))
vi.mock("../meta/session", () => ({ metaSession: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/siteFields", () => ({ resolveSiteFields: vi.fn() }))
vi.mock("@/lib/publishLog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/publishLog")>()
  return { ...actual, recordPublish: vi.fn() }
})

import prisma from "@/lib/db"
import { MetaError, getMetaConnection, publishMeta } from "@/lib/meta"
import { getBusinessConnection, publishPromoPost } from "@/lib/googleBusiness"
import { recordPublish } from "@/lib/publishLog"
import { revalidatePath } from "next/cache"
import { resolveSiteFields } from "@/lib/siteFields"
import { metaSession } from "../meta/session"
import { GET, POST } from "./route"
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
  createdById: "u1",
  ...extra,
})

const req = (body: unknown) =>
  new Request("http://localhost/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

const IMG = "https://app.donatti.com/api/media/a"
const OTHER = { id: "u2", email: "bia@donatti.com", admin: false }
const ADMIN = { id: "adm", email: "chefe@donatti.com", admin: true }

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.PUBLISH_SIMULATE
  vi.mocked(metaSession).mockResolvedValue({ id: "u1", email: "ana@donatti.com", admin: false })
  vi.mocked(getMetaConnection).mockResolvedValue({ pageId: "p1", pageAccessToken: "t", igUserId: "ig1" } as never)
  vi.mocked(getBusinessConnection).mockResolvedValue({ refreshToken: "r", accountName: "accounts/1", locationName: "accounts/1/locations/2" } as never)
  db.promo.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => where.id.in.map((id) => promo(id)))
  db.publishLog.findFirst.mockResolvedValue(null)
  db.promo.updateMany.mockResolvedValue({ count: 1 })
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
    expect(resolveSiteFields).not.toHaveBeenCalled()
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
    expect(await res.json()).toEqual({ error: "Não foi possível publicar no Instagram feed. Tente de novo em alguns minutos." })
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

  it("grupo com número de artes diferente do de promos responde 400", async () => {
    const res = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG, IMG], group: { kind: "carousel", promoIds: ["a", "b", "c"] } }))
    expect(res.status).toBe(400)
    expect(publishMeta).not.toHaveBeenCalled()
  })

  it("google exige exatamente uma arte", async () => {
    expect((await POST(req({ promoId: "a", channel: "google", images: [] }))).status).toBe(400)
    expect((await POST(req({ promoId: "a", channel: "google", images: [IMG, IMG] }))).status).toBe(400)
    expect(publishPromoPost).not.toHaveBeenCalled()
  })

  it("só aceita artes https e, no Google, só dos hosts do app", async () => {
    const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"
    expect((await POST(req({ promoId: "a", channel: "ig-feed", images: [dataUri] }))).status).toBe(400)
    expect((await POST(req({ promoId: "a", channel: "fb-story", images: ["http://app.donatti.com/x.jpg"] }))).status).toBe(400)
    expect((await POST(req({ promoId: "a", channel: "google", images: ["https://evil.example.com/x.jpg"] }))).status).toBe(400)
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    vi.mocked(publishPromoPost).mockResolvedValue({ name: "n" })
    const ok = await POST(req({ promoId: "a", channel: "google", images: ["https://abc.supabase.co/storage/v1/object/public/x.jpg"] }))
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(ok.status).toBe(200)
    expect(publishMeta).not.toHaveBeenCalled()
    expect(publishPromoPost).toHaveBeenCalledTimes(1)
  })

  it("agente não publica promo de outra pessoa (nem simulando, nem em grupo)", async () => {
    vi.mocked(metaSession).mockResolvedValue(OTHER)
    const single = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG] }))
    expect(single.status).toBe(403)
    expect((await single.json()).error).toBe("Sem permissão para publicar esta promoção")
    process.env.PUBLISH_SIMULATE = "on"
    expect((await POST(req({ promoId: "a", channel: "site", images: [] }))).status).toBe(403)
    delete process.env.PUBLISH_SIMULATE
    // grupo com uma promo dela e duas de outra pessoa
    db.promo.findMany.mockResolvedValue([promo("a", { createdById: "u2" }), promo("b"), promo("c")])
    const grp = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG, IMG, IMG], group: { kind: "carousel", promoIds: ["a", "b", "c"] } }))
    expect(grp.status).toBe(403)
    expect(publishMeta).not.toHaveBeenCalled()
    expect(db.promo.update).not.toHaveBeenCalled()
    expect(recordPublish).not.toHaveBeenCalled()
  })

  it("admin publica promo de outra pessoa", async () => {
    vi.mocked(metaSession).mockResolvedValue(ADMIN)
    vi.mocked(publishMeta).mockResolvedValue({ externalId: "ig-1", kind: "post" })
    const res = await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG] }))
    expect(res.status).toBe(200)
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ createdById: "adm", status: "published" }))
    expect(db.promo.updateMany).toHaveBeenCalledWith({ where: { id: "a" }, data: { instagramPostId: "ig-1" } })
  })

  it("instagramPostId de agente fica preso às promos dele", async () => {
    vi.mocked(publishMeta).mockResolvedValue({ externalId: "ig-2", kind: "post" })
    expect((await POST(req({ promoId: "a", channel: "ig-feed", images: [IMG] }))).status).toBe(200)
    expect(db.promo.updateMany).toHaveBeenCalledWith({ where: { id: "a", createdById: "u1" }, data: { instagramPostId: "ig-2" } })
  })

  it("promoId fora do grupo responde 400", async () => {
    const res = await POST(req({ promoId: "z", channel: "ig-feed", images: [IMG, IMG], group: { kind: "carousel", promoIds: ["a", "b"] } }))
    expect(res.status).toBe(400)
    expect(publishMeta).not.toHaveBeenCalled()
  })

  it("site completa os campos como a lista, marca a promo no site, revalida e grava kind site", async () => {
    db.promo.findMany.mockResolvedValue([promo("abcdef123", { sitePublished: false, siteSlug: null, siteSection: null, siteImage: null })])
    const fields = { sitePublished: true, siteSection: "nordeste", siteSlug: "porto-seguro", siteImage: "https://img.example/porto.jpg" }
    vi.mocked(resolveSiteFields).mockResolvedValue(fields)
    const res = await POST(req({ promoId: "abcdef123", channel: "site", images: [] }))
    expect(res.status).toBe(200)
    expect(resolveSiteFields).toHaveBeenCalledWith({
      id: "abcdef123",
      DESTINO: "Porto Seguro",
      SITE_PUBLISHED: true,
      SITE_SECTION: null,
      SITE_SLUG: null,
      SITE_IMAGE: null,
    })
    expect(db.promo.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "abcdef123" }, data: fields }))
    expect(await res.json()).toEqual({
      ok: true,
      status: "published",
      externalId: null,
      promo: { SITE_PUBLISHED: true, SITE_SECTION: "nordeste", SITE_SLUG: "porto-seguro", SITE_IMAGE: "https://img.example/porto.jpg" },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/")
    expect(revalidatePath).toHaveBeenCalledWith("/pacotes/porto-seguro")
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

describe("GET /api/publish", () => {
  const get = () => GET(new Request("http://localhost/api/publish?promoId=a"))
  beforeEach(() => {
    db.promo.findUnique.mockResolvedValue(promo("a"))
    db.publishLog.findMany.mockResolvedValue([])
  })
  it("dona e admin veem a situação; outro agente recebe 403", async () => {
    const own = await get()
    expect(own.status).toBe(200)
    expect((await own.json())["ig-feed"].state).toBe("none")
    vi.mocked(metaSession).mockResolvedValue(ADMIN)
    expect((await get()).status).toBe(200)
    vi.mocked(metaSession).mockResolvedValue(OTHER)
    expect((await get()).status).toBe(403)
  })
})

describe("POST /api/publish/shared", () => {
  it("marca o canal do WhatsApp como compartilhado", async () => {
    db.promo.findUnique.mockResolvedValue(promo("a"))
    const res = await SHARED(req({ promoId: "a", channel: "wa-channel" }))
    expect(res.status).toBe(200)
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ channel: "wa-channel", kind: "message", status: "shared" }))
  })

  it("outro agente recebe 403; admin pode", async () => {
    db.promo.findUnique.mockResolvedValue(promo("a"))
    vi.mocked(metaSession).mockResolvedValue(OTHER)
    expect((await SHARED(req({ promoId: "a", channel: "wa-status" }))).status).toBe(403)
    expect(recordPublish).not.toHaveBeenCalled()
    vi.mocked(metaSession).mockResolvedValue(ADMIN)
    expect((await SHARED(req({ promoId: "a", channel: "wa-status" }))).status).toBe(200)
    expect(recordPublish).toHaveBeenCalledWith(expect.objectContaining({ kind: "story", status: "shared", createdById: "adm" }))
  })

  it("recusa canal que não é do WhatsApp", async () => {
    const res = await SHARED(req({ promoId: "a", channel: "ig-feed" }))
    expect(res.status).toBe(400)
  })
})
