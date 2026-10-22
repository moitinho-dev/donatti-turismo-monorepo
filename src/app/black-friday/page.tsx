import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BlackFridayLanding from "@/components/blackfriday/BlackFridayLanding"
import { getBlackFridayPhase, isBlackFridayActive } from "@/config/blackFriday"
import { getBlackFridaySettings } from "@/lib/blackFridaySettings"
import { getBlackFridayPromos } from "@/lib/publicPromos"
import { pageMeta } from "@/lib/seo"

// Ligar, desligar ou mudar datas no painel revalida esta página na hora (api/black-friday).
// O revalidate cobre a virada de fase pelas datas (esquenta → ao vivo → encerrada).
export const revalidate = 300

const title = "Black Friday Donatti Turismo: pacotes com até 40% OFF"
const description =
  "Black Friday de pacotes com aéreo e hotel saindo de Campo Grande e São Paulo. Desconto já no preço, parcelado no cartão e atendimento no WhatsApp."

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlackFridaySettings()
  const t = title.replace("40%", `${settings.maxDiscount}%`)
  return { title: { absolute: t }, description, ...pageMeta({ title: t, description, path: "/black-friday" }) }
}

export default async function BlackFridayPage() {
  const settings = await getBlackFridaySettings()
  // Página desligada ou campanha encerrada: o cliente cai na home
  if (!isBlackFridayActive(getBlackFridayPhase(settings))) redirect("/")
  const promos = await getBlackFridayPromos().catch(() => [])
  return <BlackFridayLanding settings={settings} promos={promos} />
}
