"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AgentDashboardContent from "@/components/agent/AgentDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Loader2 } from "lucide-react"

export default function AgentPage() {
  const { data: session, status } = useSession()
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      redirect("/login")
    }

    // Set loading to false when we have the session data
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status])

  // Show loading state while checking authentication
  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  // Only render content when authenticated
  if (!session) {
    return null
  }

  return (
    <DashboardLayout user={session.user}>
      <AgentDashboardContent user={session.user} isAddingNew={isAddingNew} setIsAddingNew={setIsAddingNew} />
    </DashboardLayout>
  )
}
