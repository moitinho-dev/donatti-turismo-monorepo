"use client"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AdminDashboardContent from "@/components/admin/AdminDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export default function AdminPage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      redirect("/login")
    }

    // If not admin, redirect to appropriate area
    if (session?.user?.role !== "admin") {
      redirect("/agent")
    }
  }, [status, session])

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div>Loading...</div>
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
