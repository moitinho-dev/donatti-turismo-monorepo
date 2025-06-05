"use client"
import { useEffect, useRef } from "react"
import { MapPin, Calendar, DollarSign, Users, TrendingUp } from "lucide-react"
import Chart from "chart.js/auto"

interface StatsData {
  overall: {
    totalPromos: number
    uniqueDestinations: number
    averageValue: number
    averageNights: number
    mostPopularDestination: {
      name: string
      count: number
    }
  }
  daily: {
    date: string
    label: string
    count: number
  }[]
}

interface PromoStatsProps {
  stats: StatsData | null
  detailed?: boolean
}

export function PromoStats({ stats, detailed = false }: PromoStatsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Add this helper function at the beginning of the component
  const safeParseDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error("Invalid date encountered:", dateString)
        return new Date(0) // Return epoch time as fallback
      }
      return date
    } catch (error) {
      console.error("Error parsing date:", error)
      return new Date(0) // Return epoch time as fallback
    }
  }

  // Update the useEffect hook that creates the chart
  useEffect(() => {
    if (!stats || !detailed || !chartRef.current) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Create new chart with safe data
    const safeData = stats.daily.map((day) => ({
      ...day,
      date: day.date || "",
      label: day.label || "",
      count: typeof day.count === "number" ? day.count : 0,
    }))

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: safeData.map((day) => day.label),
        datasets: [
          {
            label: "Promoções Criadas",
            data: safeData.map((day) => day.count),
            backgroundColor: "rgba(51, 125, 157, 0.7)",
            borderColor: "rgba(51, 125, 157, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    })

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [stats, detailed])

  if (!stats) return null

  return (
    <div className={`${detailed ? "" : "mb-8"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary-blue">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Calendar className="h-6 w-6 text-primary-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-mon">Total de Promoções</p>
              <p className="text-xl font-semibold text-primary-blue font-mon">{stats.overall.totalPromos}</p>
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
              <p className="text-xl font-semibold text-second-blue font-mon">{stats.overall.uniqueDestinations}</p>
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
                {stats.overall.averageValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
              <p className="text-xl font-semibold text-primary-yellow font-mon">
                {stats.overall.averageNights.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {detailed && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Promoções nos Últimos 30 Dias
            </h3>
            <div className="h-64">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon">Destino Mais Popular</h3>

            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <MapPin className="h-6 w-6 text-primary-blue" />
              </div>
              <div>
                <p className="text-xl font-semibold text-primary-blue font-mon">
                  {stats.overall.mostPopularDestination.name}
                </p>
                <p className="text-sm text-gray-500 font-mon">{stats.overall.mostPopularDestination.count} promoções</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-semibold text-gray-700 mb-2 font-mon">Resumo de Desempenho</h4>
              <p className="text-sm text-gray-600 font-mon">
                Você tem um total de <span className="font-semibold">{stats.overall.totalPromos} promoções</span>{" "}
                cadastradas para{" "}
                <span className="font-semibold">{stats.overall.uniqueDestinations} destinos diferentes</span>.
              </p>
              <p className="text-sm text-gray-600 font-mon mt-2">
                O valor médio das promoções é{" "}
                <span className="font-semibold">
                  {stats.overall.averageValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>{" "}
                com duração média de{" "}
                <span className="font-semibold">{stats.overall.averageNights.toFixed(1)} noites</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
