"use client"
import { useState, useEffect } from "react"
import type React from "react"

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
import { Loader2, FileText, BarChart2, Users, Database, ImageIcon, Plus, Search, MapPin } from "lucide-react"
import { PromoImageBulkGenerator } from "../promos/PromoImageBulkGenerator"
import { DataMigration } from "../promos/DataMigration"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [filteredPromos, setFilteredPromos] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [destinationFilter, setDestinationFilter] = useState("all")
  const [uniqueDestinations, setUniqueDestinations] = useState<string[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")

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

  // Extract unique destinations when promos change
  useEffect(() => {
    if (promos.length > 0) {
      const destinations = [...new Set(promos.map((promo) => promo.DESTINO))].sort()
      setUniqueDestinations(destinations)
    }
  }, [promos])

  // Filter promos when search term or destination filter changes
  useEffect(() => {
    if (promos.length > 0) {
      let filtered = [...promos]

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (promo) => promo.DESTINO?.toLowerCase().includes(term) || promo.HOTEL?.toLowerCase().includes(term),
        )
      }

      // Apply destination filter
      if (destinationFilter && destinationFilter !== "all") {
        filtered = filtered.filter((promo) => promo.DESTINO === destinationFilter)
      }

      setFilteredPromos(filtered)
    } else {
      setFilteredPromos([])
    }
  }, [promos, searchTerm, destinationFilter])

  // Filter users when search term or role filter changes
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users]

      // Apply search filter
      if (userSearchTerm) {
        const term = userSearchTerm.toLowerCase()
        filtered = filtered.filter(
          (user) => user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term),
        )
      }

      // Apply role filter
      if (userRoleFilter && userRoleFilter !== "all") {
        filtered = filtered.filter((user) => user.role === userRoleFilter)
      }

      setFilteredUsers(filtered)
    } else {
      setFilteredUsers([])
    }
  }, [users, userSearchTerm, userRoleFilter])

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
      setFilteredPromos(data)
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
      setFilteredUsers(data)
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
    setSearchTerm("")
    setDestinationFilter("all")
    setUserSearchTerm("")
    setUserRoleFilter("all")
    fetchPromos()
    fetchUsers()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleDestinationFilterChange = (value: string) => {
    setDestinationFilter(value)
  }

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearchTerm(e.target.value)
  }

  const handleUserRoleFilterChange = (value: string) => {
    setUserRoleFilter(value)
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onClearFilters={handleClearFilters}
          />

          {promos.length > 0 && <CSVExport dateRange={dateRange} />}
        </div>

        {activeTab === "promos" && (
          <Button
            onClick={handleAddPromoClick}
            className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Promoção</span>
          </Button>
        )}

        {activeTab === "users" && (
          <Button
            onClick={handleAddUserClick}
            className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary-blue">Desempenho dos Agentes</CardTitle>
                    <CardDescription>Estatísticas de atividade dos agentes de turismo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserStats userStats={userStats} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary-blue">Estatísticas de Promoções</CardTitle>
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
              <span className="ml-2 text-gray-600">Carregando usuários...</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={userSearchTerm}
                    onChange={handleUserSearchChange}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={userRoleFilter} onValueChange={handleUserRoleFilterChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os perfis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os perfis</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <UsersList users={filteredUsers} onEdit={handleEditUser} onRefresh={fetchUsers} />

              {filteredUsers.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</h3>
                  <p className="text-gray-500 mt-1">
                    {userSearchTerm || userRoleFilter !== "all"
                      ? "Tente ajustar seus filtros de busca"
                      : "Adicione seu primeiro usuário clicando no botão 'Novo Usuário'"}
                  </p>
                </div>
              )}
            </>
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

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar promoções..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={destinationFilter} onValueChange={handleDestinationFilterChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os destinos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os destinos</SelectItem>
                      {uniqueDestinations.map((destination) => (
                        <SelectItem key={destination} value={destination}>
                          {destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <PromosList promos={filteredPromos} onEdit={handleEditPromo} onDelete={fetchPromos} />

              {filteredPromos.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhuma promoção encontrada</h3>
                  <p className="text-gray-500 mt-1">
                    {searchTerm || destinationFilter !== "all"
                      ? "Tente ajustar seus filtros de busca"
                      : "Adicione sua primeira promoção clicando no botão 'Nova Promoção'"}
                  </p>
                </div>
              )}
            </>
          )}
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

        <TabsContent value="add-user">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">
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

        <TabsContent value="add-promo">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">Adicionar Nova Promoção</CardTitle>
              <CardDescription>Cadastre uma nova promoção no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoForm promo={null} onSuccess={handleFormSubmitSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-promo">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">Editar Promoção</CardTitle>
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
