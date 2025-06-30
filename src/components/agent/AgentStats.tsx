"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { format, parseISO, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, MapPin, DollarSign, TrendingUp } from "lucide-react"

interface AgentStatsProps {
  userPromos: any[]
  user: any
}

export function AgentStats({ userPromos, user }: AgentStatsProps) {
  // Calculate agent-specific stats
  const totalPromos = userPromos.length

  // Unique destinations
  const destinations = new Set(userPromos.map((promo) => promo.DESTINO))
  const uniqueDestinations = destinations.size

  // Average value
  const totalValue = userPromos.reduce((sum, promo) => {
    const value = Number.parseFloat(promo.VALOR) * 2 * 15
    return sum + (isNaN(value) ? 0 : value)
  }, 0)
  const averageValue = totalPromos > 0 ? totalValue / totalPromos : 0

  // Most popular destination
  const destinationCounts: Record<string, number> = userPromos.reduce(
    (counts, promo) => {
      const dest = promo.DESTINO
      counts[dest] = (counts[dest] || 0) + 1
      return counts
    },
    {} as Record<string, number>,
  )

  let mostPopularDestination = { name: "Nenhum", count: 0 }
  for (const [dest, count] of Object.entries(destinationCounts)) {
    if (count > mostPopularDestination.count) {
      mostPopularDestination = { name: dest, count: count as number }
    }
  }

  // Daily stats for the last 30 days
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)

  const daysInterval = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: today,
  })

  const dailyCounts = daysInterval.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    label: format(day, "dd/MM", { locale: ptBR }),
    count: 0,
  }))

  userPromos.forEach((promo) => {
    const createdAt = new Date(promo.createdAt)
    const dayIndex = dailyCounts.findIndex(
      (day) => createdAt >= startOfDay(new Date(day.date)) && createdAt <= endOfDay(new Date(day.date)),
    )

    if (dayIndex !== -1) {
      dailyCounts[dayIndex].count++
    }
  })

  // Destination distribution for pie chart
  const destinationData = Object.entries(destinationCounts).map(([name, count]) => ({
    name,
    value: count,
  }))

  const colors = ["#1D3153", "#337D9D", "#FEB100", "#FED400", "#F0F0F0"]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary-blue">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Calendar className="h-6 w-6 text-primary-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-mon">Minhas Promoções</p>
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
              <TrendingUp className="h-6 w-6 text-primary-yellow" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-mon">Destino Favorito</p>
              <p className="text-lg font-semibold text-primary-yellow font-mon">{mostPopularDestination.name}</p>
              <p className="text-xs text-gray-500">{mostPopularDestination.count} promoções</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Atividade nos Últimos 30 Dias
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [value, "Promoções"]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="count" fill="#1D3153" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Destination Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Distribuição por Destino
          </h3>
          {destinationData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={destinationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {destinationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon">Resumo de Desempenho</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2 font-mon">Estatísticas Gerais</h4>
            <p className="text-sm text-gray-600 font-mon mb-2">
              Você criou um total de <span className="font-semibold text-primary-blue">{totalPromos} promoções</span>{" "}
              para <span className="font-semibold text-primary-blue">{uniqueDestinations} destinos diferentes</span>.
            </p>
            <p className="text-sm text-gray-600 font-mon">
              O valor médio das suas promoções é{" "}
              <span className="font-semibold text-primary-blue">
                {averageValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              .
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2 font-mon">Destino Mais Trabalhado</h4>
            <p className="text-sm text-gray-600 font-mon">
              Seu destino favorito é <span className="font-semibold text-primary-blue">{mostPopularDestination.name}</span>{" "}
              com <span className="font-semibold text-primary-blue">{mostPopularDestination.count} promoções</span> criadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}