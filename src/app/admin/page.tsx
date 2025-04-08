import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import AdminDashboardContent from "@/components/admin/AdminDashboardContent"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export const metadata: Metadata = {
  title: "Painel Administrativo | Donatti Turismo",
  description: "Gerencie usuários, promoções e estatísticas da Donatti Turismo.",
}

export default async function AdminPage() {
  // Check if user is authenticated and is admin
  const session = await getServerSession(authOptions)

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login")
  }

  // If not admin, redirect to appropriate area
  if (session.user.role !== "admin") {
    redirect("/agent")
  }

  return (
    <DashboardLayout user={session.user}>
      <AdminDashboardContent user={session.user} />
    </DashboardLayout>
  )
}
