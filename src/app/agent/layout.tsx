import type React from "react"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/ui/sidebar"
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
    <AgentLayoutClient>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={session.user} />
        <div className="flex-1 md:ml-64">
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AgentLayoutClient>
  )
}
