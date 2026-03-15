"use client"

import { MapPin } from "lucide-react"

interface StatsPanelProps {
  stats: {
    overall?: {
      totalPromos?: number
      uniqueDestinations?: number
      averageValue?: number
      averageNights?: number
      mostPopularDestination?: { name: string; count: number }
    }
  } | null
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Estatisticas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resumo Geral</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Total de Promos</span>
              <span className="font-medium">{stats?.overall?.totalPromos || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Destinos Unicos</span>
              <span className="font-medium">{stats?.overall?.uniqueDestinations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor Medio</span>
              <span className="font-medium">
                {(stats?.overall?.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Media de Noites</span>
              <span className="font-medium">{stats?.overall?.averageNights || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Destino Mais Popular</h3>
          {stats?.overall?.mostPopularDestination ? (
            <div className="text-center py-4">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">{stats.overall.mostPopularDestination.name}</p>
              <p className="text-gray-500">{stats.overall.mostPopularDestination.count} promocoes</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  )
}
