"use client"
import { AuthProvider } from "@/providers/AuthProvider"
import type { ReactNode } from "react"

export default function PromosLoginLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

