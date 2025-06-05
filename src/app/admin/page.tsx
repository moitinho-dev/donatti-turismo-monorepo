"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AdminDashboardContent from "@/components/admin/AdminDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      redirect("/login")
    }

    // If not admin, redirect to appropriate area
    if (session?.user?.role !== "admin" && status === "authenticated") {
      redirect("/agent")
    }

    // Set loading to false when we have the session data
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status, session])

  // Show loading state while checking authentication
  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  // Only render content when authenticated and is admin
  if (!session || session.user.role !== "admin") {
    return null
  }

  return (
    <DashboardLayout user={session.user}>
      <AdminDashboardContent user={session.user} />
    </DashboardLayout>
  )
}
