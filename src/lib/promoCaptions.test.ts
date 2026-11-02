import { describe, it, expect } from "vitest"
import { captionsFor, type CaptionPromo } from "./promoCaptions"

const promo: CaptionPromo = {
  DESTINO: "Maceió",
  HOTEL: "Hotel Ponta Verde",
  DATA_FORMATADA: "01/03 até 08/03 de 2027",
  VALOR: "2843,83",
  PARCELAS: 10,
  NUMERO_DE_NOITES: "7",
  AEREO: true,
  CG: true,
  SITE_SLUG: "maceio-ponta-verde",
}

describe("captionsFor", () => {
  it("Instagram manda para o link na bio e não tem link", () => {
    const c = captionsFor(promo, "Black November")
    expect(c.instagram).toContain("link na bio")
    expect(c.instagram).not.toContain("http")
  })

  it("Facebook leva o link da oferta quando há SITE_SLUG", () => {
    expect(captionsFor(promo, null).facebook).toContain("/pacotes/maceio-ponta-verde")
  })

  it("WhatsApp tem o destino", () => {
    expect(captionsFor(promo, null).whatsapp).toContain("Maceió")
  })

  it("campanha aparece no topo das legendas", () => {
    const c = captionsFor(promo, "Black November")
    expect(c.instagram.startsWith("BLACK NOVEMBER")).toBe(true)
    expect(c.whatsapp).toContain("BLACK NOVEMBER")
  })
})
