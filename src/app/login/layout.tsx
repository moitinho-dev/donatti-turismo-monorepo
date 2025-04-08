"use client"
import { AuthProvider } from "@/providers/AuthProvider"
import type { ReactNode } from "react"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
