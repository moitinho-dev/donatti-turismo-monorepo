import BlackFridayLanding from "@/components/blackfriday/BlackFridayLanding"
import { JsonLd } from "@/components/seo/JsonLd"
import type { BlackFridaySettings } from "@/config/blackFriday"
import { campaignJsonLd } from "@/lib/campaignSeo"
import { devPublicPromos } from "@/lib/devPromos"
import { getBlackFridayPromos } from "@/lib/publicPromos"

/** Ofertas da campanha; sem banco (build/dev) cai nas promos de exemplo */
export const loadCampaignPromos = () => getBlackFridayPromos().catch(() => devPublicPromos())

/** Página da Black November na raiz do site ("/"), com o JSON-LD da campanha */
export async function CampaignPage({ settings }: { settings: BlackFridaySettings }) {
  const promos = await loadCampaignPromos()
  return (
    <>
      <JsonLd data={campaignJsonLd(settings, promos)} />
      <BlackFridayLanding settings={settings} promos={promos} />
    </>
  )
}
