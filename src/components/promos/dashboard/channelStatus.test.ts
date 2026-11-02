import { describe, expect, it } from "vitest"
import { cardChannels, toneOf } from "./channelStatus"

const byId = (list: ReturnType<typeof cardChannels>) => Object.fromEntries(list.map((c) => [c.channel, c]))

describe("cardChannels", () => {
  it("devolve os 8 canais na ordem, sem registro = cinza", () => {
    const list = cardChannels(undefined, false)
    expect(list.map((c) => c.channel)).toEqual(["site", "google", "ig-feed", "ig-story", "fb-feed", "fb-story", "wa-channel", "wa-status"])
    expect(list.every((c) => c.tone === "none")).toBe(true)
    expect(list[0].text).toBe("Site: não publicado")
  })

  it("cores: publicado/agendado/compartilhado verde, simulado violeta, erro vermelho", () => {
    expect(["published", "scheduled", "shared"].map((s) => toneOf(s as never))).toEqual(["ok", "ok", "ok"])
    expect(toneOf("simulated")).toBe("simulated")
    expect(toneOf("error")).toBe("error")
    expect(toneOf("none")).toBe("none")
    const c = byId(cardChannels({ google: "simulated", "ig-feed": "error", "fb-feed": "scheduled" }, true))
    expect(c.google).toMatchObject({ tone: "simulated", text: "Google: simulado" })
    expect(c["ig-feed"]).toMatchObject({ tone: "error", text: "Instagram feed: erro ao publicar" })
    expect(c["fb-feed"]).toMatchObject({ tone: "ok", text: "Facebook feed: agendado" })
  })

  it("Site segue a promo: no site é publicado mesmo sem registro; fora do site não conta registro antigo", () => {
    expect(byId(cardChannels({}, true)).site).toMatchObject({ state: "published", text: "Site: publicado" })
    expect(byId(cardChannels({ site: "published" }, false)).site.state).toBe("none")
    expect(byId(cardChannels({ site: "simulated" }, false)).site.state).toBe("simulated")
    expect(byId(cardChannels({ site: "error" }, false)).site.state).toBe("error")
  })
})
