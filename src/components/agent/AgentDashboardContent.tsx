"use client"
import { useState, useEffect } from "react"
import { PromosList } from "../promos/PromosList"
import { PromoForm } from "../promos/PromoForm"
import { PromoStats } from "../promos/PromoStats"
import { DateRangePicker } from "../promos/DateRangePicker"
import { CSVExport } from "../promos/CSVExport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, FileText, BarChart2, ImageIcon } from "lucide-react"
import { PromoImageBulkGenerator } from "../promos/PromoImageBulkGenerator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AgentDashboardContentProps {
  user: User
}

export default function AgentDashboardContent({ user }: AgentDashboardContentProps) {
  const [activeTab, setActiveTab] = useState("promos")
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [promos, setPromos] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    fetchPromos()
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
  }

  const handleAddNewClick = () => {
    setSelectedPromo(null)
    setActiveTab("adicionar")
  }

  const handleFormSubmitSuccess = () => {
    fetchPromos()
    fetchStats()
    setActiveTab("promos")
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

        <Button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Promoção</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger
            value="promos"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Promoções</span>
          </TabsTrigger>
          <TabsTrigger
            value="adicionar"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>{selectedPromo ? "Editar Promoção" : "Adicionar Nova"}</span>
          </TabsTrigger>
          <TabsTrigger
            value="imagens"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span>Gerador de Imagens</span>
          </TabsTrigger>
          <TabsTrigger
            value="estatisticas"
            className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promos" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600 font-mon">Carregando promoções...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 font-mon">
              <p>Erro ao carregar promoções: {error}</p>
            </div>
          ) : (
            <>
              {promos.length > 0 && <PromoStats stats={stats} />}
              <PromosList promos={promos} onEdit={handleEditPromo} onDelete={fetchPromos} />
            </>
          )}
        </TabsContent>

        <TabsContent value="adicionar">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">
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

        <TabsContent value="estatisticas">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary-blue font-mon">Estatísticas de Promoções</CardTitle>
              <CardDescription>Visão geral das suas promoções cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                  <span className="ml-2 text-gray-600 font-mon">Carregando estatísticas...</span>
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
