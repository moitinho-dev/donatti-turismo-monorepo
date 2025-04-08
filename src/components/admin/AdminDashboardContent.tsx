"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UsersList } from "./UsersList"
import { UserForm } from "./UserForm"
import { UserStats } from "./UserStats"
import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, BarChart2, Users, Database, ImageIcon } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onClearFilters={handleClearFilters}
          />

          {promos.length > 0 && <CSVExport dateRange={dateRange} />}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger
            value="dashboard"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger
            value="promos"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <Database className="h-4 w-4 mr-2" />
            <span>Banco de Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary-blue font-mon">
                      Desempenho dos Agentes
                    </CardTitle>
                    <CardDescription>Estatísticas de atividade dos agentes de turismo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserStats userStats={userStats} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary-blue font-mon">
                      Estatísticas de Promoções
                    </CardTitle>
                    <CardDescription>Visão geral das promoções cadastradas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PromoStats stats={stats} detailed />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando usuários...</span>
            </div>
          ) : (
            <UsersList users={users} onEdit={handleEditUser} onRefresh={fetchUsers} />
          )}
        </TabsContent>

        <TabsContent value="promos">
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
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">
                Gerador de Imagens Promocionais
              </CardTitle>
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
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">Gerenciamento de Dados</CardTitle>
              <CardDescription>Inicialização e migração de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <DataMigration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-user">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">
                {selectedUser ? "Editar Usuário" : "Adicionar Novo Usuário"}
              </CardTitle>
              <CardDescription>
                {selectedUser ? "Atualize as informações do usuário" : "Cadastre um novo usuário no sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserForm user={selectedUser} onSuccess={handleFormSubmitSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-promo">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">Editar Promoção</CardTitle>
              <CardDescription>Atualize os detalhes da promoção selecionada</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
