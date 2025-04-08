"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AgentDashboardContent from "@/components/agent/AgentDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export default function AgentPage() {
  const { data: session, status } = useSession()
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      redirect("/login")
    }
  }, [status])

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div>Loading...</div>
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
