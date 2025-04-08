"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UsersList } from "./UsersList"
import { UserForm } from "./UserForm"
import { UserStats } from "./UserStats"
import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, BarChart2, Users, Database, ImageIcon, Plus, UserPlus, Edit } from "lucide-react"
import { PromoImageBulkGenerator } from "../promos/PromoImageBulkGenerator"
import { DataMigration } from "../promos/DataMigration"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AdminDashboardContentProps {
  user: User
}

export default function AdminDashboardContent({ user }: AdminDashboardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState(tabParam || "dashboard")
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

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
    router.push("/admin?tab=edit-promo")
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

  const handleAddPromoClick = () => {
    setSelectedPromo(null)
    setActiveTab("add-promo")
    router.push("/admin?tab=add-promo")
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
      fetchPromos()
    } else {
      fetchPromos()
    }
  }

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    fetchPromos()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`)
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-blue mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários, promoções e visualize estatísticas do sistema</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddUserClick}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
          <button
            onClick={handleAddPromoClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors"
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
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <Users className="h-4 w-4 mr-2" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="promos" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          <TabsTrigger value="add-promo" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <Plus className="h-4 w-4 mr-2" />
            <span>Nova Promoção</span>
          </TabsTrigger>
          <TabsTrigger value="add-user" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <UserPlus className="h-4 w-4 mr-2" />
            <span>{selectedUser ? "Editar Usuário" : "Adicionar Usuário"}</span>
          </TabsTrigger>
          <TabsTrigger
            value="edit-promo"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <Edit className="h-4 w-4 mr-2" />
            <span>Editar Promoção</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <Database className="h-4 w-4 mr-2" />
            <span>Banco de Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-primary-blue mb-6">Desempenho dos Agentes</h2>
                <UserStats userStats={userStats} />
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-primary-blue mb-6">Estatísticas de Promoções</h2>
                <PromoStats stats={stats} detailed />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Carregando usuários...</span>
            </div>
          ) : (
            <UsersList users={users} onEdit={handleEditUser} onRefresh={fetchUsers} />
          )}
        </TabsContent>

        <TabsContent value="promos">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Carregando promoções...</span>
            </div>
          ) : (
            <>
              {promos.length > 0 && <PromoStats stats={stats} />}
              <PromosList promos={promos} onEdit={handleEditPromo} onDelete={fetchPromos} />
            </>
          )}
        </TabsContent>

        <TabsContent value="add-user">
          <UserForm user={selectedUser} onSuccess={handleFormSubmitSuccess} />
        </TabsContent>

        <TabsContent value="edit-promo">
          <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
        </TabsContent>

        <TabsContent value="add-promo">
          <PromoForm promo={null} onSuccess={handleFormSubmitSuccess} />
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">Gerador de Imagens Promocionais</CardTitle>
              <CardDescription>Crie imagens para suas promoções de viagens</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoImageBulkGenerator promos={promos} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">Gerenciamento de Dados</CardTitle>
              <CardDescription>Inicialização e migração de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <DataMigration />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
