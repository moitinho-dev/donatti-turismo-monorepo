import { describe, it, expect } from "vitest"
import type { Channel } from "@/lib/channels"
import type { ChannelState, PublishState } from "@/lib/publishState"
import {
  NETWORK_ERROR,
  deviceOf,
  friendlyError,
  initialSelection,
  isUploadedUrl,
  publishOrder,
  scheduleError,
  stateLabel,
  toggleChannel,
} from "./publishView"

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

const ALL: Channel[] = ["site", "google", "ig-feed", "ig-story", "fb-feed", "fb-story", "wa-channel", "wa-status"]
const statusOf = (over: Partial<Record<Channel, Partial<ChannelState> & { state: PublishState }>> = {}) =>
  Object.fromEntries(
    ALL.map((c) => [c, { at: null, by: null, error: null, stale: false, state: "none" as PublishState, ...over[c] }]),
  ) as Record<Channel, ChannelState>

describe("initialSelection", () => {
  it("sem post nenhum: todos marcados", () => {
    expect([...initialSelection(statusOf())].sort()).toEqual([...ALL].sort())
  })
  it("publicado, agendado e compartilhado em dia vêm desmarcados; erro, simulado e oferta alterada vêm marcados", () => {
    const s = initialSelection(
      statusOf({
        site: { state: "published" },
        google: { state: "published" },
        "ig-feed": { state: "simulated" },
        "ig-story": { state: "error", error: "x" },
        "fb-feed": { state: "scheduled" },
        "fb-story": { state: "published", stale: true },
        "wa-channel": { state: "shared" },
        "wa-status": { state: "shared", stale: true },
      }),
    )
    expect([...s].sort()).toEqual(["fb-story", "ig-feed", "ig-story", "wa-status"])
  })
  it("site marcado leva o Google, mesmo com o Google em dia", () => {
    const s = initialSelection(statusOf({ google: { state: "published" } }))
    expect(s.has("site") && s.has("google")).toBe(true)
  })
  it("site já no ar: o Google segue a própria situação", () => {
    expect(initialSelection(statusOf({ site: { state: "published" } })).has("google")).toBe(true)
    expect(initialSelection(statusOf({ site: { state: "published" }, google: { state: "published" } })).has("google")).toBe(false)
  })
})

describe("friendlyError", () => {
  it("mantém as mensagens do app e troca erro técnico ou de rede crua", () => {
    expect(friendlyError(NETWORK_ERROR, "Site")).toBe(NETWORK_ERROR)
    expect(friendlyError("Sem permissão para publicar esta promoção", "Site")).toBe("Sem permissão para publicar esta promoção")
    expect(friendlyError("Não foi possível publicar no Instagram feed. Tente de novo em alguns minutos.", "Instagram feed")).toBe(
      "Não foi possível publicar no Instagram feed. Tente de novo em alguns minutos.",
    )
    expect(friendlyError("Failed to fetch", "Site")).toBe("Não foi possível publicar no Site. Tente de novo em alguns minutos.")
    expect(friendlyError("Load failed", "Google")).toBe("Não foi possível publicar no Google. Tente de novo em alguns minutos.")
    expect(friendlyError(null, "Google")).toBe("Não foi possível publicar no Google. Tente de novo em alguns minutos.")
  })
})

describe("isUploadedUrl", () => {
  it("URL já enviada não sobe de novo; data URL sobe", () => {
    expect(isUploadedUrl("https://bucket.s3.amazonaws.com/social/a.jpg")).toBe(true)
    expect(isUploadedUrl("http://localhost:3100/api/media/abc")).toBe(true)
    expect(isUploadedUrl("data:image/jpeg;base64,AAAA")).toBe(false)
  })
})
