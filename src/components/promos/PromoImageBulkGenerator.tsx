"use client"
import { useState } from "react"
import type React from "react"

import { Loader2 } from "lucide-react"
import { PromoImageGenerator } from "./PromoImageGenerator"

interface PromoImageBulkGeneratorProps {
  promos: any[]
}

export function PromoImageBulkGenerator({ promos }: PromoImageBulkGeneratorProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [filteredPromos, setFilteredPromos] = useState<any[]>([])
  const [isFiltering, setIsFiltering] = useState(false)

  // Get unique destinations
  const destinations = [...new Set(promos.map((promo) => promo.DESTINO))].sort()

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const destination = e.target.value
    setSelectedDestination(destination || null)

    if (destination) {
      setIsFiltering(true)
      const filtered = promos.filter((promo) => promo.DESTINO === destination)
      setFilteredPromos(filtered)
      setIsFiltering(false)
    } else {
      setFilteredPromos([])
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600 mb-4 font-mon">
          Selecione um destino para gerar imagens promocionais. Você pode gerar e baixar imagens para cada promoção
          individualmente.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-primary-blue font-mon font-medium mb-2">Selecione o destino</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              value={selectedDestination || ""}
              onChange={handleDestinationChange}
            >
              <option value="">Selecione um destino</option>
              {destinations.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isFiltering ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          <span className="ml-2 text-gray-600 font-mon">Filtrando promoções...</span>
        </div>
      ) : selectedDestination && filteredPromos.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700 font-mon">
          <p>Nenhuma promoção encontrada para o destino selecionado.</p>
        </div>
      ) : filteredPromos.length > 0 ? (
        <div className="space-y-8">
          {filteredPromos.map((promo) => (
            <div key={promo.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon">
                {promo.DESTINO} - {promo.HOTEL}
              </h3>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/2">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-md font-medium text-gray-700 mb-2 font-mon">Detalhes da Promoção</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Destino:</span> {promo.DESTINO}
                      </p>
                      <p>
                        <span className="font-medium">Hotel:</span> {promo.HOTEL}
                      </p>
                      <p>
                        <span className="font-medium">Data:</span> {promo.DATA_FORMATADA}
                      </p>
                      <p>
                        <span className="font-medium">Noites:</span> {promo.NUMERO_DE_NOITES}
                      </p>
                      <p>
                        <span className="font-medium">Regime:</span>{" "}
                        {promo.ALL_INCLUSIVE
                          ? "All Inclusive"
                          : promo.PENSAO_COMPLETA
                            ? "Pensão Completa"
                            : promo.MEIA_PENSAO
                              ? "Meia Pensão"
                              : promo.COM_CAFE
                                ? "Com Café"
                                : "Sem Café"}
                      </p>
                      <p>
                        <span className="font-medium">Saída:</span>{" "}
                        {promo.CG && promo.SP
                          ? "Campo Grande e São Paulo"
                          : promo.CG
                            ? "Campo Grande"
                            : promo.SP
                              ? "São Paulo"
                              : "Não especificado"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <PromoImageGenerator promo={promo} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}