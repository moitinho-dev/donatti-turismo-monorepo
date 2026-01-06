"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

import { LayoutsProvider } from "@/hooks/useLayouts"
import IntercomChat from "@/components/IntercomChat"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LayoutsProvider>
        {children}
        <IntercomChat />
      </LayoutsProvider>
    </SessionProvider>
  )
}
