import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../../api/auth/[...nextauth]/options"
import BlackFridayLanding from "@/components/blackfriday/BlackFridayLanding"
import { getBlackFridayPhase, isBlackFridayActive } from "@/config/blackFriday"
import { getBlackFridaySettings } from "@/lib/blackFridaySettings"
import { getBlackFridayPromos } from "@/lib/publicPromos"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Pré-visualização Black Friday", robots: { index: false, follow: false } }

/** A equipe vê a página da Black mesmo desligada, para revisar antes de ativar */
export default async function BlackFridayPreviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/promos/login")
  const settings = await getBlackFridaySettings()
  const promos = await getBlackFridayPromos().catch(() => [])
  const preview = !isBlackFridayActive(getBlackFridayPhase(settings))
  // Desligada, a pré-visualização mostra como fica ligada
  return <BlackFridayLanding settings={preview ? { ...settings, enabled: true } : settings} promos={promos} preview={preview} />
}
