"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, FileText, BarChart2, ImageIcon, Search, MapPin } from "lucide-react"
import { PromoImageBulkGenerator } from "../promos/PromoImageBulkGenerator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AgentDashboardContentProps {
  user: User
  isAddingNew?: boolean
  setIsAddingNew?: (value: boolean) => void
}

export default function AgentDashboardContent({ user, isAddingNew, setIsAddingNew }: AgentDashboardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState(tabParam || "promos")
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [promos, setPromos] = useState<any[]>([])
  const [filteredPromos, setFilteredPromos] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [destinationFilter, setDestinationFilter] = useState("all")
  const [uniqueDestinations, setUniqueDestinations] = useState<string[]>([])

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch initial data
  useEffect(() => {
    fetchPromos()
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
    setActiveTab("adicionar")
    router.push("/agent?tab=adicionar")
  }

  const handleAddNewClick = () => {
    setSelectedPromo(null)
    setActiveTab("adicionar")
    router.push("/agent?tab=adicionar")
    if (setIsAddingNew) {
      setIsAddingNew(true)
    }
  }

  const handleFormSubmitSuccess = () => {
    fetchPromos()
    fetchStats()
    setActiveTab("promos")
    router.push("/agent?tab=promos")
    if (setIsAddingNew) {
      setIsAddingNew(false)
    }
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
    fetchPromos()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/agent?tab=${value}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleDestinationFilterChange = (value: string) => {
    setDestinationFilter(value)
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

        <Button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Promoção</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="promos" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          <TabsTrigger value="adicionar" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <Plus className="h-4 w-4 mr-2" />
            <span>{selectedPromo ? "Editar Promoção" : "Adicionar Nova"}</span>
          </TabsTrigger>
          <TabsTrigger value="imagens" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          <TabsTrigger
            value="estatisticas"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promos" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Carregando promoções...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>Erro ao carregar promoções: {error}</p>
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

        <TabsContent value="adicionar">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">
                {selectedPromo ? "Editar Promoção" : "Adicionar Nova Promoção"}
              </CardTitle>
              <CardDescription>
                {selectedPromo ? "Atualize os detalhes da promoção" : "Cadastre uma nova promoção no sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagens">
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

        <TabsContent value="estatisticas">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue">Estatísticas de Promoções</CardTitle>
              <CardDescription>Visão geral das suas promoções cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                  <span className="ml-2 text-gray-600">Carregando estatísticas...</span>
                </div>
              ) : (
                <PromoStats stats={stats} detailed />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
