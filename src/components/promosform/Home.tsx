"use client"
import type React from "react"
import { useEffect, useState } from "react"
import PromosForm from "./PromosForm"
import PromosListNew from "./PromosListNew"
import type { PlanilhaData } from "../../app/api/promosenviadas/route"
import getPromos from "../../../lib/getPromos"
import { PromosHeader } from "./PromosHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Loader2 } from "lucide-react"
import PromoStats from "./PromoStats"

interface PromoData {
  DESTINO: string
  HOTEL: string
  DATA_FORMATADA: string
  VALOR: string
}

interface HomeProps {
  data: PlanilhaData[]
}

export const dynamic = "force-dynamic"

const Home: React.FC<HomeProps> = ({ data }) => {
  const [promosEnviadas, setPromosEnviadas] = useState<PromoData[]>(data)
  const [isLoading, setIsLoading] = useState(false)

  const updateData = async () => {
    try {
      setIsLoading(true)
      const data = await getPromos()
      setPromosEnviadas(data)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    updateData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-gray to-white">
      <PromosHeader />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-blue mb-2 font-mon">Gerenciador de Promoções</h1>
        <p className="text-gray-600 mb-8 font-mon">Adicione e visualize as promoções disponíveis para os clientes</p>

        <Tabs defaultValue="promos" className="w-full">
          <TabsList className="mb-8 bg-primary-gray">
            <TabsTrigger value="promos" className="font-mon">
              Promoções
            </TabsTrigger>
            <TabsTrigger value="adicionar" className="font-mon">
              Adicionar Nova
            </TabsTrigger>
          </TabsList>

          <TabsContent value="promos" className="space-y-4">
            {promosEnviadas.length > 0 && <PromoStats promos={promosEnviadas} />}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-primary-blue font-mon">Promoções Disponíveis</h2>
              <button
                onClick={updateData}
                className="flex items-center gap-2 px-4 py-2 bg-second-blue text-white rounded-md hover:bg-primary-blue transition-colors font-mon"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Atualizando...</span>
                  </>
                ) : (
                  <span>Atualizar Lista</span>
                )}
              </button>
            </div>
            <PromosListNew promos={promosEnviadas} />
          </TabsContent>

          <TabsContent value="adicionar">
            <PromosForm updateData={updateData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Home
