"use client"

import {
  MapPin,
  Hotel,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  Plane,
  ImagePlus,
  ImageIcon,
} from "lucide-react"
import type { PromoData } from "./types"
import { getRegimeLabel, formatPrice } from "./types"

interface PromoGridCardProps {
  promo: PromoData
  imageUrl?: string
  loadingImage?: boolean
  onEdit: (promo: PromoData) => void
  onGenerateImage: (promo: PromoData) => void
  onDelete: (id: string) => void
}

export function PromoGridCard({
  promo,
  imageUrl,
  loadingImage,
  onEdit,
  onGenerateImage,
  onDelete,
}: PromoGridCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* Image Header */}
      <div className="relative h-40 bg-gradient-to-br from-[#F59E0B] to-[#efaa34] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={promo.DESTINO}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(promo)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
            title="Editar"
          >
            <Edit2 className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={() => onGenerateImage(promo)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
            title="Abrir Editor"
          >
            <ImagePlus className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 shadow-sm">
            {promo.NUMERO_DE_NOITES} noites
          </span>
          {promo.AEREO && (
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Plane className="h-3 w-3" />
              Aereo
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-lg">{promo.DESTINO}</h3>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
              <Hotel className="h-3.5 w-3.5" />
              {promo.HOTEL}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500">{promo.PARCELAS || 15}x de</span>
            <span className="text-xl font-bold text-blue-600">{formatPrice(promo)}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">por pessoa no cartao</p>
        </div>

        {/* Info Row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{promo.DATA_FORMATADA}</span>
          </div>
          {(promo.COM_CAFE || promo.ALL_INCLUSIVE || promo.MEIA_PENSAO || promo.PENSAO_COMPLETA) && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
              {getRegimeLabel(promo)}
            </span>
          )}
        </div>

        <button
          onClick={() => onGenerateImage(promo)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          <ImageIcon className="h-4 w-4" />
          Gerar Imagem
        </button>
      </div>
    </div>
  )
}
