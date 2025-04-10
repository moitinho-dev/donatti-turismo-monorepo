"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageGalleryProps {
  images: any[]
  onSelectImage: (imageUrl: string) => void
  selectedImageUrl: string | null
  isLoading: boolean
}

export function ImageGallery({ images, onSelectImage, selectedImageUrl, isLoading }: ImageGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-4" />
        <p className="text-sm text-gray-500">Carregando imagens...</p>
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <p className="text-sm text-gray-500">Nenhuma imagem encontrada para este destino.</p>
      </div>
    )
  }

  return (
    <div className="h-[600px] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className={`relative cursor-pointer rounded-md overflow-hidden transition-all duration-200 ${
              selectedImageUrl === image.urls.regular ? "ring-2 ring-primary-blue" : ""
            }`}
            onClick={() => onSelectImage(image.urls.regular)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="aspect-w-16 aspect-h-9 w-full">
              <Image
                src={image.urls.small || image.urls.thumb}
                alt={image.alt_description || "Imagem do destino"}
                width={400}
                height={225}
                className="object-cover w-full h-full"
                style={{ objectFit: "cover" }}
              />
            </div>
            {hoveredIndex === index && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <span className="text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-50 rounded">
                  Selecionar
                </span>
              </div>
            )}
            {selectedImageUrl === image.urls.regular && (
              <div className="absolute top-2 right-2 bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-full">
                Selecionada
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
              {image.user?.name || "Desconhecido"} • {image.source || ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
