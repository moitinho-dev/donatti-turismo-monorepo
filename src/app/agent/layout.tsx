import type React from "react"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import AgentLayoutClient from "./AgentLayoutClient"

export const metadata: Metadata = {
  title: "Área do Agente | Donatti Turismo",
  description: "Sistema de gerenciamento de promoções da Donatti Turismo",
}

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions)

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AgentLayoutClient>{children}</AgentLayoutClient>
    </SidebarProvider>
  )
}
