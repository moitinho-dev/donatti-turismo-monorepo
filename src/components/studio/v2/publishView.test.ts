import { describe, it, expect } from "vitest"
import { deviceOf, publishOrder, scheduleError, stateLabel, toggleChannel } from "./publishView"

const base = { at: "2026-11-02T17:30:00.000Z", by: "Ana", error: null, stale: false }

describe("stateLabel", () => {
  it("mostra cada situação", () => {
    expect(stateLabel(undefined)).toBe("—")
    expect(stateLabel({ ...base, state: "none" })).toBe("—")
    expect(stateLabel({ ...base, state: "published" })).toMatch(/^✓ publicado \d\d\/\d\d às \d\d:\d\d por Ana$/)
    expect(stateLabel({ ...base, state: "scheduled", scheduledFor: "2026-11-20T15:00:00.000Z" })).toMatch(/^Agendado para 20\/11 às/)
    expect(stateLabel({ ...base, state: "shared" })).toMatch(/^Compartilhado \d\d\/\d\d/)
    expect(stateLabel({ ...base, state: "simulated" })).toBe("Simulado")
    expect(stateLabel({ ...base, state: "error", error: "Publique no site antes" })).toBe("Erro: Publique no site antes")
    expect(stateLabel({ ...base, state: "error", error: "Google API error 400: {...}" }, "Google")).toBe(
      "Erro: Não foi possível publicar no Google. Tente de novo em alguns minutos.",
    )
  })
})

describe("publishOrder", () => {
  it("site, Google e depois os demais; sem WhatsApp", () => {
    expect(publishOrder(["fb-feed", "google", "wa-channel", "site", "ig-story"])).toEqual(["site", "google", "ig-story", "fb-feed"])
  })
})

describe("toggleChannel", () => {
  it("site marcado prende o Google", () => {
    const s = toggleChannel(new Set(), "site")
    expect([...s].sort()).toEqual(["google", "site"])
    expect(toggleChannel(s, "google").has("google")).toBe(true)
    const off = toggleChannel(s, "site")
    expect(off.has("google")).toBe(true)
    expect(toggleChannel(off, "google").has("google")).toBe(false)
  })
})

describe("deviceOf", () => {
  it("separa Android, iPhone e computador", () => {
    expect(deviceOf("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("android")
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios")
    expect(deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", true)).toBe("ios")
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop")
  })
})

describe("scheduleError", () => {
  const now = new Date("2026-11-02T12:00:00").getTime()
  it("aceita entre 10 minutos e 30 dias", () => {
    expect(scheduleError("2026-11-02T12:30", now)).toBeNull()
    expect(scheduleError("2026-11-02T12:05", now)).toMatch(/10 minutos/)
    expect(scheduleError("2026-12-10T12:00", now)).toMatch(/30 dias/)
    expect(scheduleError("", now)).toBe("Escolha a data e a hora")
  })
})
