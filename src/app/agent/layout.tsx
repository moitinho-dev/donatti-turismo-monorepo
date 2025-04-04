import type React from "react"
import type { Metadata } from "next"
import AgentLayoutClient from "./AgentLayoutClient"

export const metadata: Metadata = {
  title: "Área do Agente | Donatti Turismo",
  description: "Sistema de gerenciamento de promoções da Donatti Turismo",
}

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>
}

