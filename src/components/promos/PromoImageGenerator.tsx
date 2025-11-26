"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import type React from "react"
import { toPng } from "html-to-image"
import {
  Loader2,
  Download,
  ImageIcon,
  Edit3,
  Save,
  Upload,
  Palette,
  Type,
  Move,
  Settings,
  Trash2,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Layers,
  Check,
  Star,
  Plus,
  Minus,
  Square,
  PenTool,
} from "lucide-react"
import { ImageGallery } from "./ImageGallery"
import { useLayouts, type ImageArea } from "@/hooks/useLayouts"

interface PromoImageGeneratorProps {
  promo: {
    DESTINO: string
    HOTEL: string
    DATA_FORMATADA: string
    VALOR: string
    PARCELAS?: string | number
    COM_CAFE?: boolean
    SEM_CAFE?: boolean
    MEIA_PENSAO?: boolean
    PENSAO_COMPLETA?: boolean
    ALL_INCLUSIVE?: boolean
    NUMERO_DE_NOITES: string
    SP?: boolean
    CG?: boolean
    AEREO?: boolean
  }
}

// Element labels for UI
const elementLabels: Record<string, string> = {
  region: "Região",
  destination: "Destino",
  hotel: "Hotel",
  dates: "Datas",
  installments: "Parcelas",
  currency: "Moeda (R$)",
  price: "Preço",
  installmentText: "Texto Parcelas",
  flight: "Aéreo",
  perPerson: "Por Pessoa",
  nights: "Noites",
  regime: "Regime",
  departureLabel: "Label Saída",
  departure: "Aeroporto Saída",
  disclaimer: "Disclaimer",
  contactLabel: "Label Contato",
  contact: "Contato",
}

export function PromoImageGenerator({ promo }: PromoImageGeneratorProps) {
  const {
    layouts,
    currentLayout,
    isLoading: isLoadingLayouts,
    error: layoutError,
    fetchLayouts,
    updateLayout,
    deleteLayout,
    uploadLayout,
    setAsDefault,
    setCurrentLayout,
    updateElement,
    updateColor,
    toggleElementVisibility,
    updateImageAreas,
    addImageArea,
    removeImageArea,
    updateImageArea,
  } = useLayouts()

  const [isGenerating, setIsGenerating] = useState(false)
  const [destinationImage, setDestinationImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableImages, setAvailableImages] = useState<any[]>([])
  const [customSearchQuery, setCustomSearchQuery] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isUploadingLayout, setIsUploadingLayout] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showImageAreasPanel, setShowImageAreasPanel] = useState(false)
  const [selectedImageArea, setSelectedImageArea] = useState<string | null>(null)
  const [isDrawingArea, setIsDrawingArea] = useState(false)
  const [drawingAreaStart, setDrawingAreaStart] = useState<{ x: number; y: number } | null>(null)
  const [drawingAreaCurrent, setDrawingAreaCurrent] = useState<{ x: number; y: number } | null>(null)
  const [uploadName, setUploadName] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const templateRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate values
  const baseValue = useMemo(() => {
    const cleanedValue = promo.VALOR?.replace(/[^\d.,]/g, "") || "0"
    return Number.parseFloat(cleanedValue.replace(",", ".")) || 0
  }, [promo.VALOR])

  const parcelas = useMemo(() => {
    let parcelasValue = promo.PARCELAS
    if (typeof parcelasValue === "number") {
      parcelasValue = parcelasValue.toString()
    }
    if (!parcelasValue || parcelasValue === "" || parcelasValue === "undefined" || parcelasValue === "null") {
      parcelasValue = "15"
    }
    const parsed = Number.parseInt(parcelasValue, 10)
    return isNaN(parsed) || parsed <= 0 ? 15 : parsed
  }, [promo.PARCELAS])

  const installmentValue = useMemo(() => {
    if (baseValue === 0 || parcelas === 0) return 0
    return baseValue / parcelas
  }, [baseValue, parcelas])

  // Load layouts on mount
  useEffect(() => {
    fetchLayouts(currentLayout?.format || "story")
  }, [])

  // Initialize
  useEffect(() => {
    const loadFonts = async () => {
      const link = document.createElement("link")
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
      link.rel = "stylesheet"
      document.head.appendChild(link)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    loadFonts()
    setSelectedRegion(getRegion(promo.DESTINO))
  }, [promo.DESTINO])

  // Fetch destination images
  useEffect(() => {
    if (promo.DESTINO) {
      fetchDestinationImages()
    }
  }, [promo.DESTINO])

  // Get visibility based on promo data
  const getElementVisibilityFromPromo = useCallback(
    (elementId: string): boolean => {
      switch (elementId) {
        case "flight":
          return promo.AEREO === true
        case "regime":
          return !!(promo.ALL_INCLUSIVE || promo.PENSAO_COMPLETA || promo.MEIA_PENSAO || promo.COM_CAFE || promo.SEM_CAFE)
        case "departure":
        case "departureLabel":
          return promo.SP === true || promo.CG === true
        default:
          return true
      }
    },
    [promo]
  )

  // Handle layout file upload
  const handleLayoutFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setUploadName(file.name.replace(/\.[^/.]+$/, ""))
    setShowUploadModal(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadConfirm = async () => {
    if (!pendingFile || !currentLayout) return

    setIsUploadingLayout(true)
    try {
      const result = await uploadLayout(pendingFile, currentLayout.format, uploadName)
      if (result) {
        await fetchLayouts(currentLayout.format)
      }
    } catch (err) {
      setError("Erro ao fazer upload do layout")
    } finally {
      setIsUploadingLayout(false)
      setShowUploadModal(false)
      setPendingFile(null)
      setUploadName("")
    }
  }

  // Save current layout changes to database
  const handleSaveLayout = async () => {
    if (!currentLayout) return

    setIsSaving(true)
    try {
      await updateLayout(currentLayout.id, {
        elements: currentLayout.elements,
        colors: currentLayout.colors,
        imageAreas: currentLayout.imageAreas,
      })
    } catch (err) {
      setError("Erro ao salvar layout")
    } finally {
      setIsSaving(false)
    }
  }

  // Set layout as default
  const handleSetAsDefault = async () => {
    if (!currentLayout) return
    await setAsDefault(currentLayout.id)
    await fetchLayouts(currentLayout.format)
  }

  // Delete layout
  const handleDeleteLayout = async (layoutId: string) => {
    if (!confirm("Tem certeza que deseja deletar este layout?")) return
    await deleteLayout(layoutId)
    await fetchLayouts(currentLayout?.format || "story")
  }

  // Fetch destination images
  const fetchDestinationImages = async (customQuery?: string) => {
    const searchQuery = customQuery || promo.DESTINO
    if (!searchQuery) return

    setIsLoadingImage(true)
    setError(null)
    setCustomSearchQuery(customQuery || null)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(searchQuery)}&limit=30`)
      if (!response.ok) throw new Error("Failed to fetch destination images")

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
      setError("Erro ao buscar imagens do destino")
      setAvailableImages([])
    } finally {
      setIsLoadingImage(false)
    }
  }

  // Get region based on destination
  const getRegion = (destination: string) => {
    const dest = destination.toLowerCase().trim()

    const northeastCities = [
      "natal", "recife", "fortaleza", "salvador", "maceió", "maceio", "joão pessoa", "joao pessoa",
      "aracaju", "são luís", "sao luis", "teresina", "porto de galinhas", "porto seguro", "pipa",
      "maragogi", "jericoacoara", "fernando de noronha", "canoa quebrada", "praia do forte",
      "costa do sauípe", "costa do sauipe", "ilhéus", "ilheus", "lençóis maranhenses",
      "lencois maranhenses", "chapada diamantina", "bahia", "ceará", "ceara", "maranhão",
      "maranhao", "pernambuco", "alagoas", "sergipe", "paraíba", "paraiba", "piauí", "piaui",
      "rio grande do norte",
    ]

    const southCities = [
      "florianópolis", "florianopolis", "porto alegre", "gramado", "curitiba", "foz do iguaçu",
      "foz do iguacu", "balneário camboriú", "balneario camboriu", "blumenau", "bombinhas",
      "canela", "bento gonçalves", "bento goncalves", "santa catarina", "paraná", "parana",
      "rio grande do sul", "camboriú", "camboriu", "joinville", "londrina", "maringá", "maringa",
    ]

    const southeastCities = [
      "rio de janeiro", "são paulo", "sao paulo", "belo horizonte", "vitória", "vitoria",
      "búzios", "buzios", "paraty", "campos do jordão", "campos do jordao", "angra dos reis",
      "cabo frio", "petrópolis", "petropolis", "ouro preto", "tiradentes", "guarujá", "guaruja",
      "ubatuba", "ilhabela", "minas gerais", "espírito santo", "espirito santo", "arraial do cabo",
      "são sebastião", "sao sebastiao", "aparecida", "poços de caldas", "pocos de caldas",
    ]

    const centralCities = [
      "brasília", "brasilia", "goiânia", "goiania", "cuiabá", "cuiaba", "campo grande", "bonito",
      "caldas novas", "pirenópolis", "pirenopolis", "chapada dos veadeiros", "pantanal", "goiás",
      "goias", "mato grosso", "mato grosso do sul", "distrito federal", "chapada dos guimarães",
      "chapada dos guimaraes", "corumbá", "corumba",
    ]

    const northCities = [
      "manaus", "belém", "belem", "palmas", "rio branco", "porto velho", "boa vista", "macapá",
      "macapa", "alter do chão", "alter do chao", "são gabriel da cachoeira",
      "sao gabriel da cachoeira", "monte roraima", "amazonas", "pará", "para", "tocantins",
      "acre", "rondônia", "rondonia", "roraima", "amapá", "amapa", "santarém", "santarem",
    ]

    const internationalKeywords = [
      "cancun", "miami", "orlando", "nova york", "las vegas", "paris", "londres", "roma",
      "madri", "lisboa", "tóquio", "toquio", "dubai", "buenos aires", "santiago", "toronto",
      "vancouver", "amsterdam", "berlim", "viena", "atenas", "bangkok", "pequim", "sydney",
      "auckland", "cidade do cabo", "cairo", "istambul", "jerusalém", "jerusalem", "havana",
      "punta cana", "méxico", "mexico", "eua", "usa", "estados unidos", "europa", "ásia",
      "asia", "áfrica", "africa", "oceania", "caribe",
    ]

    const brazilKeywords = ["brasil", "brazil"]
    const isBrazilExplicit = brazilKeywords.some((keyword) => dest.includes(keyword))

    if (isBrazilExplicit) {
      if (northeastCities.some((city) => dest.includes(city))) return "Nordeste"
      if (southCities.some((city) => dest.includes(city))) return "Sul"
      if (southeastCities.some((city) => dest.includes(city))) return "Sudeste"
      if (centralCities.some((city) => dest.includes(city))) return "Centro-Oeste"
      if (northCities.some((city) => dest.includes(city))) return "Norte"
      return "Brasil"
    }

    if (internationalKeywords.some((keyword) => dest.includes(keyword))) return "Exterior"
    if (northeastCities.some((city) => dest.includes(city))) return "Nordeste"
    if (southCities.some((city) => dest.includes(city))) return "Sul"
    if (southeastCities.some((city) => dest.includes(city))) return "Sudeste"
    if (centralCities.some((city) => dest.includes(city))) return "Centro-Oeste"
    if (northCities.some((city) => dest.includes(city))) return "Norte"

    const brazilRegions = ["nordeste", "norte", "sul", "sudeste", "centro-oeste", "centro oeste"]
    if (brazilRegions.some((region) => dest.includes(region))) {
      return dest.includes("nordeste")
        ? "Nordeste"
        : dest.includes("norte")
          ? "Norte"
          : dest.includes("sul")
            ? "Sul"
            : dest.includes("sudeste")
              ? "Sudeste"
              : "Centro-Oeste"
    }

    return "Exterior"
  }

  // Get regime de alimentação
  const getRegimeAlimentacao = () => {
    if (promo.ALL_INCLUSIVE) return "All inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão completa"
    if (promo.MEIA_PENSAO) return "Meia pensão"
    if (promo.COM_CAFE) return "Com café da manhã"
    if (promo.SEM_CAFE) return "Sem café da manhã"
    return ""
  }

  // Get departure airport
  const getDepartureAirport = () => {
    if (promo.CG && !promo.SP) return "Campo Grande (CGR)"
    if (promo.SP && !promo.CG) return "São Paulo (GRU)"
    if (promo.CG && promo.SP) return "Campo Grande (CGR) ou São Paulo (GRU)"
    return ""
  }

  // Format date range
  const formatDateRange = () => {
    try {
      const datePattern = /(\d{1,2})\/(\d{1,2}) até (\d{1,2})\/(\d{1,2}) de (\d{4})/
      const match = promo.DATA_FORMATADA.match(datePattern)
      if (match) {
        const [, startDay, startMonth, endDay, endMonth, year] = match
        return `${startDay}/${startMonth} até ${endDay}/${endMonth} de ${year}`
      }
      return promo.DATA_FORMATADA
    } catch {
      return promo.DATA_FORMATADA
    }
  }

  // Handle element drag
  const handleMouseDown = (elementId: string, event: React.MouseEvent) => {
    if (!isEditMode) return
    event.preventDefault()
    setSelectedElement(elementId)
    setIsDragging(true)
    const rect = event.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)

    // Complete drawing area
    if (isDrawingArea && drawingAreaStart && drawingAreaCurrent && currentLayout) {
      const minX = Math.min(drawingAreaStart.x, drawingAreaCurrent.x)
      const maxX = Math.max(drawingAreaStart.x, drawingAreaCurrent.x)
      const minY = Math.min(drawingAreaStart.y, drawingAreaCurrent.y)
      const maxY = Math.max(drawingAreaStart.y, drawingAreaCurrent.y)

      // Only create area if it's big enough
      if (maxX - minX > 20 && maxY - minY > 20) {
        const newArea: ImageArea = {
          id: `area-${Date.now()}`,
          name: `Foto ${(currentLayout.imageAreas?.length || 0) + 1}`,
          type: "rectangle",
          points: [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
          ],
          zIndex: -1,
          fit: "cover",
          visible: true,
        }
        addImageArea(newArea)
        setSelectedImageArea(newArea.id)
      }

      setDrawingAreaStart(null)
      setDrawingAreaCurrent(null)
      setIsDrawingArea(false)
    }
  }

  // Handle drawing area mouse events
  const handlePreviewMouseDown = (event: React.MouseEvent) => {
    if (!isDrawingArea || !templateRef.current) return

    const templateRect = templateRef.current.getBoundingClientRect()
    const x = (event.clientX - templateRect.left) / scale
    const y = (event.clientY - templateRect.top) / scale

    setDrawingAreaStart({ x, y })
    setDrawingAreaCurrent({ x, y })
  }

  const handlePreviewMouseMove = (event: React.MouseEvent) => {
    // Handle element dragging
    if (isDragging && selectedElement && templateRef.current && currentLayout) {
      const templateRect = templateRef.current.getBoundingClientRect()
      const newX = (event.clientX - templateRect.left - dragOffset.x) / scale
      const newY = (event.clientY - templateRect.top - dragOffset.y) / scale

      const maxX = 1080
      const maxY = currentLayout.format === "feed" ? 1350 : 1920

      updateElement(selectedElement, {
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      })
      return
    }

    // Handle drawing area
    if (isDrawingArea && drawingAreaStart && templateRef.current) {
      const templateRect = templateRef.current.getBoundingClientRect()
      const x = (event.clientX - templateRect.left) / scale
      const y = (event.clientY - templateRect.top) / scale

      setDrawingAreaCurrent({ x, y })
    }
  }

  // Generate image
  const generateImage = async () => {
    if (!templateRef.current || !currentLayout) return

    setIsGenerating(true)
    try {
      const template = templateRef.current
      const originalTransform = template.style.transform
      template.style.transform = ""

      await new Promise((resolve) => setTimeout(resolve, 500))

      const width = 1080
      const height = currentLayout.format === "feed" ? 1350 : 1920

      const dataUrl = await toPng(template, {
        quality: 1.0,
        width,
        height,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
        style: {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      })

      template.style.transform = originalTransform

      const link = document.createElement("a")
      const formatSuffix = currentLayout.format === "feed" ? "feed" : "story"
      link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}-${formatSuffix}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      setError("Erro ao gerar imagem. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Get element content
  const getElementContent = (elementId: string) => {
    switch (elementId) {
      case "region":
        return selectedRegion
      case "destination":
        return promo.DESTINO
      case "hotel":
        return promo.HOTEL
      case "dates":
        return formatDateRange()
      case "installments":
        return `${parcelas}x de`
      case "currency":
        return "R$"
      case "price":
        return installmentValue.toFixed(2).replace(".", ",")
      case "installmentText":
        return `no cartão e ${parcelas}x no boleto sem juros.`
      case "flight":
        return promo.AEREO ? "Aéreo Ida e Volta" : ""
      case "perPerson":
        return "Valor por pessoa"
      case "nights":
        return `${promo.NUMERO_DE_NOITES} Noites`
      case "regime":
        return getRegimeAlimentacao()
      case "departureLabel":
        return "saindo de"
      case "departure":
        return getDepartureAirport()
      case "disclaimer":
        return "Preço por pessoa em apartamento duplo, sujeito a alteração sem aviso prévio, taxas inclusas."
      case "contactLabel":
        return "Contato e Whatsapp"
      case "contact":
        return "(67) 9 9637-2769"
      default:
        return ""
    }
  }

  // Switch format
  const switchFormat = async (format: "story" | "feed") => {
    await fetchLayouts(format)
    const defaultLayout = layouts.find((l) => l.format === format && l.isDefault) || layouts.find((l) => l.format === format)
    if (defaultLayout) {
      setCurrentLayout(defaultLayout)
    }
  }

  // Get container dimensions
  const getContainerDimensions = () => {
    if (currentLayout?.format === "feed") {
      return { width: "432px", height: "540px", scale: 0.4 }
    }
    return { width: "540px", height: "960px", scale: 0.5 }
  }

  const { width: containerWidth, height: containerHeight, scale } = getContainerDimensions()
  const templateImage = currentLayout?.url || null
  const layoutsForCurrentFormat = useMemo(
    () => layouts.filter((layout) => layout.format === (currentLayout?.format || "story")),
    [layouts, currentLayout?.format]
  )

  // Check if element should be visible (from promo data + layout settings)
  const isElementVisible = (elementId: string): boolean => {
    if (!currentLayout?.elements[elementId]) return false
    const layoutVisible = currentLayout.elements[elementId].visible
    const promoVisible = getElementVisibilityFromPromo(elementId)
    return layoutVisible && promoVisible
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-blue" />
              Formato
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => switchFormat("story")}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                  currentLayout?.format === "story"
                    ? "bg-primary-blue text-white border-primary-blue"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">Stories</span>
              </button>

              <button
                onClick={() => switchFormat("feed")}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                  currentLayout?.format === "feed"
                    ? "bg-primary-blue text-white border-primary-blue"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span className="text-sm">Feed</span>
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {currentLayout?.format === "story" ? "1080x1920 (Stories)" : "1080x1350 (Feed)"}
            </p>
          </div>

          {/* Layout Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-primary-blue" />
                Layouts
              </h3>
              <p className="text-xs text-gray-500 mt-1">Selecione ou faça upload de um layout</p>
            </div>

            {isLoadingLayouts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-blue" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {layoutsForCurrentFormat.map((layout) => {
                  const isActive = currentLayout?.id === layout.id
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setCurrentLayout(layout)}
                      className={`relative rounded-xl border p-2 text-left transition-all ${
                        isActive
                          ? "border-primary-blue ring-2 ring-primary-blue/40 bg-primary-blue/5"
                          : "border-gray-200 hover:border-primary-blue/60 hover:bg-gray-50"
                      }`}
                    >
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                        <img
                          src={layout.url || "/assets/LAYOUTFINAL.png"}
                          alt={layout.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{layout.name}</p>
                        <div className="flex items-center gap-1">
                          {layout.isDefault && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-700">
                              <Star className="h-2.5 w-2.5 mr-0.5" />
                              Padrão
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                            {layout.type === "custom" ? "Upload" : "Sistema"}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="absolute right-1 top-1 rounded-full bg-primary-blue p-1">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLayout}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm disabled:opacity-60"
              >
                {isUploadingLayout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>

              {currentLayout && !currentLayout.isDefault && (
                <button
                  onClick={handleSetAsDefault}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                >
                  <Star className="h-4 w-4" />
                  Padrão
                </button>
              )}
            </div>

            {currentLayout && currentLayout.createdBy !== "system" && (
              <button
                onClick={() => handleDeleteLayout(currentLayout.id)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Deletar Layout
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLayoutFileSelect}
              className="hidden"
            />
          </div>

          {/* Edit Mode & Layer Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isEditMode
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                <Edit3 className="h-4 w-4" />
                {isEditMode ? "Editando" : "Editar"}
              </button>

              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  showLayerPanel
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {isEditMode && (
              <button
                onClick={handleSaveLayout}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alterações
              </button>
            )}
          </div>

          {/* Layer Visibility Panel */}
          {showLayerPanel && currentLayout && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Visibilidade das Camadas
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(currentLayout.elements).map(([elementId, element]) => {
                  const promoVisible = getElementVisibilityFromPromo(elementId)
                  return (
                    <div
                      key={elementId}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        !promoVisible ? "opacity-50 bg-gray-100" : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-gray-700">{elementLabels[elementId] || elementId}</span>
                      <button
                        onClick={() => toggleElementVisibility(elementId)}
                        disabled={!promoVisible}
                        className={`p-1 rounded transition-colors ${
                          element.visible && promoVisible
                            ? "text-green-600 hover:bg-green-100"
                            : "text-gray-400 hover:bg-gray-200"
                        }`}
                        title={!promoVisible ? "Desabilitado pela promo" : element.visible ? "Ocultar" : "Mostrar"}
                      >
                        {element.visible && promoVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Image Areas Panel */}
          {currentLayout && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  <Square className="h-5 w-5 mr-2 text-primary-blue" />
                  Áreas de Foto
                </h3>
                <button
                  onClick={() => setShowImageAreasPanel(!showImageAreasPanel)}
                  className={`p-2 rounded-md transition-colors ${
                    showImageAreasPanel
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {showImageAreasPanel ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>

              {showImageAreasPanel && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                  {currentLayout.imageAreas && currentLayout.imageAreas.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        {currentLayout.imageAreas.length} área(s) configurada(s)
                      </p>
                      {currentLayout.imageAreas
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((area) => (
                          <div
                            key={area.id}
                            onClick={() => setSelectedImageArea(selectedImageArea === area.id ? null : area.id)}
                            className={`p-2 rounded-md border cursor-pointer transition-colors ${
                              selectedImageArea === area.id
                                ? "border-blue-500 bg-blue-100"
                                : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">{area.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                z: {area.zIndex}
                              </span>
                            </div>

                            {selectedImageArea === area.id && (
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                <div>
                                  <label className="text-xs text-gray-500">Z-Index (ordem)</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateImageArea(area.id, { zIndex: area.zIndex - 1 })
                                      }}
                                      className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={area.zIndex}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        updateImageArea(area.id, { zIndex: parseInt(e.target.value) || 0 })
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-16 text-center p-1 border rounded text-sm"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateImageArea(area.id, { zIndex: area.zIndex + 1 })
                                      }}
                                      className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    Negativo = atrás do template
                                  </p>
                                </div>

                                <div>
                                  <label className="text-xs text-gray-500">Ajuste</label>
                                  <select
                                    value={area.fit}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      updateImageArea(area.id, { fit: e.target.value as "cover" | "contain" | "fill" })
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full p-1 border rounded text-sm mt-1"
                                  >
                                    <option value="cover">Cobrir</option>
                                    <option value="contain">Conter</option>
                                    <option value="fill">Esticar</option>
                                  </select>
                                </div>

                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateImageArea(area.id, { visible: !area.visible })
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${
                                      area.visible
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {area.visible ? "Visível" : "Oculto"}
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm("Remover esta área?")) {
                                        removeImageArea(area.id)
                                        setSelectedImageArea(null)
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <PenTool className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma área configurada</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Clique em "Desenhar Nova Área" e arraste no preview
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setIsDrawingArea(!isDrawingArea)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isDrawingArea
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <PenTool className="h-4 w-4" />
                    {isDrawingArea ? "Clique no preview para desenhar..." : "Desenhar Nova Área"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Layout Colors */}
          {currentLayout && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-primary-blue" />
                Cores
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentLayout.colors).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 capitalize">
                      {key === "primary"
                        ? "Primária"
                        : key === "secondary"
                          ? "Secundária"
                          : key === "accent"
                            ? "Destaque"
                            : "Fundo"}
                    </label>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Region Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Região</h3>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
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

          {/* Element Properties */}
          {isEditMode && selectedElement && currentLayout?.elements[selectedElement] && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Type className="h-5 w-5 mr-2 text-primary-blue" />
                {elementLabels[selectedElement] || selectedElement}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Tamanho da Fonte</label>
                  <input
                    type="number"
                    value={currentLayout.elements[selectedElement]?.fontSize || 16}
                    onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    min="8"
                    max="200"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Peso da Fonte</label>
                  <select
                    value={currentLayout.elements[selectedElement]?.fontWeight || "normal"}
                    onChange={(e) => updateElement(selectedElement, { fontWeight: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                  <label className="text-xs font-medium text-gray-600">Cor</label>
                  <input
                    type="color"
                    value={currentLayout.elements[selectedElement]?.color || "#000000"}
                    onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                    className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Posição X</label>
                    <input
                      type="number"
                      value={Math.round(currentLayout.elements[selectedElement]?.x || 0)}
                      onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Posição Y</label>
                    <input
                      type="number"
                      value={Math.round(currentLayout.elements[selectedElement]?.y || 0)}
                      onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={isGenerating || !destinationImage || !currentLayout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-50 font-medium"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Baixar Imagem
          </button>
        </div>
      </div>

      {/* Center - Template Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
        {(error || layoutError) && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm w-full max-w-md">
            {error || layoutError}
          </div>
        )}

        {currentLayout && (
          <div
            className="relative overflow-hidden border border-gray-300 rounded-lg shadow-lg bg-white"
            style={{ width: containerWidth, height: containerHeight }}
          >
            <div
              ref={templateRef}
              className={`relative ${isDrawingArea ? "cursor-crosshair" : "cursor-pointer"}`}
              style={{
                width: "1080px",
                height: currentLayout.format === "feed" ? "1350px" : "1920px",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
              onMouseDown={handlePreviewMouseDown}
              onMouseMove={handlePreviewMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => !isDrawingArea && setSelectedElement(null)}
            >
              {/* Image Areas with negative z-index (behind template) */}
              {currentLayout.imageAreas
                ?.filter((area) => area.visible && area.zIndex < 0)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((area) => {
                  const minX = Math.min(...area.points.map((p) => p.x))
                  const maxX = Math.max(...area.points.map((p) => p.x))
                  const minY = Math.min(...area.points.map((p) => p.y))
                  const maxY = Math.max(...area.points.map((p) => p.y))
                  return (
                    <div
                      key={area.id}
                      className={`absolute overflow-hidden ${
                        selectedImageArea === area.id ? "ring-4 ring-blue-500" : ""
                      }`}
                      style={{
                        left: `${minX}px`,
                        top: `${minY}px`,
                        width: `${maxX - minX}px`,
                        height: `${maxY - minY}px`,
                        zIndex: area.zIndex,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageArea(area.id)
                      }}
                    >
                      {destinationImage ? (
                        <img
                          src={destinationImage}
                          alt={promo.DESTINO}
                          className="w-full h-full"
                          style={{ objectFit: area.fit }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Destination image as background (fallback when no areas defined) */}
              {destinationImage && (!currentLayout.imageAreas || currentLayout.imageAreas.length === 0) && (
                <div
                  className="absolute top-0 left-0 overflow-hidden z-0"
                  style={{
                    width: "1080px",
                    height: currentLayout.format === "feed" ? "1350px" : "1920px",
                  }}
                >
                  <img
                    src={destinationImage}
                    alt={promo.DESTINO}
                    className="w-full h-full object-cover opacity-80"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Template overlay */}
              <div
                className="absolute inset-0 z-10"
                style={{
                  width: "1080px",
                  height: currentLayout.format === "feed" ? "1350px" : "1920px",
                }}
              >
                {templateImage && (
                  <img
                    src={templateImage}
                    alt="Promo Template"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                )}

                {/* Text Overlays */}
                <div className="absolute inset-0">
                  {Object.entries(currentLayout.elements).map(([elementId, element]) => {
                    if (!isElementVisible(elementId)) return null

                    const content = getElementContent(elementId)
                    if (!content) return null

                    return (
                      <div
                        key={elementId}
                        className={`absolute cursor-pointer ${isEditMode ? "hover:ring-2 hover:ring-blue-400" : ""} ${
                          selectedElement === elementId ? "ring-2 ring-blue-500 bg-blue-100 bg-opacity-20" : ""
                        }`}
                        style={{
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          fontSize: `${element.fontSize}px`,
                          fontWeight: element.fontWeight,
                          color: element.color,
                          fontFamily: element.fontFamily,
                          userSelect: isEditMode ? "none" : "auto",
                        }}
                        onClick={(e) => {
                          if (!isEditMode) return
                          e.stopPropagation()
                          setSelectedElement(elementId)
                        }}
                        onMouseDown={(e) => handleMouseDown(elementId, e)}
                      >
                        {content}
                        {isEditMode && selectedElement === elementId && (
                          <div className="absolute -top-6 -left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            <Move className="h-3 w-3 inline mr-1" />
                            {elementLabels[elementId] || elementId}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Image Areas with positive z-index (in front of template) */}
              {currentLayout.imageAreas
                ?.filter((area) => area.visible && area.zIndex >= 0)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((area) => {
                  const minX = Math.min(...area.points.map((p) => p.x))
                  const maxX = Math.max(...area.points.map((p) => p.x))
                  const minY = Math.min(...area.points.map((p) => p.y))
                  const maxY = Math.max(...area.points.map((p) => p.y))
                  return (
                    <div
                      key={area.id}
                      className={`absolute overflow-hidden ${
                        selectedImageArea === area.id ? "ring-4 ring-blue-500" : ""
                      }`}
                      style={{
                        left: `${minX}px`,
                        top: `${minY}px`,
                        width: `${maxX - minX}px`,
                        height: `${maxY - minY}px`,
                        zIndex: 20 + area.zIndex,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageArea(area.id)
                      }}
                    >
                      {destinationImage ? (
                        <img
                          src={destinationImage}
                          alt={promo.DESTINO}
                          className="w-full h-full"
                          style={{ objectFit: area.fit }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Drawing rectangle preview */}
              {isDrawingArea && drawingAreaStart && drawingAreaCurrent && (
                <div
                  className="absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                  style={{
                    left: `${Math.min(drawingAreaStart.x, drawingAreaCurrent.x)}px`,
                    top: `${Math.min(drawingAreaStart.y, drawingAreaCurrent.y)}px`,
                    width: `${Math.abs(drawingAreaCurrent.x - drawingAreaStart.x)}px`,
                    height: `${Math.abs(drawingAreaCurrent.y - drawingAreaStart.y)}px`,
                    zIndex: 100,
                  }}
                />
              )}

              {/* Area outlines in edit mode */}
              {(isEditMode || showImageAreasPanel) &&
                currentLayout.imageAreas?.map((area) => {
                  const minX = Math.min(...area.points.map((p) => p.x))
                  const maxX = Math.max(...area.points.map((p) => p.x))
                  const minY = Math.min(...area.points.map((p) => p.y))
                  const maxY = Math.max(...area.points.map((p) => p.y))
                  return (
                    <div
                      key={`outline-${area.id}`}
                      className={`absolute border-2 pointer-events-none ${
                        selectedImageArea === area.id
                          ? "border-blue-500 border-solid"
                          : "border-yellow-400 border-dashed"
                      }`}
                      style={{
                        left: `${minX}px`,
                        top: `${minY}px`,
                        width: `${maxX - minX}px`,
                        height: `${maxY - minY}px`,
                        zIndex: 101,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded whitespace-nowrap">
                        {area.name} (z: {area.zIndex})
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Image Gallery */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-primary-blue" />
              Galeria de Imagens
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {customSearchQuery ? `Resultados para "${customSearchQuery}"` : `Imagens para ${promo.DESTINO}`}
            </p>
          </div>

          <ImageGallery
            images={availableImages}
            onSelectImage={(url) => setDestinationImage(url)}
            selectedImageUrl={destinationImage}
            isLoading={isLoadingImage}
            onSearch={(query) => fetchDestinationImages(query)}
            destination={promo.DESTINO}
          />
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload de Layout</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome do Layout</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Ex: Layout Black Friday"
                />
              </div>
              <div className="text-sm text-gray-500">
                Formato: {currentLayout?.format === "feed" ? "Feed (1080x1350)" : "Story (1080x1920)"}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setPendingFile(null)
                    setUploadName("")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadConfirm}
                  disabled={isUploadingLayout || !uploadName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue disabled:opacity-50 flex items-center justify-center"
                >
                  {isUploadingLayout ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
