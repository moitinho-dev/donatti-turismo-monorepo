import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../../api/auth/[...nextauth]/options"
import LeadsDashboard from "@/components/promos/LeadsDashboard"

export const metadata: Metadata = {
  title: "Leads | Donatti Turismo",
  description: "Gerencie os leads capturados pelo site da Donatti Turismo.",
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/promos/login")
  }

  return <LeadsDashboard user={session.user} />
}
