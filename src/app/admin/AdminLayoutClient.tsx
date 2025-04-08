"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { SessionProvider, useSession } from "next-auth/react"
import { Sidebar } from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"

function AdminContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={session.user} />
      <div className="flex-1 md:ml-64">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminContent>{children}</AdminContent>
    </SessionProvider>
  )
}
