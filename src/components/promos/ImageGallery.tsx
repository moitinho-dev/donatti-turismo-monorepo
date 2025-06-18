"use client"
import { useState } from "react"
import { Search, Loader2, Image as ImageIcon } from "lucide-react"

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
  destination 
}: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    onSelectImage(imageUrl)
  }

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar imagens para ${destination}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!searchQuery.trim() || isLoading}
          className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-50 text-sm"
        >
          Buscar
        </button>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-blue" />
          <span className="ml-2 text-sm text-gray-600">Buscando imagens...</span>
        </div>
      )}

      {/* Images grid */}
      {!isLoading && images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                selectedImageUrl === image.urls.regular
                  ? "border-primary-blue shadow-lg"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleImageSelect(image.urls.regular)}
            >
              <img
                src={image.urls.small || "/placeholder.svg"}
                alt={image.alt_description || "Imagem do destino"}
                className="w-full h-24 object-cover"
              />
              {selectedImageUrl === image.urls.regular && (
                <div className="absolute inset-0 bg-primary-blue bg-opacity-20 flex items-center justify-center">
                  <div className="bg-primary-blue text-white rounded-full p-1">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No images state */}
      {!isLoading && images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhuma imagem encontrada</p>
          <p className="text-xs">Tente buscar por termos diferentes</p>
        </div>
      )}
    </div>
  )
}