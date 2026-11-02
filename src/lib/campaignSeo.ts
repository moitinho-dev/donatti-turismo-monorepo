import type { Metadata } from "next"
import type { PublicPromo } from "@/components/home/RealTimePromos"
import { CAMPAIGN_NAME, type BlackFridaySettings } from "@/config/blackFriday"
import { campaignFaqs, discountOf } from "@/lib/campaign"
import { pageMeta } from "@/lib/seo"
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"
import { getPriceNumber } from "@/lib/utils"

/**
 * SEO da Black November. A campanha ocupa a raiz do site ("/") enquanto está ligada,
 * então canonical, og:url e o JSON-LD apontam para "/".
 */
export const CAMPAIGN_OG_IMAGE = "/images/black-november/og-black-november.jpg"

export function campaignTexts(maxDiscount: number) {
  // "Black Friday" fica no título: é o que as pessoas buscam; Black November é o nome da campanha
  const title = `${CAMPAIGN_NAME} Donatti: Black Friday de viagens com até ${maxDiscount}% OFF`
  const description =
    "Black Friday de pacotes com aéreo e hotel o mês de novembro inteiro, saindo de Campo Grande e São Paulo. Desconto já no preço, parcelado no cartão e atendimento no WhatsApp."
  return { title, description }
}

export function campaignMetadata(settings: BlackFridaySettings): Metadata {
  const { title, description } = campaignTexts(settings.maxDiscount)
  return {
    title: { absolute: title },
    description,
    keywords: ["black friday viagem", "black november", "pacotes de viagem black friday", "pacote de viagem campo grande", "promoção de viagem"],
    ...pageMeta({ title, description, path: "/", image: CAMPAIGN_OG_IMAGE, imageAlt: `${CAMPAIGN_NAME} Donatti Turismo` }),
  }
}

/** Dados estruturados: o evento de venda, as ofertas e as dúvidas (Google e respostas de IA) */
export function campaignJsonLd(settings: BlackFridaySettings, promos: PublicPromo[]) {
  const { description } = campaignTexts(settings.maxDiscount)
  const url = SITE_URL
  return [
    {
      "@context": "https://schema.org",
      "@type": "SaleEvent",
      name: `${CAMPAIGN_NAME} ${SITE_NAME}`,
      description,
      url,
      image: absoluteUrl(CAMPAIGN_OG_IMAGE),
      startDate: settings.startsAt,
      endDate: settings.endsAt,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url },
      organizer: { "@type": "TravelAgency", name: SITE_NAME, url: SITE_URL },
      offers: promos.slice(0, 20).map((p) => ({
        "@type": "Offer",
        name: `${p.DESTINO}${p.HOTEL ? ` · ${p.HOTEL}` : ""} (${p.DATA_FORMATADA})`,
        url: p.SITE_SLUG ? `${SITE_URL}/pacotes/${p.SITE_SLUG}` : url,
        price: getPriceNumber(p.VALOR).toFixed(2),
        priceCurrency: "BRL",
        availability: "https://schema.org/LimitedAvailability",
        validFrom: settings.startsAt,
        validThrough: settings.endsAt,
        ...(discountOf(p) > 0 ? { description: `${discountOf(p)}% de desconto` } : {}),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: campaignFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: SITE_URL }],
    },
  ]
}
