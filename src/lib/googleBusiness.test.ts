import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  default: {
    googleBusinessConnection: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    promo: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

import prisma from "@/lib/db"
import { autoPickTarget, buildConnectUrl, listAccounts, listLocations, publishPromoPost, upsertRefreshToken } from "./googleBusiness"

const db = prisma as unknown as {
  googleBusinessConnection: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
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

describe("reconexão", () => {
  it("limpa a conta e o local escolhidos antes (pode ser outra conta do Google)", async () => {
    db.googleBusinessConnection.findFirst.mockResolvedValue({ id: "c1", refreshToken: "velho", accountName: "accounts/1", locationName: "locations/2", locationTitle: "Loja" })
    await upsertRefreshToken("novo")
    expect(db.googleBusinessConnection.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { refreshToken: "novo", accountName: null, locationName: null, locationTitle: null },
    })
  })
})

/** Simula o Google: token + páginas de contas e locais (chave = pageToken ou "" para a primeira) */
function mockPages(accounts: Record<string, unknown>, locations: Record<string, unknown>) {
  const urls: URL[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      const u = new URL(String(url))
      urls.push(u)
      if (u.href.startsWith("https://oauth2.googleapis.com/token")) return json(200, { access_token: "tok" })
      const pages = u.hostname.startsWith("mybusinessaccountmanagement") ? accounts : locations
      return json(200, pages[u.searchParams.get("pageToken") || ""] ?? {})
    }),
  )
  return urls
}

describe("listagem paginada", () => {
  it("contas: segue o nextPageToken", async () => {
    mockPages({ "": { accounts: [{ name: "accounts/1" }], nextPageToken: "p2" }, p2: { accounts: [{ name: "accounts/2" }] } }, {})
    expect((await listAccounts()).map((a) => a.name)).toEqual(["accounts/1", "accounts/2"])
  })

  it("locais: 100 por página com nome e título, juntando as páginas", async () => {
    const urls = mockPages(
      {},
      {
        "": { locations: [{ name: "locations/1", title: "A" }], nextPageToken: "p2" },
        p2: { locations: [{ name: "locations/2", title: "B" }], nextPageToken: "p3" },
        p3: { locations: [{ name: "locations/3", title: "C" }] },
      },
    )
    expect((await listLocations("accounts/1")).map((l) => l.title)).toEqual(["A", "B", "C"])
    const calls = urls.filter((u) => u.pathname.endsWith("/locations"))
    expect(calls).toHaveLength(3)
    expect(calls[0].pathname).toBe("/v1/accounts/1/locations")
    expect(calls.every((u) => u.searchParams.get("pageSize") === "100" && u.searchParams.get("readMask") === "name,title")).toBe(true)
  })

  it("para em 10 páginas mesmo se o Google repetir o token", async () => {
    const urls = mockPages({ "": { accounts: [{ name: "accounts/1" }], nextPageToken: "x" }, x: { accounts: [{ name: "accounts/1" }], nextPageToken: "x" } }, {})
    expect(await listAccounts()).toHaveLength(10)
    expect(urls.filter((u) => u.pathname === "/v1/accounts")).toHaveLength(10)
  })
})

describe("escolha automática do local", () => {
  beforeEach(() => {
    db.googleBusinessConnection.findFirst.mockResolvedValue({ id: "c1", refreshToken: "r", accountName: null, locationName: null })
  })

  it("uma conta e um local: salva e devolve o nome", async () => {
    mockPages({ "": { accounts: [{ name: "accounts/1" }] } }, { "": { locations: [{ name: "locations/9", title: "Donatti Campo Grande" }] } })
    expect(await autoPickTarget()).toBe("Donatti Campo Grande")
    expect(db.googleBusinessConnection.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { accountName: "accounts/1", locationName: "locations/9", locationTitle: "Donatti Campo Grande" },
    })
  })

  it("um local na primeira página mas outro na segunda: não escolhe", async () => {
    mockPages(
      { "": { accounts: [{ name: "accounts/1" }] } },
      { "": { locations: [{ name: "locations/9", title: "A" }], nextPageToken: "p2" }, p2: { locations: [{ name: "locations/10", title: "B" }] } },
    )
    expect(await autoPickTarget()).toBeNull()
    expect(db.googleBusinessConnection.update).not.toHaveBeenCalled()
  })

  it("duas contas (em páginas diferentes): não escolhe", async () => {
    mockPages({ "": { accounts: [{ name: "accounts/1" }], nextPageToken: "p2" }, p2: { accounts: [{ name: "accounts/2" }] } }, {})
    expect(await autoPickTarget()).toBeNull()
    expect(db.googleBusinessConnection.update).not.toHaveBeenCalled()
  })

  it("já tem local escolhido: não mexe", async () => {
    db.googleBusinessConnection.findFirst.mockResolvedValue({ id: "c1", refreshToken: "r", accountName: "accounts/1", locationName: "locations/9" })
    const urls = mockPages({}, {})
    expect(await autoPickTarget()).toBeNull()
    expect(urls).toHaveLength(0)
  })
})
