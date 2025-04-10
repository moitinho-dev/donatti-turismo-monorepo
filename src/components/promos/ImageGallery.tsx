"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2, Search, X, RefreshCw } from "lucide-react"
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid")

  // Inicializa a busca com o destino atual
  useEffect(() => {
    setSearchQuery(destination)
  }, [destination])

  // Filtra as imagens por fonte
  const filteredImages = activeFilter ? images.filter((img) => img.source === activeFilter) : images

  // Obtém as fontes disponíveis para filtros
  const availableSources = [...new Set(images.map((img) => img.source))].filter(Boolean)

  // Função para lidar com a busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery)
    }
  }

  // Função para limpar a busca
  const clearSearch = () => {
    setSearchQuery(destination)
    onSearch(destination)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-4" />
        <p className="text-sm text-gray-500">Carregando imagens...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de busca */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar imagens para este destino..."
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

          {searchQuery !== destination && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-blue hover:text-second-blue"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Filtros e controles */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-2 py-1 text-xs rounded-full ${
              activeFilter === null ? "bg-primary-blue text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todas
          </button>

          {availableSources.map((source) => (
            <button
              key={source}
              onClick={() => setActiveFilter(source === activeFilter ? null : source)}
              className={`px-2 py-1 text-xs rounded-full capitalize ${
                activeFilter === source ? "bg-primary-blue text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {source}
            </button>
          ))}
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded ${viewMode === "grid" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"}`}
            title="Visualização em grade"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button
            onClick={() => setViewMode("large")}
            className={`p-1 rounded ${viewMode === "large" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"}`}
            title="Visualização ampliada"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-xs text-gray-500 mb-3">
        {filteredImages.length} {filteredImages.length === 1 ? "imagem encontrada" : "imagens encontradas"}
      </div>

      {/* Galeria de imagens */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-2">Nenhuma imagem encontrada para este destino.</p>
          <p className="text-xs text-gray-400">Tente uma busca diferente ou outro destino.</p>
        </div>
      ) : (
        <div className="h-[500px] overflow-y-auto pr-2 bg-gray-50 rounded-lg p-2">
          <div className={`${viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-4"}`}>
            {filteredImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className={`relative cursor-pointer rounded-md overflow-hidden transition-all duration-200 ${
                  selectedImageUrl === image.urls.regular
                    ? "ring-2 ring-primary-blue"
                    : "hover:ring-1 hover:ring-gray-300"
                } ${viewMode === "large" ? "h-64" : ""}`}
                onClick={() => onSelectImage(image.urls.regular)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className={`${viewMode === "grid" ? "aspect-w-16 aspect-h-9" : "h-full"} w-full`}>
                  <Image
                    src={image.urls.small || image.urls.thumb}
                    alt={image.alt_description || "Imagem do destino"}
                    width={viewMode === "grid" ? 400 : 800}
                    height={viewMode === "grid" ? 225 : 450}
                    className="object-cover w-full h-full"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Overlay de seleção */}
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="text-white text-xs font-medium px-3 py-1.5 bg-black bg-opacity-60 rounded-full">
                      Selecionar esta imagem
                    </span>
                  </div>
                )}

                {/* Indicador de imagem selecionada */}
                {selectedImageUrl === image.urls.regular && (
                  <div className="absolute top-2 right-2 bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-full">
                    Selecionada
                  </div>
                )}

                {/* Informações da imagem */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-6 pb-2 px-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs truncate max-w-[70%]">
                      {image.user?.name || "Desconhecido"}
                    </span>
                    <span className="text-white text-xs bg-black bg-opacity-50 px-1.5 py-0.5 rounded-full capitalize">
                      {image.source || ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
