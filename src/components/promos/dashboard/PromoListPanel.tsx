"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Edit2,
  Trash2,
  ChevronDown,
  Loader2,
  FileText,
  Plus,
  ImageIcon,
} from "lucide-react"
import { PromoGridCard } from "./PromoGridCard"
import type { PromoData, ViewMode } from "./types"
import { getRegimeLabel, formatPrice } from "./types"

interface PromoListPanelProps {
  promos: PromoData[]
  isLoading: boolean
  error: string | null
  stats: {
    overall?: {
      totalPromos?: number
      uniqueDestinations?: number
      averageValue?: number
      mostPopularDestination?: { name: string; count: number }
    }
  } | null
  promoImages: Record<string, string>
  loadingPromoImages: Record<string, boolean>
  onEdit: (promo: PromoData) => void
  onGenerateImage: (promo: PromoData) => void
  onDelete: (id: string) => void
  onNewPromo: () => void
}

export function PromoListPanel({
  promos,
  isLoading,
  error,
  stats,
  promoImages,
  loadingPromoImages,
  onEdit,
  onGenerateImage,
  onDelete,
  onNewPromo,
}: PromoListPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  const filteredPromos = promos.filter((promo) => {
    const q = searchQuery.toLowerCase()
    return (
      promo.DESTINO?.toLowerCase().includes(q) ||
      promo.HOTEL?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por destino ou hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              filterOpen ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onNewPromo}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Promo
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total de Promos</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.overall?.totalPromos || promos.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Destinos</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.overall?.uniqueDestinations || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Valor Medio</p>
          <p className="text-2xl font-bold text-gray-900">
            {(stats?.overall?.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Destino Popular</p>
          <p className="text-lg font-bold text-gray-900 truncate">{stats?.overall?.mostPopularDestination?.name || "-"}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPromos.map((promo) => (
            <PromoGridCard
              key={promo.id}
              promo={promo}
              imageUrl={promoImages[promo.id]}
              loadingImage={loadingPromoImages[promo.id]}
              onEdit={onEdit}
              onGenerateImage={onGenerateImage}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Destino</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hotel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Noites</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Regime</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPromos.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{promo.DESTINO}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{promo.HOTEL}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{promo.DATA_FORMATADA}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600">{formatPrice(promo)}</span>
                    <span className="text-xs text-gray-500 ml-1">/{promo.PARCELAS || 15}x</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{promo.NUMERO_DE_NOITES}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{getRegimeLabel(promo)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(promo)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button onClick={() => onGenerateImage(promo)} className="p-1.5 hover:bg-gray-100 rounded">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      <button onClick={() => onDelete(promo.id)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPromos.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promocao encontrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira promocao</p>
          <button
            onClick={onNewPromo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nova Promocao
          </button>
        </div>
      )}
    </>
  )
}
