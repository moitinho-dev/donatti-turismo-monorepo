"use client"
import { useState } from "react"
import type React from "react"

import { Loader2, Search, Filter, X } from "lucide-react"
import Image from "next/image"

interface ImageGalleryProps {
  images: any[]
  onSelectImage: (imageUrl: string) => void
  selectedImageUrl: string | null
  isLoading: boolean
  onSearch: (query: string) => void
  destination: string
}

export function ImageGallery({
  images,
  onSelectImage,
  selectedImageUrl,
  isLoading,
  onSearch,
  destination,
}: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterOrientation, setFilterOrientation] = useState<"all" | "landscape" | "portrait">("landscape")
  const [sortBy, setSortBy] = useState<"relevance" | "quality">("quality")

  // Filtrar imagens com base nas preferências do usuário
  const filteredImages = images.filter((img) => {
    // Filtrar por orientação
    if (filterOrientation !== "all") {
      if (img.width && img.height) {
        const isLandscape = img.width > img.height
        if (filterOrientation === "landscape" && !isLandscape) return false
        if (filterOrientation === "portrait" && isLandscape) return false
      }
    }
    return true
  })

  // Ordenar imagens com base nas preferências do usuário
  const sortedImages = [...filteredImages].sort((a, b) => {
    if (sortBy === "quality") {
      // Ordenar por qualidade (resolução)
      const resolutionA = (a.width || 0) * (a.height || 0)
      const resolutionB = (b.width || 0) * (b.height || 0)
      return resolutionB - resolutionA
    } else {
      // Ordenar por relevância (já feito pelo backend)
      return 0
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    onSearch(destination) // Voltar para a busca original
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Buscar imagens para ${destination}`}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors"
          >
            Buscar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            title="Filtros"
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {showFilters && (
          <div className="p-3 mb-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orientação</label>
                <select
                  value={filterOrientation}
                  onChange={(e) => setFilterOrientation(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="landscape">Paisagem</option>
                  <option value="portrait">Retrato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="quality">Qualidade</option>
                  <option value="relevance">Relevância</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </div>
      ) : sortedImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto p-1">
          {sortedImages.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className={`relative aspect-video cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                selectedImageUrl === image.urls.regular
                  ? "border-primary-blue scale-95 shadow-md"
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => onSelectImage(image.urls.regular)}
            >
              <Image
                src={image.urls.small || image.urls.thumb}
                alt={image.description || `Imagem de ${destination}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 150px, 200px"
                crossOrigin="anonymous"
              />
              {image.source && (
                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 rounded-tl-md">
                  {image.source}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500 text-center">
            Nenhuma imagem encontrada para {destination}.<br />
            Tente uma busca diferente.
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>Dica: Busque termos específicos como "Rio de Janeiro Cristo Redentor" para resultados mais precisos.</p>
      </div>
    </div>
  )
}
