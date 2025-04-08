"use client"

import type React from "react"
import { useState } from "react"
import { Search, Calendar, MapPin, Hotel, DollarSign } from "lucide-react"
import ExportButton from "./ExportButton"

interface PromoData {
  DATA_FORMATADA: string
  DESTINO: string
  HOTEL: string
  VALOR: string
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
}

interface PromosListProps {
  promos: PromoData[]
}

const PromosList: React.FC<PromosListProps> = ({ promos = [] }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDestino, setSelectedDestino] = useState<string | null>(null)

  const parseCurrencyValue = (value: string) => {
    if (!value) {
      return "0,00"
    }

    const cleanedValue = value.replace(/[^\d.,]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
    const valueAfterCalculation = numericValue * 15 * 2

    return valueAfterCalculation.toFixed(2).replace(".", ",")
  }

  const getRegimeAlimentacao = (promo: PromoData): string => {
    if (promo.ALL_INCLUSIVE) return "All Inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão Completa"
    if (promo.MEIA_PENSAO) return "Meia Pensão"
    if (promo.COM_CAFE) return "Com Café"
    if (promo.SEM_CAFE) return "Sem Café"
    return "Não especificado"
  }

  const getAeroportoSaida = (promo: PromoData): string => {
    if (promo.CG && promo.SP) return "Campo Grande e São Paulo"
    if (promo.CG) return "Campo Grande"
    if (promo.SP) return "São Paulo"
    return "Não especificado"
  }

  // Obter lista única de destinos para o filtro
  const destinos = [...new Set(promos.map((promo) => promo.DESTINO))].sort()

  // Filtrar promoções com base na pesquisa e no destino selecionado
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch =
      searchTerm === "" ||
      promo.DESTINO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.HOTEL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.DATA_FORMATADA.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDestino = selectedDestino === null || promo.DESTINO === selectedDestino

    return matchesSearch && matchesDestino
  })

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-grow">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar promoções..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                value={selectedDestino || ""}
                onChange={(e) => setSelectedDestino(e.target.value || null)}
              >
                <option value="">Todos os destinos</option>
                {destinos.map((destino) => (
                  <option key={destino} value={destino}>
                    {destino}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPromos.length > 0 && <ExportButton promos={filteredPromos} />}
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredPromos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mon">Nenhuma promoção encontrada.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Destino
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hotel
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Valor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromos.map((promo, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{promo.DATA_FORMATADA}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{promo.DESTINO}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Hotel className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{promo.HOTEL}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-primary-blue font-mon">
                        R$ {parseCurrencyValue(promo.VALOR)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">Regime:</span> {getRegimeAlimentacao(promo)}
                      </div>
                      {promo.NUMERO_DE_NOITES && (
                        <div className="text-xs">
                          <span className="font-medium">Noites:</span> {promo.NUMERO_DE_NOITES}
                        </div>
                      )}
                      <div className="text-xs">
                        <span className="font-medium">Saída:</span> {getAeroportoSaida(promo)}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default PromosList
