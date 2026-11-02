import { describe, expect, it } from "vitest"
import type { PublicPromo } from "@/components/home/RealTimePromos"
import type { BlackFridaySettings } from "@/config/blackFriday"
import { CAMPAIGN_OG_IMAGE, campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo"
import { SITE_URL } from "@/lib/site"

const settings: BlackFridaySettings = {
  enabled: true,
  startsAt: "2026-11-01T04:00:00.000Z",
  endsAt: "2026-12-01T03:59:59.000Z",
  maxDiscount: 40,
}

const promo = (over: Partial<PublicPromo> = {}): PublicPromo => ({
  id: "p1",
  DATA_FORMATADA: "10/02 a 15/02",
  DESTINO: "Maceió - AL",
  HOTEL: "Hotel Ponta Verde",
  VALOR: "2.237,00",
  ...over,
})

describe("campaignMetadata", () => {
  it("usa a raiz como canonical e og:url, com a imagem da campanha", () => {
    const meta = campaignMetadata(settings)
    expect(meta.title).toEqual({ absolute: "Black November Donatti: Black Friday de viagens com até 40% OFF" })
    expect(meta.alternates?.canonical).toBe("/")
    expect(meta.openGraph?.url).toBe("/")
    expect(JSON.stringify(meta.openGraph?.images)).toContain(CAMPAIGN_OG_IMAGE)
  })
})

describe("campaignJsonLd", () => {
  const [sale, faq, breadcrumb] = campaignJsonLd(settings, [promo({ SITE_SLUG: "maceio", VALOR_ORIGINAL: "3.000,00" }), promo()])

  it("o evento de venda aponta para a raiz e lista as ofertas", () => {
    expect(sale["@type"]).toBe("SaleEvent")
    expect(sale.url).toBe(SITE_URL)
    expect(sale.offers).toHaveLength(2)
    expect(sale.offers?.[0]).toMatchObject({ url: `${SITE_URL}/pacotes/maceio`, price: "2237.00", description: "25% de desconto" })
    // Sem slug, a oferta aponta para a página da campanha (a raiz)
    expect(sale.offers?.[1]).toMatchObject({ url: SITE_URL })
    expect(sale.offers?.[1]).not.toHaveProperty("description")
  })

  it("inclui as dúvidas frequentes", () => {
    expect(faq["@type"]).toBe("FAQPage")
    expect(faq.mainEntity?.length).toBeGreaterThan(0)
  })

  it("breadcrumb só tem o Início", () => {
    expect(breadcrumb.itemListElement).toEqual([{ "@type": "ListItem", position: 1, name: "Início", item: SITE_URL }])
  })
})
