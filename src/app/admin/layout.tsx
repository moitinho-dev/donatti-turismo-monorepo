import type React from "react"
import type { Metadata } from "next"
import { PromoProvider } from "@/providers/PromoProvider"
import { AuthProvider } from "@/providers/AuthProvider"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Área Administrativa",
  description: "Sistema de gerenciamento administrativo da Donatti Turismo",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <PromoProvider>{children}</PromoProvider>
    </AuthProvider>
  )
}

