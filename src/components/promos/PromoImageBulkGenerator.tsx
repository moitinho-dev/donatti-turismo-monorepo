"use client"
import { useState } from "react"
import { PromoImageGenerator } from "./PromoImageGenerator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface PromoImageBulkGeneratorProps {
  promos: any[]
}

export function PromoImageBulkGenerator({ promos }: PromoImageBulkGeneratorProps) {
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [destinationFilter, setDestinationFilter] = useState("all")

  // Get unique destinations for filter
  const uniqueDestinations = [...new Set(promos.map((promo) => promo.DESTINO))].sort()

  // Filter promos based on search and destination
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch =
      searchTerm === "" ||
      promo.DESTINO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.HOTEL?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDestination = destinationFilter === "all" || promo.DESTINO === destinationFilter

    return matchesSearch && matchesDestination
  })

  // Get selected promo
  const selectedPromo = selectedPromoId ? promos.find((promo) => promo.id === selectedPromoId) : filteredPromos[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar promoções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={destinationFilter} onValueChange={setDestinationFilter}>
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

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="single" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            Gerador Individual
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:text-primary-blue">
            Lista de Promoções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          {selectedPromo ? (
            <PromoImageGenerator promo={selectedPromo} />
          ) : (
            <div className="text-center py-12 text-gray-500">Nenhuma promoção disponível para gerar imagem.</div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPromos.map((promo) => (
              <Card
                key={promo.id}
                className={`cursor-pointer transition-all ${selectedPromoId === promo.id ? "ring-2 ring-primary-blue" : "hover:shadow-md"}`}
                onClick={() => setSelectedPromoId(promo.id)}
              >
                <CardContent className="p-4">
                  <div className="font-bold text-lg text-primary-blue">{promo.DESTINO}</div>
                  <div className="text-gray-600">{promo.HOTEL}</div>
                  <div className="text-sm text-gray-500">{promo.DATA_FORMATADA}</div>
                  <div className="mt-2 font-semibold text-second-blue">
                    {promo.PARCELAS}x R$ {promo.VALOR}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPromos.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma promoção encontrada com os filtros atuais.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
