import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BlackFridayLanding from "@/components/blackfriday/BlackFridayLanding"
import { campaignFaqs, discountOf } from "@/lib/campaign"
import { JsonLd } from "@/components/seo/JsonLd"
import { CAMPAIGN_NAME, CAMPAIGN_PATH, getBlackFridayPhase, isBlackFridayActive } from "@/config/blackFriday"
import { getBlackFridaySettings } from "@/lib/blackFridaySettings"
import { devPublicPromos } from "@/lib/devPromos"
import { getBlackFridayPromos } from "@/lib/publicPromos"
import { pageMeta } from "@/lib/seo"
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"
import { getPriceNumber } from "@/lib/utils"

// Ligar, desligar ou mudar datas no painel revalida esta página na hora (api/black-friday).
// O revalidate cobre a virada de fase pelas datas (esquenta → ao vivo → encerrada).
export const revalidate = 300

const OG_IMAGE = "/images/black-november/og-black-november.jpg"

function texts(maxDiscount: number) {
  // "Black Friday" fica no título: é o que as pessoas buscam; Black November é o nome da campanha
  const title = `${CAMPAIGN_NAME} Donatti: Black Friday de viagens com até ${maxDiscount}% OFF`
  const description =
    "Black Friday de pacotes com aéreo e hotel o mês de novembro inteiro, saindo de Campo Grande e São Paulo. Desconto já no preço, parcelado no cartão e atendimento no WhatsApp."
  return { title, description }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlackFridaySettings()
  const { title, description } = texts(settings.maxDiscount)
  return {
    title: { absolute: title },
    description,
    keywords: ["black friday viagem", "black november", "pacotes de viagem black friday", "pacote de viagem campo grande", "promoção de viagem"],
    ...pageMeta({ title, description, path: CAMPAIGN_PATH, image: OG_IMAGE, imageAlt: `${CAMPAIGN_NAME} Donatti Turismo` }),
  }
}

export default async function BlackNovemberPage() {
  const settings = await getBlackFridaySettings()
  // Página desligada ou campanha encerrada: o cliente cai na home
  if (!isBlackFridayActive(getBlackFridayPhase(settings))) redirect("/")
  const promos = await getBlackFridayPromos().catch(() => devPublicPromos())
  const { title, description } = texts(settings.maxDiscount)

  // Dados estruturados: o evento de venda, as ofertas e as dúvidas (Google e respostas de IA)
  const url = `${SITE_URL}${CAMPAIGN_PATH}`
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SaleEvent",
      name: `${CAMPAIGN_NAME} ${SITE_NAME}`,
      description,
      url,
      image: absoluteUrl(OG_IMAGE),
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
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    },
  ]

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlackFridayLanding settings={settings} promos={promos} />
    </>
  )
}
