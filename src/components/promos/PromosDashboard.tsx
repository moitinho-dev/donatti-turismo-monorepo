"use client"
import { useState, useEffect } from "react"
import { usePromo } from "@/hooks/usePromo"
import { signOut } from "next-auth/react"
import { PromosHeader } from "./PromosHeader"
import { PromosList } from "./PromosList"
import { PromoForm } from "./PromoForm"
import { PromoStats } from "./PromoStats"
import { DateRangePicker } from "./DateRangePicker"
import { CSVExport } from "./CSVExport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Loader2, Plus, FileText, BarChart2, Database, Image } from "lucide-react"
import { DataMigration } from "./DataMigration"
import { PromoImageBulkGenerator } from "./PromoImageBulkGenerator"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

interface PromosDashboardProps {
  user: User
}

export default function PromosDashboard({ user }: PromosDashboardProps) {
  const [activeTab, setActiveTab] = useState("promos")
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const { promos, isLoading, error, fetchPromos, stats, fetchStats } = usePromo()

  useEffect(() => {
    fetchPromos()
    fetchStats()
  }, [fetchPromos, fetchStats])

  const handleEditPromo = (promo: any) => {
    setSelectedPromo(promo)
    setActiveTab("adicionar")
  }

  const handleAddNewClick = () => {
    setSelectedPromo(null)
    setActiveTab("adicionar")
  }

  const handleFormSubmitSuccess = () => {
    setActiveTab("promos")
    setSelectedPromo(null)
    fetchPromos()
    fetchStats()
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)

    // If both dates are selected, filter promos
    if (range.from && range.to) {
      fetchPromos(range.from, range.to)
    } else {
      fetchPromos()
    }
  }

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    fetchPromos()
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PromosHeader user={user} onSignOut={handleSignOut} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-blue mb-2 font-mon">Gerenciador de Promoções</h1>
            <p className="text-gray-600 font-mon">
              Adicione, edite e visualize as promoções disponíveis para os clientes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleAddNewClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="mb-8 bg-gray-100 p-1 rounded-lg overflow-x-auto flex whitespace-nowrap">
            <TabsTrigger
              value="promos"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Promoções</span>
              <span className="sm:hidden">Promos</span>
            </TabsTrigger>
            <TabsTrigger
              value="adicionar"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{selectedPromo ? "Editar Promoção" : "Adicionar Nova"}</span>
              <span className="sm:hidden">{selectedPromo ? "Editar" : "Adicionar"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="imagens"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
            >
              <Image className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gerador de Imagens</span>
              <span className="sm:hidden">Imagens</span>
            </TabsTrigger>
            <TabsTrigger
              value="estatisticas"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Estatísticas</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="font-mon data-[state=active]:bg-white data-[state=active]:text-primary-blue"
            >
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gerenciamento de Dados</span>
              <span className="sm:hidden">Dados</span>
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
            <PromoForm promo={selectedPromo} onSuccess={handleFormSubmitSuccess} />
          </TabsContent>

          <TabsContent value="imagens">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold text-primary-blue mb-6 font-mon">Gerador de Imagens Promocionais</h2>
              <PromoImageBulkGenerator promos={promos} />
            </div>
          </TabsContent>

          <TabsContent value="estatisticas">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold text-primary-blue mb-6 font-mon">Estatísticas de Promoções</h2>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                  <span className="ml-2 text-gray-600 font-mon">Carregando estatísticas...</span>
                </div>
              ) : (
                <PromoStats stats={stats} detailed />
              )}
            </div>
          </TabsContent>
          <TabsContent value="data">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold text-primary-blue mb-6 font-mon">Gerenciamento de Dados</h2>
              <DataMigration />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
