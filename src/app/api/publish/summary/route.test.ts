import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: {
    promo: { findMany: vi.fn() },
    publishLog: { findMany: vi.fn() },
  },
}))
vi.mock("../../meta/session", () => ({ metaSession: vi.fn() }))

import prisma from "@/lib/db"
import { metaSession } from "../../meta/session"
import { GET } from "./route"

const db = prisma as unknown as {
  promo: { findMany: ReturnType<typeof vi.fn> }
  publishLog: { findMany: ReturnType<typeof vi.fn> }
}

const FUTURE = "10/01 até 17/01 de 2099"
const PAST = "10/01 até 17/01 de 2001"
const at = (s: string) => new Date(`2026-11-0${s}T12:00:00Z`)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(metaSession).mockResolvedValue({ id: "u1", email: "ana@donatti.com", admin: false })
  db.promo.findMany.mockResolvedValue([
    { id: "a", dataFormatada: FUTURE },
    { id: "b", dataFormatada: FUTURE },
    { id: "velha", dataFormatada: PAST },
  ])
  db.publishLog.findMany.mockResolvedValue([])
})

describe("GET /api/publish/summary", () => {
  it("sem sessão responde 401", async () => {
    vi.mocked(metaSession).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(db.promo.findMany).not.toHaveBeenCalled()
  })

  it("dois logs da mesma promo e canal: vale o mais novo", async () => {
    // O mais antigo vem primeiro de propósito: a rota não depende da ordem do banco
    db.publishLog.findMany.mockResolvedValue([
      { promoId: "a", channel: "google", status: "error", createdAt: at("1") },
      { promoId: "a", channel: "google", status: "simulated", createdAt: at("2") },
      { promoId: "a", channel: "site", status: "published", createdAt: at("1") },
      { promoId: "b", channel: "ig-feed", status: "published", createdAt: at("2") },
      { promoId: "b", channel: "ig-feed", status: "error", createdAt: at("1") },
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      a: { google: "simulated", site: "published" },
      b: { "ig-feed": "published" },
    })
  })

  it("agente vê só as próprias promos e as vencidas ficam de fora; uma consulta só nos registros", async () => {
    await GET()
    expect(db.promo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { createdById: "u1" } }))
    expect(db.publishLog.findMany).toHaveBeenCalledTimes(1)
    const arg = db.publishLog.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ promoId: { in: ["a", "b"] } })
    expect(arg.distinct).toEqual(["promoId", "channel"])
    expect(arg.orderBy).toEqual({ createdAt: "desc" })
  })

  it("admin vê as promos de todos", async () => {
    vi.mocked(metaSession).mockResolvedValue({ id: "adm", email: "chefe@donatti.com", admin: true })
    await GET()
    expect(db.promo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })

  it("promo sem registro aparece vazia; canal desconhecido é ignorado", async () => {
    db.publishLog.findMany.mockResolvedValue([{ promoId: "a", channel: "tiktok", status: "published", createdAt: at("1") }])
    const res = await GET()
    expect(await res.json()).toEqual({ a: {}, b: {} })
  })

  it("sem promos não consulta os registros", async () => {
    db.promo.findMany.mockResolvedValue([])
    const res = await GET()
    expect(await res.json()).toEqual({})
    expect(db.publishLog.findMany).not.toHaveBeenCalled()
  })
})
