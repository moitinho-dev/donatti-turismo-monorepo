"use client"

import {
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  Plane,
  PenTool,
  ImageIcon,
} from "lucide-react"
import type { PromoData } from "./types"
import { getRegimeLabel, formatPrice } from "./types"

interface PromoGridCardProps {
  promo: PromoData
  imageUrl?: string
  loadingImage?: boolean
  viewMode?: "grid" | "list"
  onEdit: (promo: PromoData) => void
  onGenerateImage: (promo: PromoData) => void
  onDelete: (id: string) => void
}

export function PromoGridCard({
  promo,
  imageUrl,
  loadingImage,
  viewMode = "grid",
  onEdit,
  onGenerateImage,
  onDelete,
}: PromoGridCardProps) {
  return (
    <div
      className={`bg-white rounded-[24px] border border-gray-200 overflow-hidden group/card hover:shadow-2xl hover:border-amber-300/50 transition-all duration-500 flex ${
        viewMode === "list" ? "flex-col sm:flex-row" : "flex-col"
      }`}
    >
      {/* Image Section */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 shrink-0 ${
          viewMode === "list" ? "sm:w-[300px] h-56 sm:h-auto" : "h-[220px] w-full"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={promo.DESTINO}
            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-all duration-300 md:translate-y-2 md:group-hover/card:translate-y-0">
          <button
            onClick={() => onEdit(promo)}
            title="Editar"
            className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-gray-700 hover:bg-white hover:text-amber-600 shadow-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGenerateImage(promo)}
            title="Editor Visual"
            className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-amber-600 hover:bg-white shadow-lg transition-colors"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            title="Excluir"
            className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-red-500 hover:bg-white hover:text-red-600 shadow-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div className="flex gap-2">
            <span className="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-[10px] text-[12px] font-bold shadow-sm">
              {promo.NUMERO_DE_NOITES} noites
            </span>
            {promo.AEREO && (
              <span className="bg-amber-500 text-white px-3 py-1.5 rounded-[10px] text-[12px] font-bold shadow-sm flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                Aereo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className={`p-5 flex flex-col grow ${viewMode === "list" ? "justify-center" : ""}`}>
        <div className="mb-1">
          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-1">{promo.DESTINO}</h3>
          <p className="text-gray-500 text-[13px] flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{promo.HOTEL}</span>
          </p>
        </div>

        {/* Price Box */}
        <div className="bg-amber-50 mt-4 p-4 rounded-[16px] border border-amber-100 relative overflow-hidden group-hover/card:bg-amber-100/50 transition-colors">
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-gray-500 text-[12px] font-bold uppercase">{promo.PARCELAS || 15}x</span>
            <span className="text-amber-600 text-[28px] font-black tracking-tighter leading-none">{formatPrice(promo)}</span>
          </div>
          <p className="text-gray-400 text-[11px] mt-1 font-medium relative z-10">por pessoa</p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-200/50 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Info Row */}
        <div className="flex justify-between items-center mt-4 mb-6">
          <div className="text-gray-500 text-[12px] flex items-center gap-1.5 truncate pr-2 font-medium">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-700" />
            <span className="truncate">{promo.DATA_FORMATADA}</span>
          </div>
          {(promo.COM_CAFE || promo.ALL_INCLUSIVE || promo.MEIA_PENSAO || promo.PENSAO_COMPLETA || promo.SEM_CAFE) && (
            <span className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md shrink-0">
              {getRegimeLabel(promo)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <button
            onClick={() => onGenerateImage(promo)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white flex justify-center items-center gap-2 px-5 py-3 rounded-[14px] font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-[13px]"
          >
            <ImageIcon className="w-4 h-4" />
            GERAR IMAGENS
          </button>
        </div>
      </div>
    </div>
  )
}
