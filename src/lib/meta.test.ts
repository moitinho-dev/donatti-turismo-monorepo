import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./db", () => ({ default: {} }))
vi.mock("./storage", () => ({ storageDriver: () => "db", uploadImage: vi.fn() }))

import { signState, verifyState } from "./meta"

const SECRETS = ["AUTH_SECRET", "NEXTAUTH_SECRET", "META_APP_SECRET"] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of SECRETS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})
afterEach(() => {
  for (const k of SECRETS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("state do login (Meta e Google)", () => {
  it("com segredo: assina e confere o e-mail de quem iniciou", () => {
    process.env.AUTH_SECRET = "s"
    expect(verifyState(signState("a@donatti.com", "n1"), "n1")).toBe("a@donatti.com")
    expect(verifyState(signState("a@donatti.com", "n1"), "n2")).toBeNull()
  })

  it("sem segredo: não assina nem aceita state", () => {
    expect(() => signState("a@donatti.com", "n1")).toThrow("Segredo de sessão ausente")
    expect(() => verifyState("1.n1.YQ.sig", "n1")).toThrow("Segredo de sessão ausente")
  })

  it("state assinado com outro segredo é recusado", () => {
    process.env.AUTH_SECRET = "um"
    const state = signState("a@donatti.com", "n1")
    process.env.AUTH_SECRET = "outro"
    expect(verifyState(state, "n1")).toBeNull()
  })
})
