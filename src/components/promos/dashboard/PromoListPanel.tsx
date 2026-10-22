"use client"

import { useMemo, useState } from "react"
import { Search, LayoutGrid, List, Loader2, FileText, Plus, AlertTriangle, ChevronDown, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PromoGridCard } from "./PromoGridCard"
import type { PromoData, ViewMode } from "./types"
import { getPromoStatus, getRegimeLabel } from "./types"
import { getSectionLabel, getPriceNumber, parsePromoDates } from "@/lib/utils"

type StatusFilter = "todas" | "no-site" | "rascunho" | "vencida"
type SortMode = "recentes" | "proxima-saida" | "menor-preco"

interface PromoListPanelProps {
  promos: PromoData[]
  isLoading: boolean
  error: string | null
  promoImages: Record<string, string>
  loadingPromoImages: Record<string, boolean>
  publishingIds: Record<string, boolean>
  onEdit: (promo: PromoData) => void
  onGenerateImage: (promo: PromoData) => void
  onDelete: (id: string) => void
  onNewPromo: () => void
  onTogglePublish: (promo: PromoData) => void
  onUnpublishExpired: (promos: PromoData[]) => void
}

function StatCard({
  label,
  value,
  active,
  tone = "default",
  onClick,
}: {
  label: string
  value: string | number
  active?: boolean
  tone?: "default" | "success" | "danger"
  onClick?: () => void
}) {
  const toneClass = tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-red-600" : "text-gray-900"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left bg-white p-4 sm:p-5 rounded-[20px] border shadow-sm transition-all ${
        active ? "border-amber-400 ring-2 ring-amber-500/20" : "border-gray-200 hover:border-amber-300"
      }`}
    >
      <p className="text-gray-400 text-[11px] sm:text-[12px] uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className={`text-2xl font-black truncate tracking-tight ${toneClass}`}>{value}</p>
    </button>
  )
}

const selectClass =
  "appearance-none bg-gray-50 border border-gray-200 rounded-[14px] pl-4 pr-9 py-3 text-gray-700 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[13px] cursor-pointer"

export function PromoListPanel({
  promos,
  isLoading,
  error,
  promoImages,
  loadingPromoImages,
  publishingIds,
  onEdit,
  onGenerateImage,
  onDelete,
  onNewPromo,
  onTogglePublish,
  onUnpublishExpired,
}: PromoListPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas")
  const [sectionFilter, setSectionFilter] = useState("todas")
  const [sortMode, setSortMode] = useState<SortMode>("recentes")

  const counts = useMemo(() => {
    const c = { total: promos.length, noSite: 0, rascunho: 0, vencida: 0 }
    for (const p of promos) {
      const status = getPromoStatus(p)
      if (status === "no-site") c.noSite++
      else if (status === "rascunho") c.rascunho++
      else c.vencida++
    }
    return c
  }, [promos])

  const expiredOnSite = useMemo(
    () => promos.filter((p) => getPromoStatus(p) === "vencida" && p.SITE_PUBLISHED),
    [promos],
  )

  const sections = useMemo(
    () => Array.from(new Set(promos.map((p) => p.SITE_SECTION).filter(Boolean))) as string[],
    [promos],
  )

  const filteredPromos = useMemo(() => {
    const q = searchQuery
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
    const list = promos.filter((promo) => {
      if (statusFilter !== "todas" && getPromoStatus(promo) !== statusFilter) return false
      if (sectionFilter !== "todas" && promo.SITE_SECTION !== sectionFilter) return false
      if (!q) return true
      const text = [promo.DESTINO, promo.HOTEL, promo.DATA_FORMATADA, getRegimeLabel(promo), promo.createdByName]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
      return text.includes(q)
    })

    if (sortMode === "proxima-saida") {
      const time = (p: PromoData) => parsePromoDates(p.DATA_FORMATADA).start?.getTime() ?? Number.MAX_SAFE_INTEGER
      return [...list].sort((a, b) => time(a) - time(b))
    }
    if (sortMode === "menor-preco") {
      return [...list].sort((a, b) => getPriceNumber(a.VALOR) - getPriceNumber(b.VALOR))
    }
    return list
  }, [promos, searchQuery, statusFilter, sectionFilter, sortMode])

  const hasFilters = statusFilter !== "todas" || sectionFilter !== "todas" || searchQuery.trim() !== ""
  const clearFilters = () => {
    setStatusFilter("todas")
    setSectionFilter("todas")
    setSearchQuery("")
  }

  const showSpinner = isLoading && promos.length === 0

  return (
    <div className="max-w-7xl mx-auto">
      {/* Indicadores (clicáveis = filtro) */}
      <div data-tour="stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Todas" value={counts.total} active={statusFilter === "todas"} onClick={() => setStatusFilter("todas")} />
        <StatCard
          label="No site"
          value={counts.noSite}
          tone="success"
          active={statusFilter === "no-site"}
          onClick={() => setStatusFilter("no-site")}
        />
        <StatCard
          label="Rascunhos"
          value={counts.rascunho}
          active={statusFilter === "rascunho"}
          onClick={() => setStatusFilter("rascunho")}
        />
        <StatCard
          label="Vencidas"
          value={counts.vencida}
          tone={counts.vencida ? "danger" : "default"}
          active={statusFilter === "vencida"}
          onClick={() => setStatusFilter("vencida")}
        />
      </div>

      {expiredOnSite.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-[16px] border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm">
            <strong>{expiredOnSite.length}</strong> promo{expiredOnSite.length > 1 ? "s" : ""} com data de ida já passada
            {expiredOnSite.length > 1 ? " continuam marcadas" : " continua marcada"} como publicada. O site já esconde, mas vale
            limpar.
          </p>
          <button
            type="button"
            onClick={() => onUnpublishExpired(expiredOnSite)}
            className="shrink-0 rounded-[12px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            Tirar vencidas do site
          </button>
        </div>
      )}

      {/* Busca, filtros e ações */}
      <div className="bg-white rounded-[20px] border border-gray-200 p-3 shadow-sm mb-6 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar destino, hotel, data ou agente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-[14px] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all hover:border-amber-400/50 text-[16px] sm:text-[14px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <select aria-label="Seção do site" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className={`${selectClass} w-full`}>
              <option value="todas">Todas as seções</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {getSectionLabel(s)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <select aria-label="Ordenar" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className={`${selectClass} w-full`}>
              <option value="recentes">Mais recentes</option>
              <option value="proxima-saida">Próxima saída</option>
              <option value="menor-preco">Menor preço</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden sm:flex bg-gray-50 items-center p-1 rounded-[14px] border border-gray-200 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Ver em grade"
              aria-pressed={viewMode === "grid"}
              className={`p-2.5 rounded-[10px] transition-all focus:outline-none ${
                viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="Ver em lista"
              aria-pressed={viewMode === "list"}
              className={`p-2.5 rounded-[10px] transition-all focus:outline-none ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewPromo}
            className="w-full sm:w-auto bg-amber-500 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] hover:bg-amber-400 transition-all font-bold shadow-[0_4px_14px_rgba(247,158,10,0.3)] shrink-0 text-[14px]"
          >
            <Plus className="w-4 h-4" />
            Nova promo
          </button>
        </div>
      </div>

      {hasFilters && !showSpinner && (
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {filteredPromos.length} de {promos.length} promos
          </span>
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700">
            <X className="h-4 w-4" /> Limpar filtros
          </button>
        </div>
      )}

      {showSpinner && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-red-700 mb-6">{error}</div>}

      {!showSpinner && filteredPromos.length > 0 && (
        <div
          data-tour="promo-list"
          className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" : "grid grid-cols-1 gap-4 sm:gap-5"}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredPromos.map((promo, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(index, 12) * 0.03 }}
                key={promo.id}
              >
                <PromoGridCard
                  promo={promo}
                  imageUrl={promoImages[promo.id]}
                  loadingImage={loadingPromoImages[promo.id]}
                  publishing={!!publishingIds[promo.id]}
                  viewMode={viewMode}
                  onEdit={onEdit}
                  onGenerateImage={onGenerateImage}
                  onDelete={onDelete}
                  onTogglePublish={onTogglePublish}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!showSpinner && filteredPromos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-300" />
          </div>
          {promos.length > 0 ? (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma promo com esses filtros</h3>
              <button type="button" onClick={clearFilters} className="font-semibold text-amber-600 hover:text-amber-700">
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma promo ainda</h3>
              <p className="text-gray-500 mb-6">Crie a primeira ou arraste o PDF do fornecedor no formulário.</p>
              <button
                onClick={onNewPromo}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-[14px] hover:bg-amber-400 font-bold shadow-[0_4px_14px_rgba(247,158,10,0.3)] transition-all"
              >
                <Plus className="h-4 w-4" />
                Nova promo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
