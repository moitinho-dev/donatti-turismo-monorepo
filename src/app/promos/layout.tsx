import type React from "react"
import type { Metadata } from "next"
import PromosLayoutClient from "./PromosLayoutClient"

export const metadata: Metadata = {
  title: "Gerenciador de Promoções | Lemonde Tourisme",
  description: "Sistema de gerenciamento de promoções da Lemonde Tourisme",
}

export default function PromosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PromosLayoutClient>{children}</PromosLayoutClient>
}

