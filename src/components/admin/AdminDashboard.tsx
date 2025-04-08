"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { UsersList } from "./UsersList"
import { UserForm } from "./UserForm"
import { UserStats } from "./UserStats"
import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { DataMigration } from "../promos/DataMigration"
import { PromoImageBulkGenerator } from "../promos/PromoImageBulkGenerator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, FileText, BarChart2, Users, UserPlus, Database, ImageIcon } from "lucide-react"

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AdminDashboardProps {
  user: User
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")

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

  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam) {
      switch (tabParam) {
        case "users":
          setActiveTab("users")
          break
        case "promos":
          setActiveTab("promos")
          break
        case "add-promo":
          setActiveTab("add-promo")
          break
        case "imagens":
          setActiveTab("imagens")
          break
        case "data":
          setActiveTab("data")
          break
        default:
          setActiveTab("dashboard")
      }
    }
  }, [tabParam])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`)
  }

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
    setActiveTab("add-promo")
    router.push("/admin?tab=add-promo")
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setActiveTab("add-user")
    router.push("/admin?tab=add-user")
  }

  const handleAddUserClick = () => {
    setSelectedUser(null)
    setActiveTab("add-user")
    router.push("/admin?tab=add-user")
  }

  const handleFormSubmitSuccess = () => {
    fetchPromos()
    fetchStats()
    fetchUsers()
    fetchUserStats()
    setActiveTab("dashboard")
    router.push("/admin?tab=dashboard")
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)

    // If both dates are selected, filter promos
    if (range.from && range.to) {
      const startDateStr = range.from.toISOString().split("T")[0]
      const endDateStr = range.to.toISOString().split("T")[0]
      fetchPromos()
    } else {
      fetchPromos()
    }
  }

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    fetchPromos()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-donatti-blue mb-2 font-mon">Painel Administrativo</h1>
          <p className="text-gray-600 font-mon">Gerencie usuários, promoções e visualize estatísticas do sistema</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddUserClick}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-donatti-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
          <button
            onClick={() => {
              setSelectedPromo(null)
              setActiveTab("add-promo")
              router.push("/admin?tab=add-promo")
            }}
            className="flex items-center gap-2 px-4 py-2 bg-donatti-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-6">
        <TabsList className="mb-8 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger
            value="dashboard"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger
            value="promos"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          <TabsTrigger
            value="imagens"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <Database className="h-4 w-4 mr-2" />
            <span>Banco de Dados</span>
          </TabsTrigger>
          <TabsTrigger
            value="add-promo"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Nova Promoção</span>
          </TabsTrigger>
          <TabsTrigger
            value="add-user"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span>{selectedUser ? "Editar Usuário" : "Adicionar Usuário"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-donatti-blue mb-6 font-mon">Desempenho dos Agentes</h2>
                <UserStats userStats={userStats} />
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-donatti-blue mb-6 font-mon">Estatísticas de Promoções</h2>
                <PromoStats stats={stats} detailed />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando usuários...</span>
            </div>
          ) : (
            <UsersList users={users} onEdit={handleEditUser} onRefresh={fetchUsers} />
          )}
        </TabsContent>

        <TabsContent value="promos">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando promoções...</span>
            </div>
          ) : (
            <>
              {promos.length > 0 && <PromoStats stats={stats} />}
              <PromosList promos={promos} onEdit={handleEditPromo} onDelete={fetchPromos} />
            </>
          )}
        </TabsContent>

        <TabsContent value="imagens">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-donatti-blue mb-6 font-mon">Gerador de Imagens Promocionais</h2>
            <PromoImageBulkGenerator promos={promos} />
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-donatti-blue mb-6 font-mon">Gerenciamento de Dados</h2>
            <DataMigration />
          </div>
        </TabsContent>

        <TabsContent value="add-user">
          <UserForm user={selectedUser} onSuccess={handleFormSubmitSuccess} />
        </TabsContent>

        <TabsContent value="add-promo">
          <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
