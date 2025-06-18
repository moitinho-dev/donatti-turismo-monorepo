"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { toPng } from "html-to-image"
import { Loader2, Download, ImageIcon, Settings, Palette, Type, Move } from "lucide-react"
import { ImageGallery } from "./ImageGallery"

interface PromoImageGeneratorProps {
  promo: any
}

interface LayoutConfig {
  id: string
  name: string
  backgroundType: 'png' | 'svg'
  backgroundUrl: string
  elements: {
    [key: string]: {
      x: number
      y: number
      fontSize: number
      fontWeight: string
      color: string
      fontFamily: string
      maxWidth?: number
      textAlign?: string
    }
  }
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

const defaultLayouts: LayoutConfig[] = [
  {
    id: 'layout-1',
    name: 'Layout Padrão (PNG)',
    backgroundType: 'png',
    backgroundUrl: '/assets/LAYOUTFINAL.png',
    elements: {
      region: { x: 270, y: 70, fontSize: 48, fontWeight: '900', color: '#9b0a0a', fontFamily: 'Inter' },
      destination: { x: 360, y: 480, fontSize: 60, fontWeight: '900', color: '#ffffff', fontFamily: 'Inter' },
      hotel: { x: 450, y: 480, fontSize: 40, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      dateRange: { x: 530, y: 480, fontSize: 40, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      installments: { x: 620, y: 510, fontSize: 30, fontWeight: '700', color: '#9b0a0a', fontFamily: 'Inter' },
      currency: { x: 660, y: 510, fontSize: 60, fontWeight: '900', color: '#9b0a0a', fontFamily: 'Inter' },
      price: { x: 605, y: 600, fontSize: 126, fontWeight: '900', color: '#9b0a0a', fontFamily: 'Inter' },
      paymentInfo: { x: 760, y: 518, fontSize: 28, fontWeight: '600', color: '#9b0a0a', fontFamily: 'Inter' },
      flight: { x: 835, y: 545, fontSize: 30, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      perPerson: { x: 885, y: 545, fontSize: 30, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      nights: { x: 935, y: 545, fontSize: 30, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      regime: { x: 980, y: 545, fontSize: 30, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      departureLabel: { x: 1070, y: 410, fontSize: 20, fontWeight: '700', color: '#9b0a0a', fontFamily: 'Inter' },
      departure: { x: 1100, y: 410, fontSize: 20, fontWeight: '900', color: '#9b0a0a', fontFamily: 'Inter' },
      disclaimer: { x: 1160, y: 490, fontSize: 20, fontWeight: '500', color: '#ffffff', fontFamily: 'Inter', maxWidth: 500, textAlign: 'center' },
      contactLabel: { x: 1250, y: 580, fontSize: 30, fontWeight: '700', color: '#9b0a0a', fontFamily: 'Inter' },
      contact: { x: 1285, y: 580, fontSize: 30, fontWeight: '700', color: '#9b0a0a', fontFamily: 'Inter' }
    },
    colors: {
      primary: '#9b0a0a',
      secondary: '#ffffff',
      accent: '#FED400'
    }
  },
  {
    id: 'layout-2',
    name: 'Layout SVG Editável',
    backgroundType: 'svg',
    backgroundUrl: '/assets/promos-layout.svg',
    elements: {
      region: { x: 200, y: 150, fontSize: 48, fontWeight: '900', color: '#002043', fontFamily: 'Inter' },
      destination: { x: 300, y: 400, fontSize: 60, fontWeight: '900', color: '#ffffff', fontFamily: 'Inter' },
      hotel: { x: 350, y: 450, fontSize: 40, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      dateRange: { x: 400, y: 500, fontSize: 40, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      installments: { x: 500, y: 600, fontSize: 30, fontWeight: '700', color: '#f5a406', fontFamily: 'Inter' },
      currency: { x: 550, y: 650, fontSize: 60, fontWeight: '900', color: '#f5a406', fontFamily: 'Inter' },
      price: { x: 600, y: 700, fontSize: 100, fontWeight: '900', color: '#f5a406', fontFamily: 'Inter' },
      paymentInfo: { x: 750, y: 800, fontSize: 24, fontWeight: '600', color: '#f5a406', fontFamily: 'Inter' },
      flight: { x: 850, y: 900, fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      perPerson: { x: 900, y: 950, fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      nights: { x: 950, y: 1000, fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      regime: { x: 1000, y: 1050, fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter' },
      departureLabel: { x: 1100, y: 1150, fontSize: 18, fontWeight: '700', color: '#f5a406', fontFamily: 'Inter' },
      departure: { x: 1150, y: 1200, fontSize: 18, fontWeight: '900', color: '#f5a406', fontFamily: 'Inter' },
      disclaimer: { x: 1250, y: 1300, fontSize: 16, fontWeight: '500', color: '#ffffff', fontFamily: 'Inter', maxWidth: 400, textAlign: 'center' },
      contactLabel: { x: 1400, y: 1450, fontSize: 26, fontWeight: '700', color: '#f5a406', fontFamily: 'Inter' },
      contact: { x: 1450, y: 1500, fontSize: 26, fontWeight: '700', color: '#f5a406', fontFamily: 'Inter' }
    },
    colors: {
      primary: '#002043',
      secondary: '#f5a406',
      accent: '#ffffff'
    }
  }
]

export function PromoImageGenerator({ promo }: PromoImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [destinationImage, setDestinationImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableImages, setAvailableImages] = useState<any[]>([])
  const [customSearchQuery, setCustomSearchQuery] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(defaultLayouts[0])
  const [isEditing, setIsEditing] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const templateRef = useRef<HTMLDivElement>(null)

  // Calculate values
  const baseValue = Number.parseFloat(promo.VALOR)
  const parcelas = Number.parseInt(promo.PARCELAS || "10", 10)

  useEffect(() => {
    const loadFonts = async () => {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    loadFonts()
    setSelectedRegion(getRegion(promo.DESTINO))
  }, [promo.DESTINO])

  useEffect(() => {
    if (promo.DESTINO) {
      fetchDestinationImages()
    }
  }, [promo.DESTINO])

  const fetchDestinationImages = async (customQuery?: string) => {
    const searchQuery = customQuery || promo.DESTINO
    if (!searchQuery) return

    setIsLoadingImage(true)
    setError(null)
    setCustomSearchQuery(customQuery || null)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(searchQuery)}&limit=30`)

      if (!response.ok) {
        throw new Error("Failed to fetch destination images")
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setAvailableImages(data.results)
        if (!destinationImage) {
          setDestinationImage(data.results[0].urls.regular)
        }
      } else {
        setError("Não foi possível encontrar imagens para este destino")
        setAvailableImages([])
      }
    } catch (err) {
      console.error("Error fetching destination images:", err)
      setError("Erro ao buscar imagens do destino")
      setAvailableImages([])
    } finally {
      setIsLoadingImage(false)
    }
  }

  const getRegion = (destination: string) => {
    const dest = destination.toLowerCase().trim()
    // ... (manter a lógica existente de getRegion)
    const northeastCities = ["natal", "recife", "fortaleza", "salvador", "maceió", "maceio"]
    const southCities = ["florianópolis", "florianopolis", "porto alegre", "gramado", "curitiba"]
    const southeastCities = ["rio de janeiro", "são paulo", "sao paulo", "belo horizonte"]
    const centralCities = ["brasília", "brasilia", "goiânia", "goiania", "cuiabá", "cuiaba"]
    const northCities = ["manaus", "belém", "belem", "palmas"]
    const internationalKeywords = ["cancun", "miami", "orlando", "nova york", "paris", "londres"]

    if (northeastCities.some(city => dest.includes(city))) return "Nordeste"
    if (southCities.some(city => dest.includes(city))) return "Sul"
    if (southeastCities.some(city => dest.includes(city))) return "Sudeste"
    if (centralCities.some(city => dest.includes(city))) return "Centro-Oeste"
    if (northCities.some(city => dest.includes(city))) return "Norte"
    if (internationalKeywords.some(keyword => dest.includes(keyword))) return "Exterior"
    return "Brasil"
  }

  const getRegimeAlimentacao = () => {
    if (promo.ALL_INCLUSIVE) return "All inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão completa"
    if (promo.MEIA_PENSAO) return "Meia pensão"
    if (promo.COM_CAFE) return "Com café da manhã"
    if (promo.SEM_CAFE) return "Sem café da manhã"
    return "Sem café da manhã"
  }

  const getDepartureAirport = () => {
    if (promo.CG && !promo.SP) return "Campo Grande (CGR)"
    if (promo.SP && !promo.CG) return "São Paulo (GRU)"
    if (promo.CG && promo.SP) return "Campo Grande (CGR) ou São Paulo (GRU)"
    return "Campo Grande (CGR)"
  }

  const formatDateRange = () => {
    try {
      const datePattern = /(\d{1,2})\/(\d{1,2}) até (\d{1,2})\/(\d{1,2}) de (\d{4})/
      const match = promo.DATA_FORMATADA.match(datePattern)
      if (match) {
        const [_, startDay, startMonth, endDay, endMonth, year] = match
        return `${startDay}/${startMonth} até ${endDay}/${endMonth} de ${year}`
      }
      return promo.DATA_FORMATADA
    } catch (error) {
      console.error("Error formatting date range:", error)
      return promo.DATA_FORMATADA
    }
  }

  const generateImage = async () => {
    if (!templateRef.current) return

    setIsGenerating(true)

    try {
      const template = templateRef.current
      const originalTransform = template.style.transform
      template.style.transform = ""

      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(template, {
        quality: 1.0,
        width: 1080,
        height: 1920,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }
      })

      template.style.transform = originalTransform

      const link = document.createElement("a")
      link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error generating image:", error)
      setError("Erro ao gerar imagem. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    setDestinationImage(imageUrl)
  }

  const handleCustomSearch = (query: string) => {
    fetchDestinationImages(query)
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value)
  }

  const handleLayoutChange = (layoutId: string) => {
    const layout = defaultLayouts.find(l => l.id === layoutId)
    if (layout) {
      setCurrentLayout(layout)
    }
  }

  const handleElementClick = (elementKey: string, event: React.MouseEvent) => {
    if (isEditing) {
      event.stopPropagation()
      setSelectedElement(elementKey)
    }
  }

  const handleMouseDown = (elementKey: string, event: React.MouseEvent) => {
    if (isEditing && selectedElement === elementKey) {
      setIsDragging(true)
      const rect = event.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && selectedElement && templateRef.current) {
      const templateRect = templateRef.current.getBoundingClientRect()
      const scale = 0.5 // Considerando o scale aplicado
      
      const newX = (event.clientX - templateRect.left - dragOffset.x) / scale
      const newY = (event.clientY - templateRect.top - dragOffset.y) / scale

      setCurrentLayout(prev => ({
        ...prev,
        elements: {
          ...prev.elements,
          [selectedElement]: {
            ...prev.elements[selectedElement],
            x: Math.max(0, Math.min(1080, newX)),
            y: Math.max(0, Math.min(1920, newY))
          }
        }
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updateElementStyle = (elementKey: string, property: string, value: any) => {
    setCurrentLayout(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementKey]: {
          ...prev.elements[elementKey],
          [property]: value
        }
      }
    }))
  }

  const updateLayoutColor = (colorKey: string, value: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }))
  }

  const saveLayout = () => {
    const layoutName = prompt("Nome do layout:")
    if (layoutName) {
      const newLayout = {
        ...currentLayout,
        id: `layout-${Date.now()}`,
        name: layoutName
      }
      // Aqui você pode salvar no localStorage ou enviar para uma API
      localStorage.setItem(`layout-${newLayout.id}`, JSON.stringify(newLayout))
      alert("Layout salvo com sucesso!")
    }
  }

  const getElementContent = (elementKey: string) => {
    switch (elementKey) {
      case 'region': return selectedRegion
      case 'destination': return promo.DESTINO
      case 'hotel': return promo.HOTEL
      case 'dateRange': return formatDateRange()
      case 'installments': return `${parcelas}x de`
      case 'currency': return 'R$'
      case 'price': return baseValue.toFixed(2).replace(".", ",")
      case 'paymentInfo': return 'no cartão e 10x no boleto sem juros.'
      case 'flight': return 'Aéreo Ida e Volta'
      case 'perPerson': return 'Valor por pessoa'
      case 'nights': return `${promo.NUMERO_DE_NOITES} Noites`
      case 'regime': return getRegimeAlimentacao()
      case 'departureLabel': return 'saindo de'
      case 'departure': return getDepartureAirport()
      case 'disclaimer': return 'Preço por pessoa em apartamento duplo, sujeito a alteração sem aviso prévio, taxas inclusas.'
      case 'contactLabel': return 'Contato e Whatsapp'
      case 'contact': return '(67) 9 9637-2769'
      default: return ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controles do Editor */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <select
                value={currentLayout.id}
                onChange={(e) => handleLayoutChange(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                {defaultLayouts.map(layout => (
                  <option key={layout.id} value={layout.id}>{layout.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
              <select
                value={selectedRegion}
                onChange={handleRegionChange}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                <option value="Nordeste">Nordeste</option>
                <option value="Sul">Sul</option>
                <option value="Sudeste">Sudeste</option>
                <option value="Norte">Norte</option>
                <option value="Centro-Oeste">Centro-Oeste</option>
                <option value="Exterior">Exterior</option>
                <option value="Brasil">Brasil</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isEditing 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-primary-blue text-white hover:bg-second-blue'
              }`}
            >
              {isEditing ? <Settings className="h-4 w-4" /> : <Move className="h-4 w-4" />}
              {isEditing ? 'Sair do Editor' : 'Editar Layout'}
            </button>

            {isEditing && (
              <button
                onClick={saveLayout}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Salvar Layout
              </button>
            )}

            <button
              onClick={generateImage}
              disabled={isGenerating || !destinationImage}
              className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              Baixar Imagem
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Galeria de imagens */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-primary-blue" />
              Galeria de imagens
            </h3>
          </div>

          <ImageGallery
            images={availableImages}
            onSelectImage={handleSelectImage}
            selectedImageUrl={destinationImage}
            isLoading={isLoadingImage}
            onSearch={handleCustomSearch}
            destination={promo.DESTINO}
          />
        </div>

        {/* Editor de Propriedades */}
        {isEditing && selectedElement && (
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Type className="h-5 w-5 mr-2 text-primary-blue" />
              Editar: {selectedElement}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da Fonte</label>
                <input
                  type="number"
                  value={currentLayout.elements[selectedElement]?.fontSize || 16}
                  onChange={(e) => updateElementStyle(selectedElement, 'fontSize', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso da Fonte</label>
                <select
                  value={currentLayout.elements[selectedElement]?.fontWeight || '400'}
                  onChange={(e) => updateElementStyle(selectedElement, 'fontWeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extrabold</option>
                  <option value="900">Black</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="color"
                  value={currentLayout.elements[selectedElement]?.color || '#000000'}
                  onChange={(e) => updateElementStyle(selectedElement, 'color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Família da Fonte</label>
                <select
                  value={currentLayout.elements[selectedElement]?.fontFamily || 'Inter'}
                  onChange={(e) => updateElementStyle(selectedElement, 'fontFamily', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                  <input
                    type="number"
                    value={currentLayout.elements[selectedElement]?.x || 0}
                    onChange={(e) => updateElementStyle(selectedElement, 'x', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentLayout.elements[selectedElement]?.y || 0}
                    onChange={(e) => updateElementStyle(selectedElement, 'y', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Cores do Layout
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <input
                    type="color"
                    value={currentLayout.colors.primary}
                    onChange={(e) => updateLayoutColor('primary', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <input
                    type="color"
                    value={currentLayout.colors.secondary}
                    onChange={(e) => updateLayoutColor('secondary', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Destaque</label>
                  <input
                    type="color"
                    value={currentLayout.colors.accent}
                    onChange={(e) => updateLayoutColor('accent', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview da Imagem */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm w-full">{error}</div>
          )}

          <div className="relative w-[540px] h-[960px] overflow-hidden border border-gray-300 rounded-lg shadow-lg">
            <div
              ref={templateRef}
              className="w-[540px] h-[960px] relative cursor-pointer"
              style={{ 
                transform: "scale(0.5)", 
                transformOrigin: "top left",
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={() => isEditing && setSelectedElement(null)}
            >
              {/* Destination image as background */}
              {destinationImage && (
                <div className="absolute top-0 left-0 w-[1080px] h-[1920px] overflow-hidden z-0">
                  <img
                    src={destinationImage || "/placeholder.svg"}
                    alt={promo.DESTINO}
                    className="w-full h-full object-cover opacity-80"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              
              {/* Background template */}
              <div className="absolute inset-0 w-[1080px] h-[1920px] z-10">
                {currentLayout.backgroundType === 'png' ? (
                  <img src={currentLayout.backgroundUrl} alt="Template" className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{
                      __html: `<svg viewBox="0 0 1080 1920" class="w-full h-full">${currentLayout.backgroundUrl}</svg>`
                    }}
                  />
                )}
              </div>

              {/* Text Elements */}
              <div className="absolute inset-0 z-20">
                {Object.entries(currentLayout.elements).map(([elementKey, elementStyle]) => (
                  <div
                    key={elementKey}
                    className={`absolute cursor-pointer ${
                      isEditing && selectedElement === elementKey 
                        ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-100 bg-opacity-20' 
                        : ''
                    } ${isEditing ? 'hover:ring-1 hover:ring-gray-400' : ''}`}
                    style={{
                      left: `${elementStyle.x}px`,
                      top: `${elementStyle.y}px`,
                      fontSize: `${elementStyle.fontSize}px`,
                      fontWeight: elementStyle.fontWeight,
                      color: elementStyle.color,
                      fontFamily: elementStyle.fontFamily,
                      maxWidth: elementStyle.maxWidth ? `${elementStyle.maxWidth}px` : 'auto',
                      textAlign: elementStyle.textAlign as any || 'left',
                      userSelect: isEditing ? 'none' : 'auto',
                      padding: isEditing ? '4px' : '0'
                    }}
                    onClick={(e) => handleElementClick(elementKey, e)}
                    onMouseDown={(e) => handleMouseDown(elementKey, e)}
                  >
                    {getElementContent(elementKey)}
                    {isEditing && selectedElement === elementKey && (
                      <div className="absolute -top-6 -left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {elementKey}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>💡 Clique nos elementos para selecioná-los</p>
              <p>🖱️ Arraste para reposicionar</p>
              <p>⚙️ Use o painel lateral para editar propriedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}