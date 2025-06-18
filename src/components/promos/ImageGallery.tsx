"use client"
import { useState, useEffect } from "react"
import { Search, Loader2, Image as ImageIcon, RefreshCw } from "lucide-react"

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
  const [hasSearched, setHasSearched] = useState(false)

  // Buscar automaticamente quando o componente carrega
  useEffect(() => {
    if (destination && !hasSearched) {
      onSearch(destination)
      setHasSearched(true)
    }
  }, [destination, onSearch, hasSearched])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleRefresh = () => {
    onSearch(destination)
  }

  const handleImageSelect = (imageUrl: string) => {
    onSelectImage(imageUrl)
  }

  // Sugestões de busca baseadas no destino
  const getSearchSuggestions = (dest: string) => {
    const suggestions = []
    const destLower = dest.toLowerCase()
    
    if (destLower.includes("rio")) {
      suggestions.push("cristo redentor", "copacabana", "pão de açúcar")
    } else if (destLower.includes("salvador")) {
      suggestions.push("pelourinho", "elevador lacerda", "farol da barra")
    } else if (destLower.includes("natal")) {
      suggestions.push("ponta negra", "dunas", "forte dos reis magos")
    } else if (destLower.includes("florianópolis") || destLower.includes("florianopolis")) {
      suggestions.push("ponte hercílio luz", "lagoa da conceição", "praia mole")
    } else {
      suggestions.push("pontos turísticos", "paisagem", "centro histórico")
    }
    
    return suggestions
  }

  const suggestions = getSearchSuggestions(destination)

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
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
        </div>
        
        {/* Refresh button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-primary-blue transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar imagens
          </button>
          <span className="text-xs text-gray-500">
            {images.length} imagens encontradas
          </span>
        </div>
      </form>

      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Sugestões de busca:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion)
                  onSearch(suggestion)
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-primary-blue hover:text-white transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

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
              key={`${image.id}-${index}`}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                selectedImageUrl === image.urls.regular
                  ? "border-primary-blue shadow-lg ring-2 ring-primary-blue ring-opacity-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleImageSelect(image.urls.regular)}
            >
              <img
                src={image.urls.small || "/placeholder.svg"}
                alt={image.alt_description || `Imagem de ${destination}`}
                className="w-full h-24 object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback para imagem quebrada
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
              
              {/* Overlay para imagem selecionada */}
              {selectedImageUrl === image.urls.regular && (
                <div className="absolute inset-0 bg-primary-blue bg-opacity-20 flex items-center justify-center">
                  <div className="bg-primary-blue text-white rounded-full p-1">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-xs truncate">
                  {image.alt_description || "Imagem do destino"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No images state */}
      {!isLoading && images.length === 0 && hasSearched && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">Nenhuma imagem encontrada</p>
          <p className="text-xs mb-3">Tente buscar por termos diferentes ou mais específicos</p>
          <button
            onClick={handleRefresh}
            className="text-primary-blue hover:underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Initial state */}
      {!isLoading && images.length === 0 && !hasSearched && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Carregando imagens do destino...</p>
        </div>
      )}
    </div>
  )
}