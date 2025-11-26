import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import NewPromosDashboard from "@/components/promos/NewPromosDashboard"

export const metadata: Metadata = {
  title: "Gerenciador de Promocoes | Donatti Turismo",
  description: "Gerencie as promocoes de viagens e pacotes turisticos da Donatti Turismo.",
}

export default async function PromosPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/promos/login")
  }

  return <NewPromosDashboard user={session.user} />
}

