"use client"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { AdminHeader } from "./AdminHeader"
import { UsersList } from "./UsersList"
import { UserForm } from "./UserForm"
import { UserStats } from "./UserStats"
import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { Loader2, Plus, FileText, BarChart2, Users, UserPlus, Edit } from "lucide-react"

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AdminDashboardProps {
  user: User
}

// Melhorar o design do dashboard administrativo
export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [promos, setPromos] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    fetchPromos()
    fetchUsers()
    fetchUserStats()
    fetchStats()
  }, [])

  const fetchPromos = async () => {
    setIsLoading(true)
    try {
      let url = "/api/promos"

      // Add date range filter if provided
      if (dateRange.from && dateRange.to) {
        const startDateStr = dateRange.from.toISOString().split("T")[0]
        const endDateStr = dateRange.to.toISOString().split("T")[0]
        url += `?startDate=${startDateStr}&endDate=${endDateStr}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch promos")
      const data = await response.json()
      setPromos(data)
    } catch (err) {
      console.error("Error fetching promos:", err)
      setError("Erro ao buscar promoções")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Erro ao buscar usuários")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/users/stats")
      if (!response.ok) throw new Error("Failed to fetch user stats")
      const data = await response.json()
      setUserStats(data)
    } catch (err) {
      console.error("Error fetching user stats:", err)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/promos/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleEditPromo = (promo: any) => {
    setSelectedPromo(promo)
    setActiveTab("edit-promo")
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setActiveTab("edit-user")
  }

  const handleAddUserClick = () => {
    setSelectedUser(null)
    setActiveTab("add-user")
  }

  const handleFormSubmitSuccess = () => {
    fetchPromos()
    fetchStats()
    fetchUsers()
    fetchUserStats()
    setActiveTab("dashboard")
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)

    // If both dates are selected, filter promos
    if (range.from && range.to) {
      fetchPromos()
    } else {
      fetchPromos()
    }
  }

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    fetchPromos()
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={user} onSignOut={handleSignOut} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-blue mb-2 font-mon">Painel Administrativo</h1>
            <p className="text-gray-600 font-mon">Gerencie usuários, promoções e visualize estatísticas do sistema</p>
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={handleAddUserClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
            >
              <UserPlus className="h-4 w-4" />
              <span>Novo Usuário</span>
            </button>
            <button
              onClick={() => setActiveTab("add-promo")}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Promoção</span>
            </button>

            <CSVExport dateRange={dateRange} />
          </div>
        </div>

        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={handleClearFilters}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 space-y-6">
            <div className="bg-card rounded-lg shadow-md p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "dashboard" ? "bg-primary-blue text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "users" ? "bg-primary-blue text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Usuários</span>
                </button>
                <button
                  onClick={() => setActiveTab("promos")}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "promos" ? "bg-primary-blue text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Promoções</span>
                </button>
                <button
                  onClick={() => setActiveTab("add-promo")}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "add-promo" ? "bg-primary-blue text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Promoção</span>
                </button>
                <button
                  onClick={handleAddUserClick}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "add-user" ? "bg-primary-blue text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Novo Usuário</span>
                </button>
                {activeTab === "edit-promo" && (
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary-blue text-white">
                    <Edit className="h-4 w-4" />
                    <span>Editar Promoção</span>
                  </button>
                )}
              </nav>
            </div>

            {stats && (
              <div className="bg-card rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-sm text-gray-500 mb-3">Resumo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Promoções</span>
                    <span className="font-semibold text-primary-blue">{stats.overall.totalPromos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Destinos Únicos</span>
                    <span className="font-semibold text-second-blue">{stats.overall.uniqueDestinations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Médio</span>
                    <span className="font-semibold text-primary-orange">
                      {stats.overall.averageValue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-9">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2 text-gray-600 font-mon">Carregando dados...</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-card rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-bold text-primary-blue mb-6 font-mon">Desempenho dos Agentes</h2>
                      <UserStats userStats={userStats} />
                    </div>

                    <div className="bg-card rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-bold text-primary-blue mb-6 font-mon">Estatísticas de Promoções</h2>
                      <PromoStats stats={stats} detailed />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-card rounded-lg shadow-md">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2 text-gray-600 font-mon">Carregando usuários...</span>
                  </div>
                ) : (
                  <UsersList users={users} onEdit={handleEditUser} onRefresh={fetchUsers} />
                )}
              </div>
            )}

            {activeTab === "promos" && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2 text-gray-600 font-mon">Carregando promoções...</span>
                  </div>
                ) : (
                  <>
                    {promos.length > 0 && <PromoStats stats={stats} />}
                    <PromosList promos={promos} onEdit={handleEditPromo} onDelete={fetchPromos} />
                  </>
                )}
              </div>
            )}

            {activeTab === "add-user" && (
              <div className="bg-card rounded-lg shadow-md">
                <UserForm user={selectedUser} onSuccess={handleFormSubmitSuccess} />
              </div>
            )}

            {activeTab === "edit-promo" && (
              <div className="bg-card rounded-lg shadow-md">
                <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
              </div>
            )}

            {activeTab === "add-promo" && (
              <div className="bg-card rounded-lg shadow-md">
                <PromoForm promo={null} onSuccess={handleFormSubmitSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
