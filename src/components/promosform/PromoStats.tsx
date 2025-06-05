import type React from "react"
import { MapPin, Calendar, DollarSign, Users } from "lucide-react"

interface PromoData {
  DATA_FORMATADA: string
  DESTINO: string
  HOTEL: string
  VALOR: string
  NUMERO_DE_NOITES?: string
}

interface PromoStatsProps {
  promos: PromoData[]
}

const PromoStats: React.FC<PromoStatsProps> = ({ promos }) => {
  // Calcular estatísticas
  const totalPromos = promos.length

  // Destinos únicos - using Array.from instead of spread operator
  const uniqueDestinations = Array.from(new Set(promos.map((promo) => promo.DESTINO))).length

  // Média de valor
  const averageValue =
    promos.length > 0
      ? promos.reduce((sum, promo) => {
          const cleanedValue = promo.VALOR.replace(/[^\d.,]/g, "")
          const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
          return sum + (isNaN(numericValue) ? 0 : numericValue * 15 * 2)
        }, 0) / promos.length
      : 0

  // Média de noites
  const promosWithNights = promos.filter((promo) => promo.NUMERO_DE_NOITES)
  const averageNights =
    promosWithNights.length > 0
      ? promosWithNights.reduce((sum, promo) => {
          const nights = Number.parseInt(promo.NUMERO_DE_NOITES || "0", 10)
          return sum + (isNaN(nights) ? 0 : nights)
        }, 0) / promosWithNights.length
      : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary-blue">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <Calendar className="h-6 w-6 text-primary-blue" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mon">Total de Promoções</p>
            <p className="text-xl font-semibold text-primary-blue font-mon">{totalPromos}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-second-blue">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <MapPin className="h-6 w-6 text-second-blue" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mon">Destinos Únicos</p>
            <p className="text-xl font-semibold text-second-blue font-mon">{uniqueDestinations}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary-orange">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 mr-4">
            <DollarSign className="h-6 w-6 text-primary-orange" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mon">Valor Médio</p>
            <p className="text-xl font-semibold text-primary-orange font-mon">
              {averageValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary-yellow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 mr-4">
            <Users className="h-6 w-6 text-primary-yellow" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mon">Média de Noites</p>
            <p className="text-xl font-semibold text-primary-yellow font-mon">{averageNights.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoStats
