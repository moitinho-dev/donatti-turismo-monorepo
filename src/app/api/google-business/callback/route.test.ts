import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieJar = vi.hoisted(() => ({ nonce: undefined as string | undefined }))
const session = vi.hoisted(() => ({ user: null as { id: string; email: string; admin: boolean } | null }))

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "google_oauth_nonce" && cookieJar.nonce ? { value: cookieJar.nonce } : undefined) }),
}))
vi.mock("../../meta/session", () => ({ metaSession: async () => session.user }))
vi.mock("@/lib/db", () => ({ default: {} }))
vi.mock("@/lib/storage", () => ({ storageDriver: () => "db", uploadImage: vi.fn() }))
vi.mock("@/lib/googleBusiness", () => ({
  GOOGLE_NONCE_COOKIE: "google_oauth_nonce",
  exchangeCodeForTokens: vi.fn(),
  upsertRefreshToken: vi.fn(),
  autoPickTarget: vi.fn(),
}))

import { signState } from "@/lib/meta"
import { autoPickTarget, exchangeCodeForTokens, upsertRefreshToken } from "@/lib/googleBusiness"
import { GET } from "./route"

const ADMIN = { id: "u1", email: "admin@donatti.com", admin: true }
const NONCE = "abc123"

const call = async (query: Record<string, string>) => {
  const url = new URL("https://app.donatti.com/api/google-business/callback")
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  const res = await GET(new Request(url))
  const location = new URL(res.headers.get("location")!)
  return { res, location, google: location.searchParams.get("google"), msg: location.searchParams.get("msg") }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AUTH_SECRET = "segredo-de-teste"
  cookieJar.nonce = NONCE
  session.user = ADMIN
  vi.mocked(exchangeCodeForTokens).mockResolvedValue({ refresh_token: "r1" })
  vi.mocked(upsertRefreshToken).mockResolvedValue({} as never)
  vi.mocked(autoPickTarget).mockResolvedValue(undefined)
})

describe("retorno do login do Google", () => {
  it("state válido do mesmo admin: salva o acesso e volta para /promos conectado", async () => {
    const { res, location, google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(location.pathname).toBe("/promos")
    expect(google).toBe("connected")
    expect(exchangeCodeForTokens).toHaveBeenCalledWith("c1")
    expect(upsertRefreshToken).toHaveBeenCalledWith("r1")
    expect(autoPickTarget).toHaveBeenCalled()
    // O nonce vale uma vez só
    expect(res.headers.get("set-cookie")).toMatch(/google_oauth_nonce=;.*Path=\/api\/google-business/i)
  })

  it("sem state não troca o código", async () => {
    const { google, msg } = await call({ code: "c1" })
    expect(google).toBe("error")
    expect(msg).toBe("O link de conexão expirou. Tente de novo.")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("state com assinatura alterada é recusado", async () => {
    const state = signState(ADMIN.email, NONCE)
    const { google } = await call({ code: "c1", state: `${state.slice(0, -2)}xx` })
    expect(google).toBe("error")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("nonce do cookie diferente (outro navegador) é recusado", async () => {
    cookieJar.nonce = "outro"
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("error")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("sem o cookie é recusado", async () => {
    cookieJar.nonce = undefined
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("error")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("state vencido (mais de 15 min) é recusado", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-02T10:00:00Z"))
    const state = signState(ADMIN.email, NONCE)
    vi.setSystemTime(new Date("2026-11-02T10:16:00Z"))
    const { google } = await call({ code: "c1", state })
    vi.useRealTimers()
    expect(google).toBe("error")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("outra pessoa logada não completa a conexão iniciada por um admin", async () => {
    session.user = { id: "u2", email: "outro@donatti.com", admin: true }
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("forbidden")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("quem não é admin não conecta", async () => {
    session.user = { ...ADMIN, admin: false }
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("forbidden")
    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
  })

  it("cancelado no Google: volta com aviso", async () => {
    const { google, msg } = await call({ error: "access_denied" })
    expect(google).toBe("error")
    expect(msg).toBe("A conexão foi cancelada.")
  })

  it("sem acesso permanente: pede para conectar de novo", async () => {
    vi.mocked(exchangeCodeForTokens).mockResolvedValue({ access_token: "a" })
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("incomplete")
    expect(upsertRefreshToken).not.toHaveBeenCalled()
  })

  it("erro na troca do código volta com erro sem detalhe técnico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.mocked(exchangeCodeForTokens).mockRejectedValue(new Error("Token exchange failed 400: invalid_grant"))
    const { google, msg } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("error")
    expect(msg).toBeNull()
  })

  it("falha ao escolher o local sozinho não impede a conexão", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.mocked(autoPickTarget).mockRejectedValue(new Error("quota"))
    const { google } = await call({ code: "c1", state: signState(ADMIN.email, NONCE) })
    expect(google).toBe("connected")
  })
})
