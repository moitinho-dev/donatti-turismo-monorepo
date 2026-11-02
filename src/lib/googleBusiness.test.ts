import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: {
    googleBusinessConnection: { findFirst: vi.fn() },
    promo: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

import prisma from "@/lib/db"
import { buildConnectUrl, publishPromoPost } from "./googleBusiness"

const db = prisma as unknown as {
  googleBusinessConnection: { findFirst: ReturnType<typeof vi.fn> }
  promo: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

const OLD = "accounts/1/locations/2/localPosts/old"
const NEW = "accounts/1/locations/2/localPosts/new"
const ART = "https://app.donatti.com/api/media/arte"

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

/** Responde token, DELETE e criação na ordem em que o Google é chamado */
function mockGoogle(deleteStatus: number, createStatus: number) {
  const calls: { url: string; method: string; body?: string }[] = []
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = String(url)
    const method = init?.method || "GET"
    calls.push({ url: u, method, body: typeof init?.body === "string" ? init.body : undefined })
    if (u.startsWith("https://oauth2.googleapis.com/token")) return json(200, { access_token: "tok" })
    if (method === "DELETE") return json(deleteStatus, {})
    return createStatus === 200 ? json(200, { name: NEW }) : json(createStatus, { error: "falhou" })
  })
  vi.stubGlobal("fetch", fetchMock)
  return calls
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GOOGLE_ID_CLIENT = "id"
  process.env.GOOGLE_ID_CLIENT_SECRET = "secret"
  db.googleBusinessConnection.findFirst.mockResolvedValue({ refreshToken: "r", accountName: "accounts/1", locationName: "accounts/1/locations/2" })
  db.promo.findUnique.mockResolvedValue({
    id: "p1",
    destino: "Porto Seguro",
    hotel: "Hotel X",
    dataFormatada: "10/11",
    numeroDeNoites: "5",
    siteDepartures: [],
    sp: true,
    cg: false,
    sitePublished: true,
    siteImage: "https://cdn.example.com/site.jpg",
    googleBusinessPostName: OLD,
  })
  db.promo.update.mockResolvedValue({})
})

afterEach(() => vi.unstubAllGlobals())

describe("publishPromoPost com replace", () => {
  const isCreate = (c: { url: string; method: string }) => c.method === "POST" && c.url.includes("/localPosts")

  it("cria o post novo com a arte, grava o nome e só depois apaga o antigo", async () => {
    const calls = mockGoogle(200, 200)
    expect(await publishPromoPost("p1", { imageUrl: ART, replace: true })).toEqual({ name: NEW })
    const createAt = calls.findIndex(isCreate)
    const delAt = calls.findIndex((c) => c.method === "DELETE")
    expect(createAt).toBeGreaterThan(-1)
    expect(delAt).toBeGreaterThan(createAt)
    expect(calls[delAt].url).toBe(`https://mybusiness.googleapis.com/v4/${OLD}`)
    expect(JSON.parse(calls[createAt].body!).media).toEqual([{ mediaFormat: "PHOTO", sourceUrl: ART }])
    expect(db.promo.update).toHaveBeenCalledTimes(1)
    expect(db.promo.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { googleBusinessPostName: NEW } })
  })

  it("DELETE do antigo com 404 é ignorado", async () => {
    mockGoogle(404, 200)
    expect(await publishPromoPost("p1", { imageUrl: ART, replace: true })).toEqual({ name: NEW })
    expect(db.promo.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { googleBusinessPostName: NEW } })
  })

  it("DELETE do antigo falhando registra o erro mas a publicação dá certo", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockGoogle(403, 200)
    expect(await publishPromoPost("p1", { imageUrl: ART, replace: true })).toEqual({ name: NEW })
    expect(db.promo.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { googleBusinessPostName: NEW } })
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it("criação falhando não apaga o antigo nem mexe na promo", async () => {
    const calls = mockGoogle(200, 500)
    await expect(publishPromoPost("p1", { imageUrl: ART, replace: true })).rejects.toThrow(/500/)
    expect(calls.some((c) => c.method === "DELETE")).toBe(false)
    expect(db.promo.update).not.toHaveBeenCalled()
  })

  it("sem replace e já postado, não chama o Google", async () => {
    const calls = mockGoogle(200, 200)
    expect(await publishPromoPost("p1")).toEqual({ name: OLD, skipped: true })
    expect(calls.some((c) => c.url.startsWith("https://mybusiness.googleapis.com"))).toBe(false)
  })
})

describe("link de conexão do Google", () => {
  it("leva o state e a URL de retorno do painel", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.donatti.com/"
    const url = new URL(buildConnectUrl("st.ate"))
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth")
    expect(url.searchParams.get("state")).toBe("st.ate")
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.donatti.com/api/google-business/callback")
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/business.manage")
    delete process.env.NEXT_PUBLIC_APP_URL
  })
})
