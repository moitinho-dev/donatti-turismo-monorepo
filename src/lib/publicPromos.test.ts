import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ default: { promo: { findFirst: vi.fn(), findMany: vi.fn() } } }))

import prisma from "@/lib/db"
import { findPublishedPromoBySlug } from "./publicPromos"

type Row = { id: string; destino: string; siteSlug: string | null; sitePublished: boolean }
type Where = { sitePublished?: boolean; siteSlug?: string }

const mocked = prisma as unknown as {
  promo: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
}

const promo = (over: Partial<Row>): Row => ({ id: "abc123def456", destino: "Porto Seguro", siteSlug: null, sitePublished: true, ...over })

/** Banco falso: respeita o where (sitePublished e siteSlug) como o Prisma */
let rows: Row[] = []
const matches = (where: Where = {}) => (r: Row) =>
  (where.sitePublished === undefined || r.sitePublished === where.sitePublished) && (where.siteSlug === undefined || r.siteSlug === where.siteSlug)

beforeEach(() => {
  vi.clearAllMocks()
  rows = []
  mocked.promo.findFirst.mockImplementation(async ({ where }: { where?: Where } = {}) => rows.find(matches(where)) ?? null)
  mocked.promo.findMany.mockImplementation(async ({ where }: { where?: Where } = {}) => rows.filter(matches(where)))
})

describe("findPublishedPromoBySlug", () => {
  it("acha pelo slug gravado", async () => {
    rows = [promo({ siteSlug: "porto-seguro" })]
    expect(await findPublishedPromoBySlug("porto-seguro")).toBe(rows[0])
  })

  it("acha a promo sem slug pelo endereço provisório", async () => {
    rows = [promo({})]
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(rows[0])
  })

  it("o endereço provisório continua valendo depois que o site grava o slug", async () => {
    rows = [promo({ siteSlug: "porto-seguro" })]
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(rows[0])
  })

  it("o slug atual de outra promo tem prioridade sobre o provisório", async () => {
    const b = promo({ siteSlug: "porto-seguro" })
    const a = promo({ id: "zzz999aaa", siteSlug: "porto-seguro-abc123" })
    rows = [b, a]
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(a)
  })

  it("duas promos com o mesmo endereço provisório: nenhuma (não abre a promo errada)", async () => {
    rows = [promo({ id: "abc123aaaaaa", siteSlug: "porto-seguro" }), promo({ id: "abc123bbbbbb", siteSlug: "porto-seguro-2" })]
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBeNull()
  })

  it("só uma com o endereço provisório: essa", async () => {
    rows = [promo({ id: "abc123aaaaaa", siteSlug: "porto-seguro" }), promo({ id: "abc999bbbbbb", siteSlug: "porto-seguro-2" })]
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(rows[0])
  })

  it("só promos publicadas no site contam", async () => {
    rows = [promo({ sitePublished: false, siteSlug: "porto-seguro" }), promo({ id: "abc123zzzzzz", sitePublished: false })]
    expect(await findPublishedPromoBySlug("porto-seguro")).toBeNull()
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBeNull()
    // A publicada vale mesmo com uma não publicada de mesmo provisório
    rows.push(promo({ id: "abc123yyyyyy", siteSlug: "porto-seguro-3" }))
    expect(await findPublishedPromoBySlug("porto-seguro-abc123")).toBe(rows[2])
  })

  it("devolve null quando nada bate", async () => {
    rows = [promo({ siteSlug: "porto-seguro" })]
    expect(await findPublishedPromoBySlug("maceio-xyz")).toBeNull()
  })
})
