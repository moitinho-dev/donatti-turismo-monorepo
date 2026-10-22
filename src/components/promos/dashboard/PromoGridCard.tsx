"use client"

import { MapPin, Calendar, Edit2, Trash2, Loader2, Plane, PenTool, ImageIcon, Globe, EyeOff } from "lucide-react"
import type { PromoData } from "./types"
import { getPromoStatus, getRegimeLabel, formatPrice } from "./types"
import { getSectionLabel } from "@/lib/utils"

interface PromoGridCardProps {
  promo: PromoData
  imageUrl?: string
  loadingImage?: boolean
  publishing?: boolean
  viewMode?: "grid" | "list"
  onEdit: (promo: PromoData) => void
  onGenerateImage: (promo: PromoData) => void
  onDelete: (id: string) => void
  onTogglePublish: (promo: PromoData) => void
}

const STATUS_STYLE = {
  "no-site": { label: "No site", className: "bg-emerald-500 text-white" },
  rascunho: { label: "Rascunho", className: "bg-white/90 text-gray-700" },
  vencida: { label: "Vencida", className: "bg-red-600 text-white" },
} as const

export function PromoGridCard({
  promo,
  imageUrl,
  loadingImage,
  publishing,
  viewMode = "grid",
  onEdit,
  onGenerateImage,
  onDelete,
  onTogglePublish,
}: PromoGridCardProps) {
  const status = getPromoStatus(promo)
  const statusStyle = STATUS_STYLE[status]
  const regime = getRegimeLabel(promo)

  return (
    <div
      className={`bg-white rounded-[24px] border border-gray-200 overflow-hidden group/card hover:shadow-xl hover:border-amber-300/50 transition-all duration-300 flex h-full ${
        viewMode === "list" ? "flex-col sm:flex-row" : "flex-col"
      } ${status === "vencida" ? "opacity-80" : ""}`}
    >
      {/* Imagem */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 shrink-0 ${
          viewMode === "list" ? "sm:w-[280px] h-48 sm:h-auto" : "h-48 sm:h-[200px] w-full"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={promo.DESTINO}
            loading="lazy"
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
          />
        ) : loadingImage ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-[8px] text-[11px] font-black uppercase tracking-wide shadow-sm ${statusStyle.className}`}>
          {statusStyle.label}
        </span>

        {/* Ações: sempre visíveis em telas de toque, no hover no desktop */}
        <div className="absolute top-3 right-3 flex gap-2 transition-all duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => onEdit(promo)}
            title="Editar"
            aria-label={`Editar ${promo.DESTINO}`}
            className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl text-gray-700 hover:bg-white hover:text-amber-600 shadow-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGenerateImage(promo)}
            title="Editor visual"
            aria-label={`Abrir editor visual de ${promo.DESTINO}`}
            className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl text-amber-600 hover:bg-white shadow-lg transition-colors"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            title="Excluir"
            aria-label={`Excluir ${promo.DESTINO}`}
            className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl text-red-500 hover:bg-white hover:text-red-600 shadow-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
          <span className="bg-white/90 backdrop-blur-md text-gray-900 px-2.5 py-1 rounded-[8px] text-[12px] font-bold shadow-sm">
            {promo.NUMERO_DE_NOITES} noites
          </span>
          {promo.AEREO && (
            <span className="bg-amber-500 text-white px-2.5 py-1 rounded-[8px] text-[12px] font-bold shadow-sm flex items-center gap-1">
              <Plane className="w-3.5 h-3.5" />
              Aéreo
            </span>
          )}
          {promo.SITE_SECTION && (
            <span className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-[8px] text-[12px] font-semibold">
              {getSectionLabel(promo.SITE_SECTION).replace(/^Pacotes /, "")}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className={`p-4 sm:p-5 flex flex-col grow ${viewMode === "list" ? "justify-center" : ""}`}>
        <div className="mb-1">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight mb-1">{promo.DESTINO}</h3>
          <p className="text-gray-500 text-[13px] flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{promo.HOTEL}</span>
          </p>
        </div>

        <div className="bg-amber-50 mt-3 p-3.5 rounded-[16px] border border-amber-100">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 text-[12px] font-bold uppercase">{promo.PARCELAS || 15}x</span>
            <span className="text-amber-600 text-[24px] sm:text-[26px] font-black tracking-tighter leading-none">{formatPrice(promo)}</span>
          </div>
          <p className="text-gray-400 text-[11px] mt-1 font-medium">por pessoa</p>
        </div>

        <div className="flex justify-between items-center gap-2 mt-3 mb-4">
          <div className={`text-[12px] flex items-center gap-1.5 truncate font-medium ${status === "vencida" ? "text-red-600" : "text-gray-500"}`}>
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{promo.DATA_FORMATADA}</span>
          </div>
          {regime !== "-" && (
            <span className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-md shrink-0">
              {regime}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onTogglePublish(promo)}
            disabled={publishing || (status === "vencida" && !promo.SITE_PUBLISHED)}
            title={status === "vencida" && !promo.SITE_PUBLISHED ? "Data de ida já passou: edite as datas para publicar" : undefined}
            className={`flex justify-center items-center gap-1.5 px-3 py-3 rounded-[14px] font-bold transition-all text-[12px] sm:text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${
              promo.SITE_PUBLISHED
                ? "bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : promo.SITE_PUBLISHED ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {promo.SITE_PUBLISHED ? "Tirar do site" : "Publicar"}
          </button>
          <button
            type="button"
            onClick={() => onGenerateImage(promo)}
            className="bg-gray-900 hover:bg-gray-800 text-white flex justify-center items-center gap-1.5 px-3 py-3 rounded-[14px] font-bold transition-all active:scale-[0.98] text-[12px] sm:text-[13px]"
          >
            <ImageIcon className="w-4 h-4" />
            Gerar artes
          </button>
        </div>
      </div>
    </div>
  )
}
