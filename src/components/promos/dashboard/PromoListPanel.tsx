"use client"

import { useState } from "react"
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MapPin,
  Edit2,
  Trash2,
  Loader2,
  FileText,
  Plus,
  ImageIcon,
  Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm flex flex-col justify-center">
      <p className="text-gray-400 text-[12px] uppercase tracking-wider font-bold mb-1.5">{label}</p>
      <p className="text-gray-900 text-2xl font-black truncate tracking-tight">{value}</p>
    </div>
  )
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

  const filteredPromos = promos.filter((promo) => {
    const q = searchQuery.toLowerCase()
    return (
      promo.DESTINO?.toLowerCase().includes(q) ||
      promo.HOTEL?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search and Action Island */}
      <div className="bg-white rounded-[20px] border border-gray-200 p-3 shadow-sm mb-6 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por destino ou hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-[14px] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all hover:border-amber-400/50 text-[14px]"
          />
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0">
          <button className="bg-gray-50 text-gray-700 flex items-center justify-center gap-2 px-5 py-3.5 rounded-[14px] border border-gray-200 hover:border-amber-400/50 transition-all font-bold shadow-sm shrink-0 text-[14px]">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>

          <div className="bg-gray-50 flex items-center p-1 rounded-[14px] border border-gray-200 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-[10px] transition-all focus:outline-none ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-[10px] transition-all focus:outline-none ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewPromo}
            className="bg-amber-500 text-white flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] hover:bg-amber-400 transition-all font-bold shadow-[0_4px_14px_rgba(247,158,10,0.3)] hover:shadow-[0_6px_20px_rgba(247,158,10,0.4)] hover:-translate-y-0.5 shrink-0 text-[14px]"
          >
            <Plus className="w-4 h-4" />
            Nova Promo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div data-tour="stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de Promos" value={stats?.overall?.totalPromos || promos.length} />
        <StatCard label="Destinos Ativos" value={stats?.overall?.uniqueDestinations || 0} />
        <StatCard
          label="Valor Medio"
          value={(stats?.overall?.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
        <StatCard label="Mais Buscado" value={stats?.overall?.mostPopularDestination?.name || "-"} />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && (
        <div data-tour="promo-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredPromos.map((promo, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.04 }}
                key={promo.id}
              >
                <PromoGridCard
                  promo={promo}
                  imageUrl={promoImages[promo.id]}
                  loadingImage={loadingPromoImages[promo.id]}
                  viewMode="grid"
                  onEdit={onEdit}
                  onGenerateImage={onGenerateImage}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === "list" && (
        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredPromos.map((promo, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.04 }}
                key={promo.id}
              >
                <PromoGridCard
                  promo={promo}
                  imageUrl={promoImages[promo.id]}
                  loadingImage={loadingPromoImages[promo.id]}
                  viewMode="list"
                  onEdit={onEdit}
                  onGenerateImage={onGenerateImage}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPromos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma promocao encontrada</h3>
          <p className="text-gray-500 mb-6">Comece criando sua primeira promocao</p>
          <button
            onClick={onNewPromo}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-[14px] hover:bg-amber-400 font-bold shadow-[0_4px_14px_rgba(247,158,10,0.3)] transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Promocao
          </button>
        </div>
      )}
    </div>
  )
}
