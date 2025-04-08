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
import { DashboardCard } from "@/components/ui/dashboard-card"
import { StatsCard } from "@/components/ui/stats-card"
import {
  Loader2,
  Plus,
  FileText,
  BarChart2,
  Users,
  UserPlus,
  Database,
  ImageIcon,
  MapPin,
  Calendar,
  DollarSign,
  Moon,
  Search,
  RefreshCw,
} from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDestination, setFilterDestination] = useState("all")

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
      fetchPromos()
    } else {
      fetchPromos()
    }
  }

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    setSearchQuery("")
    setFilterDestination("all")
    fetchPromos()
  }

  // Get unique destinations for filter
  const destinations = promos ? Array.from(new Set(promos.map((promo) => promo.destino))) : []

  // Filter promos based on search and destination
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch = searchQuery
      ? promo.destino.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.hotel.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    const matchesDestination = filterDestination !== "all" ? promo.destino === filterDestination : true

    return matchesSearch && matchesDestination
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-donatti-blue mb-2 font-mon">Painel Administrativo</h1>
          <p className="text-gray-600 font-mon">Gerencie usuários, promoções e visualize estatísticas do sistema</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {user.role === "admin" && (
            <button
              onClick={handleAddUserClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-donatti-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
            >
              <UserPlus className="h-4 w-4" />
              <span>Novo Usuário</span>
            </button>
          )}
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-8 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger
            value="dashboard"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="promos"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          {user.role === "admin" && (
            <TabsTrigger
              value="users"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
            >
              <Users className="h-4 w-4 mr-2" />
              <span>Usuários</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="imagens"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          {user.role === "admin" && (
            <TabsTrigger
              value="data"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-donatti-blue"
            >
              <Database className="h-4 w-4 mr-2" />
              <span>Banco de Dados</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total de Promoções"
                  value={stats?.totalPromos || 0}
                  icon={<FileText className="h-5 w-5" />}
                  isLoading={!stats}
                />
                <StatsCard
                  title="Destinos Únicos"
                  value={stats?.uniqueDestinations || 0}
                  icon={<MapPin className="h-5 w-5" />}
                  isLoading={!stats}
                />
                <StatsCard
                  title="Valor Médio"
                  value={
                    stats?.averageValue
                      ? `R$ ${Number.parseFloat(stats.averageValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "R$ 0,00"
                  }
                  icon={<DollarSign className="h-5 w-5" />}
                  isLoading={!stats}
                />
                <StatsCard
                  title="Média de Noites"
                  value={stats?.averageNights ? Number.parseFloat(stats.averageNights).toFixed(1) : "0"}
                  icon={<Moon className="h-5 w-5" />}
                  isLoading={!stats}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardCard
                  title="Desempenho dos Agentes"
                  icon={<Users className="h-5 w-5" />}
                  isLoading={!userStats.length}
                >
                  <UserStats userStats={userStats} />
                </DashboardCard>

                <DashboardCard
                  title="Estatísticas de Promoções"
                  icon={<BarChart2 className="h-5 w-5" />}
                  isLoading={!stats}
                >
                  <PromoStats stats={stats} detailed />
                </DashboardCard>
              </div>

              <DashboardCard
                title="Promoções Recentes"
                icon={<Calendar className="h-5 w-5" />}
                footer={
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Mostrando {Math.min(5, promos.length)} de {promos.length} promoções
                    </span>
                    <button
                      onClick={() => handleTabChange("promos")}
                      className="text-sm text-donatti-blue hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Destino</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hotel</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.slice(0, 5).map((promo, index) => (
                        <tr key={promo.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{promo.destino}</td>
                          <td className="py-3 px-4 text-sm">{promo.hotel}</td>
                          <td className="py-3 px-4 text-sm">
                            R${" "}
                            {Number.parseFloat(promo.valorTotal).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(promo.dataIda).toLocaleDateString("pt-BR")} -{" "}
                            {new Date(promo.dataVolta).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                      {promos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-500">
                            Nenhuma promoção encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </>
          )}
        </TabsContent>

        <TabsContent value="promos">
          <DashboardCard>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por destino ou hotel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48">
                  <select
                    value={filterDestination}
                    onChange={(e) => setFilterDestination(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue"
                  >
                    <option value="all">Todos os destinos</option>
                    {destinations.map((dest, index) => (
                      <option key={index} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>

                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  onClearFilters={handleClearFilters}
                />

                <button
                  onClick={handleClearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Limpar</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
                <span className="ml-2 text-gray-600 font-mon">Carregando promoções...</span>
              </div>
            ) : (
              <>
                {filteredPromos.length > 0 ? (
                  <PromosList promos={filteredPromos} onEdit={handleEditPromo} onDelete={fetchPromos} />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção encontrada</h3>
                    <p className="text-gray-500 mb-6">Tente ajustar seus filtros ou adicione uma nova promoção.</p>
                    <button
                      onClick={() => {
                        setSelectedPromo(null)
                        setActiveTab("add-promo")
                        router.push("/admin?tab=add-promo")
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-donatti-blue text-white rounded-md hover:bg-second-blue transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nova Promoção</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="users">
          <DashboardCard>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-donatti-blue" />
                <span className="ml-2 text-gray-600 font-mon">Carregando usuários...</span>
              </div>
            ) : (
              <UsersList users={users} onEdit={handleEditUser} onRefresh={fetchUsers} />
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="imagens">
          <DashboardCard title="Gerador de Imagens Promocionais" icon={<ImageIcon className="h-5 w-5" />}>
            <PromoImageBulkGenerator promos={promos} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="data">
          <DashboardCard title="Gerenciamento de Dados" icon={<Database className="h-5 w-5" />}>
            <DataMigration />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="add-user">
          <DashboardCard
            title={selectedUser ? "Editar Usuário" : "Adicionar Usuário"}
            icon={<UserPlus className="h-5 w-5" />}
          >
            <UserForm user={selectedUser} onSuccess={handleFormSubmitSuccess} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="add-promo">
          <DashboardCard
            title={selectedPromo ? "Editar Promoção" : "Nova Promoção"}
            icon={<Plus className="h-5 w-5" />}
          >
            <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
