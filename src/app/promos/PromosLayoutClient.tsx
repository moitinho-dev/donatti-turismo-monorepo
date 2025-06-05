"use client"
import type React from "react"
import { PromoProvider } from "@/providers/PromoProvider"
import { AuthProvider } from "@/providers/AuthProvider"

export default function PromosLayoutClient({
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
