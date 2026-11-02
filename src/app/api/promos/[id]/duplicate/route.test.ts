import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: { promo: { findUnique: vi.fn(), create: vi.fn() } },
}))
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }))

import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { POST } from "./route"

const db = prisma as unknown as { promo: Record<"findUnique" | "create", ReturnType<typeof vi.fn>> }

const ORIGINAL = {
  id: "p1",
  destino: "Maceió",
  hotel: "Hotel Ponta Verde",
  dataFormatada: "01/03 até 08/03 de 2027",
  valor: "2843.83",
  parcelas: 10,
  comCafe: true,
  semCafe: false,
  meiaPensao: false,
  pensaoCompleta: false,
  allInclusive: false,
  numeroDeNoites: "7",
  sp: true,
  cg: false,
  aereo: true,
  sitePublished: true,
  siteSection: "nacionais",
  siteSlug: "maceio-hotel-ponta-verde",
  siteImage: "https://cdn/x.jpg",
  siteDescription: "Maceió com café",
  siteInclusions: ["Aéreo", "Hotel"],
  siteDepartures: ["01/03"],
  googleBusinessPostName: "accounts/1/locations/2/localPosts/9",
  instagramPostId: "ig-123",
  valorOriginal: "3200.00",
  campaign: "black-friday",
  createdAt: new Date("2026-10-01T10:00:00Z"),
  updatedAt: new Date("2026-10-02T10:00:00Z"),
  createdById: "u1",
}

const call = (id = "p1") =>
  POST(new Request(`http://localhost/api/promos/${id}/duplicate`, { method: "POST" }) as never, { params: Promise.resolve({ id }) })

const session = (id: string, role: "admin" | "agent") => ({ user: { id, role, name: "X", email: "x@donatti.com" } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getServerSession).mockResolvedValue(session("u1", "agent") as never)
  db.promo.findUnique.mockResolvedValue(ORIGINAL)
  db.promo.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    ...ORIGINAL,
    ...data,
    id: "p2",
    googleBusinessPostName: null,
    instagramPostId: null,
    createdAt: new Date("2026-11-02T10:00:00Z"),
    updatedAt: new Date("2026-11-02T10:00:00Z"),
    createdBy: { name: "Ana" },
  }))
})

describe("POST /api/promos/[id]/duplicate", () => {
  it("sem sessão responde 401", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never)
    const res = await call()
    expect(res.status).toBe(401)
    expect(db.promo.create).not.toHaveBeenCalled()
  })

  it("promo inexistente responde 404", async () => {
    db.promo.findUnique.mockResolvedValue(null)
    const res = await call("nao-existe")
    expect(res.status).toBe(404)
    expect(db.promo.create).not.toHaveBeenCalled()
  })

  it("agente não duplica promo de outro (403)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("u2", "agent") as never)
    const res = await call()
    expect(res.status).toBe(403)
    expect(db.promo.create).not.toHaveBeenCalled()
  })

  it("admin duplica promo de qualquer um e vira o dono da cópia", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("adm", "admin") as never)
    const res = await call()
    expect(res.status).toBe(201)
    expect(db.promo.create.mock.calls[0][0].data.createdById).toBe("adm")
  })

  it("copia a oferta, mas sai fora do site e sem posts, artes ou histórico", async () => {
    const res = await call()
    expect(res.status).toBe(201)
    const data = db.promo.create.mock.calls[0][0].data as Record<string, unknown>
    expect(data).toEqual({
      destino: "Maceió",
      hotel: "Hotel Ponta Verde",
      dataFormatada: "01/03 até 08/03 de 2027",
      valor: "2843.83",
      valorOriginal: "3200.00",
      parcelas: 10,
      comCafe: true,
      semCafe: false,
      meiaPensao: false,
      pensaoCompleta: false,
      allInclusive: false,
      numeroDeNoites: "7",
      sp: true,
      cg: false,
      aereo: true,
      siteSection: "nacionais",
      siteDescription: "Maceió com café",
      siteInclusions: ["Aéreo", "Hotel"],
      siteDepartures: ["01/03"],
      siteImage: "https://cdn/x.jpg",
      campaign: "black-friday",
      sitePublished: false,
      siteSlug: null,
      createdById: "u1",
    })
    // Nada de designs nem publishLogs na criação
    expect(Object.keys(data)).not.toContain("designs")
    expect(Object.keys(data)).not.toContain("publishLogs")

    const body = await res.json()
    expect(body).toMatchObject({ id: "p2", DESTINO: "Maceió", SITE_PUBLISHED: false, SITE_SLUG: null, createdBy: "u1", createdByName: "Ana" })
    expect(body).not.toHaveProperty("instagramPostId")
    expect(body).not.toHaveProperty("googleBusinessPostName")
  })
})
