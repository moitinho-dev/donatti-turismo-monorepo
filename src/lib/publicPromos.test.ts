import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ default: { promo: { findFirst: vi.fn(), findMany: vi.fn() } } }))

import prisma from "@/lib/db"
import { findPublishedPromoBySlug } from "./publicPromos"

const mocked = prisma as unknown as {
  promo: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
}

const promo = (over: Record<string, unknown>) => ({
  id: "abc123def456",
  destino: "Porto Seguro",
  siteSlug: null,
  sitePublished: true,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocked.promo.findFirst.mockResolvedValue(null)
  mocked.promo.findMany.mockResolvedValue([])
})

describe("findPublishedPromoBySlug", () => {
  it("acha pelo slug gravado", async () => {
    const p = promo({ siteSlug: "porto-seguro" })
    mocked.promo.findFirst.mockResolvedValue(p)
    expect(await findPublishedPromoBySlug("porto-seguro")).toBe(p)
  })

  it("acha a promo sem slug pelo endereço provisório", async () => {
    const p = promo({})
    mocked.promo.findMany.mockResolvedValue([p])
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(p)
  })

  it("o endereço provisório continua valendo depois que o site grava o slug", async () => {
    const p = promo({ siteSlug: "porto-seguro" })
    mocked.promo.findMany.mockResolvedValue([p])
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(p)
  })

  it("o slug atual de outra promo tem prioridade sobre o provisório", async () => {
    const a = promo({ id: "zzz999aaa", siteSlug: "porto-seguro-abc123" })
    const b = promo({ siteSlug: "porto-seguro" })
    mocked.promo.findMany.mockResolvedValue([b, a])
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(a)
  })

  it("devolve null quando nada bate", async () => {
    mocked.promo.findMany.mockResolvedValue([promo({ siteSlug: "porto-seguro" })])
    expect(await findPublishedPromoBySlug("maceio-xyz")).toBeNull()
  })
})
