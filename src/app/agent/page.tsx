import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import AgentDashboardContent from "@/components/agent/AgentDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export const metadata: Metadata = {
  title: "Painel do Agente | Donatti Turismo",
  description: "Gerencie as promoções de viagens e pacotes turísticos da Donatti Turismo.",
}

export default async function AgentPage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions)

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardLayout user={session.user} onAddNew={() => {}}>
      <AgentDashboardContent user={session.user} />
    </DashboardLayout>
  )
}
