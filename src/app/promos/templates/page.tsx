import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../../api/auth/[...nextauth]/options"
import TemplateManager from "@/components/promos/TemplateManager"

export const metadata: Metadata = {
  title: "Templates | Donatti Turismo",
  description: "Gerencie os templates de promoções da Donatti Turismo.",
}

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/promos/login")
  }

  return <TemplateManager />
}
