"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type React from "react"
import { toPng } from "html-to-image"
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Loader2,
  Save,
  Grid3X3,
  Magnet,
  Star,
} from "lucide-react"
import { useLayouts, type ElementConfig, type ImageArea } from "@/hooks/useLayouts"

// Default font family
const DEFAULT_FONT = "'Montserrat', sans-serif"

// Available fonts - include Google Fonts
const AVAILABLE_FONTS = [
  { name: "Montserrat", value: "'Montserrat', sans-serif", google: "Montserrat:wght@400;500;600;700;800;900" },
  { name: "Inter", value: "'Inter', sans-serif", google: "Inter:wght@400;500;600;700;800;900" },
  { name: "Poppins", value: "'Poppins', sans-serif", google: "Poppins:wght@400;500;600;700;800;900" },
  { name: "Roboto", value: "'Roboto', sans-serif", google: "Roboto:wght@400;500;700;900" },
  { name: "Open Sans", value: "'Open Sans', sans-serif", google: "Open+Sans:wght@400;500;600;700;800" },
  { name: "Lato", value: "'Lato', sans-serif", google: "Lato:wght@400;700;900" },
  { name: "Oswald", value: "'Oswald', sans-serif", google: "Oswald:wght@400;500;600;700" },
  { name: "Playfair Display", value: "'Playfair Display', serif", google: "Playfair+Display:wght@400;500;600;700;800;900" },
  { name: "Bebas Neue", value: "'Bebas Neue', sans-serif", google: "Bebas+Neue" },
  { name: "Anton", value: "'Anton', sans-serif", google: "Anton" },
]

// Helper to normalize font family (ensures proper format)
const normalizeFontFamily = (fontFamily: string | undefined): string => {
  if (!fontFamily) return DEFAULT_FONT
  // If already in correct format with quotes, return as is
  if (fontFamily.includes("'") || fontFamily.includes('"')) return fontFamily
  // Find matching font in available fonts
  const matchingFont = AVAILABLE_FONTS.find(
    f => f.name.toLowerCase() === fontFamily.toLowerCase() ||
         f.value.toLowerCase().includes(fontFamily.toLowerCase())
  )
  return matchingFont?.value || DEFAULT_FONT
}

interface LayoutEditorProps {
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
  backgroundImage?: string | null
  onSave?: () => void
  onExport?: () => void
}

interface SnapGuide {
  type: "vertical" | "horizontal"
  position: number
  visible: boolean
}

const SNAP_THRESHOLD = 8
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_STORY = 1920
const CANVAS_HEIGHT_FEED = 1350

const elementLabels: Record<string, string> = {
  region: "Regiao",
  destination: "Destino",
  hotel: "Hotel",
  dates: "Datas",
  installments: "Parcelas",
  currency: "Moeda",
  price: "Preco",
  installmentText: "Texto Parcelas",
  flight: "Aereo",
  perPerson: "Por Pessoa",
  nights: "Noites",
  regime: "Regime",
  departureLabel: "Label Saida",
  departure: "Aeroporto",
  disclaimer: "Disclaimer",
  contactLabel: "Label Contato",
  contact: "Contato",
}

const REGION_OPTIONS = ["Nordeste", "Sul", "Sudeste", "Norte", "Centro-Oeste", "Exterior", "Brasil"] as const
type RegionOption = (typeof REGION_OPTIONS)[number]

const normalizeDestination = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const inferRegionFromDestination = (destination: string): RegionOption => {
  const dest = normalizeDestination(destination)

  const northeastCities = [
    "natal",
    "recife",
    "fortaleza",
    "salvador",
    "maceio",
    "joao pessoa",
    "aracaju",
    "sao luis",
    "teresina",
    "porto de galinhas",
    "porto seguro",
    "pipa",
    "maragogi",
    "jericoacoara",
    "fernando de noronha",
    "canoa quebrada",
    "praia do forte",
    "costa do sauipe",
    "ilheus",
    "lencois maranhenses",
    "chapada diamantina",
    "bahia",
    "ceara",
    "maranhao",
    "pernambuco",
    "alagoas",
    "sergipe",
    "paraiba",
    "piaui",
    "rio grande do norte",
  ]

  const southCities = [
    "florianopolis",
    "porto alegre",
    "gramado",
    "curitiba",
    "foz do iguacu",
    "balneario camboriu",
    "blumenau",
    "bombinhas",
    "canela",
    "bento goncalves",
    "santa catarina",
    "parana",
    "rio grande do sul",
    "camboriu",
    "joinville",
    "londrina",
    "maringa",
  ]

  const southeastCities = [
    "rio de janeiro",
    "sao paulo",
    "belo horizonte",
    "vitoria",
    "buzios",
    "paraty",
    "campos do jordao",
    "angra dos reis",
    "cabo frio",
    "petropolis",
    "ouro preto",
    "tiradentes",
    "guaruja",
    "ubatuba",
    "ilhabela",
    "minas gerais",
    "espirito santo",
    "arraial do cabo",
    "sao sebastiao",
    "aparecida",
    "pocos de caldas",
  ]

  const centralCities = [
    "brasilia",
    "goiania",
    "cuiaba",
    "campo grande",
    "bonito",
    "caldas novas",
    "pirenopolis",
    "chapada dos veadeiros",
    "pantanal",
    "goias",
    "mato grosso",
    "mato grosso do sul",
    "distrito federal",
    "chapada dos guimaraes",
    "corumba",
  ]

  const northCities = [
    "manaus",
    "belem",
    "palmas",
    "rio branco",
    "porto velho",
    "boa vista",
    "macapa",
    "alter do chao",
    "sao gabriel da cachoeira",
    "monte roraima",
    "amazonas",
    "para",
    "tocantins",
    "acre",
    "rondonia",
    "roraima",
    "amapa",
    "santarem",
  ]

  const internationalKeywords = [
    "cancun",
    "miami",
    "orlando",
    "nova york",
    "las vegas",
    "paris",
    "londres",
    "roma",
    "madri",
    "lisboa",
    "toquio",
    "dubai",
    "buenos aires",
    "santiago",
    "toronto",
    "vancouver",
    "amsterdam",
    "berlim",
    "viena",
    "atenas",
    "bangkok",
    "pequim",
    "sydney",
    "auckland",
    "cidade do cabo",
    "cairo",
    "istambul",
    "jerusalem",
    "havana",
    "punta cana",
    "mexico",
    "eua",
    "usa",
    "estados unidos",
    "europa",
    "asia",
    "africa",
    "oceania",
    "caribe",
  ]

  const brazilKeywords = ["brasil", "brazil"]
  const isBrazilExplicit = brazilKeywords.some((keyword) => dest.includes(keyword))

  // Prioritize explicit "Brasil" or known Brazilian places
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

  const brazilRegions = ["nordeste", "norte", "sul", "sudeste", "centro oeste", "centro-oeste"]
  if (brazilRegions.some((region) => dest.includes(region))) {
    if (dest.includes("nordeste")) return "Nordeste"
    if (dest.includes("norte")) return "Norte"
    if (dest.includes("sul")) return "Sul"
    if (dest.includes("sudeste")) return "Sudeste"
    return "Centro-Oeste"
  }

  // If we couldn't detect anything and it's not clearly international, default to "Brasil"
  return "Brasil"
}

export function LayoutEditor({ promo, backgroundImage, onSave, onExport }: LayoutEditorProps) {
  const {
    layouts,
    currentLayout,
    isLoading,
    fetchLayouts,
    updateLayout,
    uploadLayout,
    setCurrentLayout,
    updateElement,
    toggleElementVisibility,
    addImageArea,
    removeImageArea,
    updateImageArea,
    setAsDefault,
  } = useLayouts()

  const [selectedFormat, setSelectedFormat] = useState<"story" | "feed">("story")

  const [zoom, setZoom] = useState(0.45)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(() => inferRegionFromDestination(promo.DESTINO))

  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const canvasHeight = currentLayout?.format === "feed" ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY

  // Load layouts based on selected format
  useEffect(() => {
    fetchLayouts(selectedFormat)
  }, [selectedFormat])

  // Update format when currentLayout changes
  useEffect(() => {
    if (currentLayout?.format && currentLayout.format !== selectedFormat) {
      setSelectedFormat(currentLayout.format)
    }
  }, [currentLayout?.format])

  // Filter layouts by format
  const filteredLayouts = useMemo(() => {
    return layouts.filter(l => l.format === selectedFormat)
  }, [layouts, selectedFormat])

  // Load Google Fonts
  useEffect(() => {
    const fontFamilies = AVAILABLE_FONTS.map(f => f.google).join("&family=")
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    setSelectedRegion(inferRegionFromDestination(promo.DESTINO))
  }, [promo.DESTINO])

  // Calculate promo values
  const promoValues = useMemo(() => {
    // VALOR é o valor total salvo no formato "5000.00"
    const totalValue = Number.parseFloat(promo.VALOR) || 0
    let parcelasValue = promo.PARCELAS
    if (typeof parcelasValue === "number") parcelasValue = parcelasValue.toString()
    if (!parcelasValue) parcelasValue = "15"
    const parcelas = Number.parseInt(parcelasValue, 10) || 15
    const installmentValue = totalValue / parcelas

    return { totalValue, parcelas, installmentValue }
  }, [promo.VALOR, promo.PARCELAS])

  // Get element content
  const getElementContent = useCallback((elementId: string) => {
    const { parcelas, installmentValue } = promoValues

    const getRegimeAlimentacao = () => {
      if (promo.ALL_INCLUSIVE) return "All inclusive"
      if (promo.PENSAO_COMPLETA) return "Pensao completa"
      if (promo.MEIA_PENSAO) return "Meia pensao"
      if (promo.COM_CAFE) return "Com cafe da manha"
      if (promo.SEM_CAFE) return "Sem cafe da manha"
      return ""
    }

    const getDepartureAirport = () => {
      if (promo.CG && !promo.SP) return "Campo Grande (CGR)"
      if (promo.SP && !promo.CG) return "Sao Paulo (GRU)"
      if (promo.CG && promo.SP) return "CGR ou GRU"
      return ""
    }

    switch (elementId) {
      case "region":
        return selectedRegion
      case "destination": return promo.DESTINO
      case "hotel": return promo.HOTEL
      case "dates": return promo.DATA_FORMATADA
      case "installments": return `${parcelas}x de`
      case "currency": return "R$"
      case "price": return installmentValue.toFixed(2).replace(".", ",")
      case "installmentText": return `no cartao e ${parcelas}x no boleto sem juros.`
      case "flight": return promo.AEREO ? "Aereo Ida e Volta" : ""
      case "perPerson": return "Valor por pessoa"
      case "nights": return `${promo.NUMERO_DE_NOITES} Noites`
      case "regime": return getRegimeAlimentacao()
      case "departureLabel": return "saindo de"
      case "departure": return getDepartureAirport()
      case "disclaimer": return "Preco por pessoa em apartamento duplo, sujeito a alteracao."
      case "contactLabel": return "Contato e Whatsapp"
      case "contact": return "(67) 9 9637-2769"
      default: return ""
    }
  }, [promo, promoValues, selectedRegion])

  // Check element visibility based on promo data
  const isElementVisibleByPromo = useCallback((elementId: string): boolean => {
    switch (elementId) {
      case "flight": return promo.AEREO === true
      case "regime": return !!(promo.ALL_INCLUSIVE || promo.PENSAO_COMPLETA || promo.MEIA_PENSAO || promo.COM_CAFE || promo.SEM_CAFE)
      case "departure":
      case "departureLabel": return promo.SP === true || promo.CG === true
      default: return true
    }
  }, [promo])

  // Calculate snap guides
  const calculateSnapGuides = useCallback((movingElementId: string, newX: number, newY: number) => {
    if (!snapEnabled || !currentLayout) return { snappedX: newX, snappedY: newY, guides: [] }

    const guides: SnapGuide[] = []
    let snappedX = newX
    let snappedY = newY

    const centerX = CANVAS_WIDTH / 2
    const centerY = canvasHeight / 2

    // Snap to center
    if (Math.abs(newX - centerX) < SNAP_THRESHOLD) {
      snappedX = centerX
      guides.push({ type: "vertical", position: centerX, visible: true })
    }
    if (Math.abs(newY - centerY) < SNAP_THRESHOLD) {
      snappedY = centerY
      guides.push({ type: "horizontal", position: centerY, visible: true })
    }

    // Snap to other elements
    Object.entries(currentLayout.elements).forEach(([id, element]) => {
      if (id === movingElementId || !element.visible) return

      // Horizontal alignment (same Y)
      if (Math.abs(newY - element.y) < SNAP_THRESHOLD) {
        snappedY = element.y
        guides.push({ type: "horizontal", position: element.y, visible: true })
      }

      // Vertical alignment (same X)
      if (Math.abs(newX - element.x) < SNAP_THRESHOLD) {
        snappedX = element.x
        guides.push({ type: "vertical", position: element.x, visible: true })
      }
    })

    return { snappedX, snappedY, guides }
  }, [currentLayout, canvasHeight, snapEnabled])

  // Mouse handlers
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentLayout?.elements[elementId]) return

    setSelectedElement(elementId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart({
      x: currentLayout.elements[elementId].x,
      y: currentLayout.elements[elementId].y,
    })
  }, [currentLayout])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !currentLayout) return

    const deltaX = (e.clientX - dragStart.x) / zoom
    const deltaY = (e.clientY - dragStart.y) / zoom

    const newX = Math.max(0, Math.min(CANVAS_WIDTH, elementStart.x + deltaX))
    const newY = Math.max(0, Math.min(canvasHeight, elementStart.y + deltaY))

    const { snappedX, snappedY, guides } = calculateSnapGuides(selectedElement, newX, newY)

    setSnapGuides(guides)
    updateElement(selectedElement, { x: snappedX, y: snappedY })
  }, [isDragging, selectedElement, currentLayout, dragStart, elementStart, zoom, canvasHeight, calculateSnapGuides, updateElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setSnapGuides([])
  }, [])

  // Get area bounds from points
  const getAreaBounds = useCallback((area: ImageArea) => {
    const xs = area.points.map(p => p.x)
    const ys = area.points.map(p => p.y)
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }, [])

  // Alignment functions
  const alignElements = useCallback((alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!currentLayout) return

    const visibleElements = Object.entries(currentLayout.elements).filter(([, el]) => el.visible)
    if (visibleElements.length === 0) return

    switch (alignment) {
      case "left":
        const minX = Math.min(...visibleElements.map(([, el]) => el.x))
        visibleElements.forEach(([id]) => updateElement(id, { x: minX }))
        break
      case "center":
        visibleElements.forEach(([id]) => updateElement(id, { x: CANVAS_WIDTH / 2 }))
        break
      case "right":
        const maxX = Math.max(...visibleElements.map(([, el]) => el.x))
        visibleElements.forEach(([id]) => updateElement(id, { x: maxX }))
        break
      case "top":
        const minY = Math.min(...visibleElements.map(([, el]) => el.y))
        visibleElements.forEach(([id]) => updateElement(id, { y: minY }))
        break
      case "middle":
        visibleElements.forEach(([id]) => updateElement(id, { y: canvasHeight / 2 }))
        break
      case "bottom":
        const maxY = Math.max(...visibleElements.map(([, el]) => el.y))
        visibleElements.forEach(([id]) => updateElement(id, { y: maxY }))
        break
    }
  }, [currentLayout, canvasHeight, updateElement])

  // Save layout
  const handleSave = async () => {
    if (!currentLayout) return
    setIsSaving(true)
    try {
      await updateLayout(currentLayout.id, {
        elements: currentLayout.elements,
        colors: currentLayout.colors,
        imageAreas: currentLayout.imageAreas,
      })
      onSave?.()
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch and embed Google Fonts CSS
  const fetchGoogleFontsCSS = async (): Promise<string> => {
    try {
      const fontFamilies = AVAILABLE_FONTS.map(f => f.google).join("&family=")
      const url = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`

      const response = await fetch(url, {
        headers: {
          // Use a user agent that requests woff2 fonts
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) return ""

      let css = await response.text()

      // Fetch and embed each font file as base64
      const fontUrlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g
      const matches = [...css.matchAll(fontUrlRegex)]

      for (const match of matches) {
        const fontUrl = match[1]
        try {
          const fontResponse = await fetch(fontUrl)
          const fontBlob = await fontResponse.blob()
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(fontBlob)
          })
          css = css.replace(fontUrl, base64)
        } catch {
          // Skip if font fetch fails
        }
      }

      return css
    } catch {
      return ""
    }
  }

  // Export image
  const handleExport = async () => {
    if (!canvasRef.current) {
      console.error("Canvas ref not found")
      alert("Erro: Canvas não encontrado")
      return
    }
    setIsExporting(true)
    try {
      // Wait for fonts to be fully loaded
      await document.fonts.ready

      // Fetch and embed fonts
      const fontCSS = await fetchGoogleFontsCSS()

      const dataUrl = await toPng(canvasRef.current, {
        quality: 1.0,
        width: CANVAS_WIDTH,
        height: canvasHeight,
        pixelRatio: 2,
        style: { transform: "none" },
        cacheBust: true,
        skipAutoScale: true,
        includeQueryParams: true,
        fontEmbedCSS: fontCSS || `
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        `,
      })

      if (!dataUrl) {
        throw new Error("Failed to generate image")
      }

      const link = document.createElement("a")
      link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onExport?.()
    } catch (error) {
      console.error("Export error:", error)
      // Try alternative export method using canvas
      try {
        const canvas = document.createElement("canvas")
        canvas.width = CANVAS_WIDTH * 2
        canvas.height = canvasHeight * 2
        const ctx = canvas.getContext("2d")
        if (ctx && canvasRef.current) {
          ctx.scale(2, 2)
          // Draw background color
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)

          // Use html2canvas as fallback
          const html2canvas = (await import("html2canvas")).default
          const capturedCanvas = await html2canvas(canvasRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
          })

          const dataUrl = capturedCanvas.toDataURL("image/png")
          const link = document.createElement("a")
          link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
          link.href = dataUrl
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          onExport?.()
        }
      } catch (fallbackError) {
        console.error("Fallback export also failed:", fallbackError)
        alert("Erro ao exportar imagem. Tente novamente.")
      }
    } finally {
      setIsExporting(false)
    }
  }

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                setSelectedFormat("story")
                const storyLayout = layouts.find(l => l.format === "story")
                if (storyLayout) setCurrentLayout(storyLayout)
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedFormat === "story" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
              }`}
            >
              Story
            </button>
            <button
              onClick={() => {
                setSelectedFormat("feed")
                const feedLayout = layouts.find(l => l.format === "feed")
                if (feedLayout) setCurrentLayout(feedLayout)
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedFormat === "feed" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
              }`}
            >
              Feed
            </button>
          </div>

          {/* Template Selector */}
          <select
            value={currentLayout?.id || ""}
            onChange={(e) => {
              const layout = filteredLayouts.find(l => l.id === e.target.value)
              if (layout) setCurrentLayout(layout)
            }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 max-w-[200px]"
          >
            {filteredLayouts.map(layout => (
              <option key={layout.id} value={layout.id}>
                {layout.name} {layout.isDefault ? "(Padrao)" : ""}
              </option>
            ))}
          </select>

          {/* Region Selector */}
          <div className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5">
            <span className="text-xs text-gray-300">Região</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionOption)}
              className="bg-transparent text-sm text-gray-200 focus:outline-none"
            >
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region} className="bg-gray-800">
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Set as Default Button */}
          <button
            onClick={async () => {
              if (currentLayout && !currentLayout.isDefault) {
                await setAsDefault(currentLayout.id)
                await fetchLayouts(selectedFormat)
              }
            }}
            disabled={currentLayout?.isDefault}
            className={`p-1.5 rounded transition-colors ${
              currentLayout?.isDefault
                ? "bg-yellow-600 text-white cursor-default"
                : "bg-gray-700 hover:bg-yellow-600 text-gray-300 hover:text-white"
            }`}
            title={currentLayout?.isDefault ? "Este é o template padrão" : "Definir como padrão"}
          >
            <Star className={`h-4 w-4 ${currentLayout?.isDefault ? "fill-current" : ""}`} />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
              className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(0.45)}
              className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
              title="Resetar zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Grid & Snap */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded ${showGrid ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"}`}
              title="Mostrar grade"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`p-1.5 rounded ${snapEnabled ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"}`}
              title="Snap to guides"
            >
              <Magnet className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button onClick={() => alignElements("left")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar esquerda">
              <AlignLeft className="h-4 w-4" />
            </button>
            <button onClick={() => alignElements("center")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar centro">
              <AlignCenter className="h-4 w-4" />
            </button>
            <button onClick={() => alignElements("right")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar direita">
              <AlignRight className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-gray-600" />
            <button onClick={() => alignElements("top")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar topo">
              <AlignStartVertical className="h-4 w-4" />
            </button>
            <button onClick={() => alignElements("middle")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar meio">
              <AlignCenterVertical className="h-4 w-4" />
            </button>
            <button onClick={() => alignElements("bottom")} className="p-1.5 hover:bg-gray-600 rounded text-gray-300" title="Alinhar base">
              <AlignEndVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Layers Panel */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {/* Text Elements Section */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">Elementos de Texto</h3>
          </div>
          <div className="p-2 space-y-1">
            {currentLayout && Object.entries(currentLayout.elements).map(([id, element]) => {
              const promoVisible = isElementVisibleByPromo(id)
              const isSelected = selectedElement === id

              return (
                <div
                  key={id}
                  onClick={() => setSelectedElement(id)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-600" : "hover:bg-gray-700"
                  } ${!promoVisible ? "opacity-40" : ""}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleElementVisibility(id)
                    }}
                    disabled={!promoVisible}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    {element.visible && promoVisible ? (
                      <Eye className="h-3.5 w-3.5 text-gray-300" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </button>
                  <span className="text-xs text-gray-300 flex-1 truncate">
                    {elementLabels[id] || id}
                  </span>
                  {!promoVisible && (
                    <span className="text-[10px] text-gray-500">N/A</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-900 p-8"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative mx-auto bg-white shadow-2xl"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: canvasHeight * zoom,
            }}
          >
            <div
              ref={canvasRef}
              className="absolute inset-0 origin-top-left"
              style={{
                width: CANVAS_WIDTH,
                height: canvasHeight,
                transform: `scale(${zoom})`,
              }}
              onClick={() => setSelectedElement(null)}
            >
              {/* Background Image */}
              {backgroundImage && (
                <img
                  src={backgroundImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              )}

              {/* Image Areas with NEGATIVE z-index (behind template) */}
              {currentLayout?.imageAreas?.filter(a => a.visible && a.zIndex < 0).sort((a, b) => a.zIndex - b.zIndex).map((area) => {
                const bounds = getAreaBounds(area)
                const hasImage = backgroundImage || area.imageUrl
                return (
                  <div
                    key={area.id}
                    className="absolute overflow-hidden"
                    style={{
                      left: bounds.x,
                      top: bounds.y,
                      width: bounds.width,
                      height: bounds.height,
                      zIndex: area.zIndex + 10,
                    }}
                  >
                    {(backgroundImage || area.imageUrl) && (
                      <img
                        src={area.imageUrl || backgroundImage || ""}
                        alt={area.name}
                        className="w-full h-full"
                        style={{ objectFit: area.fit }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                )
              })}

              {/* Layout Template */}
              {currentLayout.url && (
                <img
                  src={currentLayout.url}
                  alt="Layout"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ zIndex: 20 }}
                  crossOrigin="anonymous"
                />
              )}

              {/* Image Areas with POSITIVE z-index (in front of template) */}
              {currentLayout?.imageAreas?.filter(a => a.visible && a.zIndex >= 0).sort((a, b) => a.zIndex - b.zIndex).map((area) => {
                const bounds = getAreaBounds(area)
                const hasImage = backgroundImage || area.imageUrl
                return (
                  <div
                    key={area.id}
                    className="absolute overflow-hidden"
                    style={{
                      left: bounds.x,
                      top: bounds.y,
                      width: bounds.width,
                      height: bounds.height,
                      zIndex: area.zIndex + 30,
                    }}
                  >
                    {(backgroundImage || area.imageUrl) && (
                      <img
                        src={area.imageUrl || backgroundImage || ""}
                        alt={area.name}
                        className="w-full h-full"
                        style={{ objectFit: area.fit }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                )
              })}

              {/* Grid */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg width="100%" height="100%" className="opacity-20">
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fff" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  {/* Center lines */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-400 opacity-50" />
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-400 opacity-50" />
                </div>
              )}

              {/* Snap Guides */}
              {snapGuides.map((guide, i) => (
                <div
                  key={i}
                  className={`absolute bg-pink-500 ${guide.type === "vertical" ? "w-px h-full top-0" : "h-px w-full left-0"}`}
                  style={guide.type === "vertical" ? { left: guide.position } : { top: guide.position }}
                />
              ))}

              {/* Elements */}
              {currentLayout && Object.entries(currentLayout.elements).map(([id, element]) => {
                if (!element.visible || !isElementVisibleByPromo(id)) return null
                const content = getElementContent(id)
                if (!content) return null
                const isSelected = selectedElement === id

                return (
                  <div
                    key={id}
                    className={`absolute cursor-move select-none whitespace-nowrap ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent" : ""
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      color: element.color,
                      fontFamily: normalizeFontFamily(element.fontFamily),
                      zIndex: 50, // Above template and areas
                    }}
                    onMouseDown={(e) => handleMouseDown(id, e)}
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">
              {selectedElement ? elementLabels[selectedElement] || selectedElement : "Propriedades"}
            </h3>
          </div>

          {selectedElement && currentLayout?.elements[selectedElement] && (
            <div className="p-3 space-y-4">
              {/* Position */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Posicao</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500">X</span>
                    <input
                      type="number"
                      value={Math.round(currentLayout.elements[selectedElement].x)}
                      onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500">Y</span>
                    <input
                      type="number"
                      value={Math.round(currentLayout.elements[selectedElement].y)}
                      onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Tamanho da Fonte</label>
                <input
                  type="number"
                  value={currentLayout.elements[selectedElement].fontSize}
                  onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                  min="8"
                  max="200"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Fonte</label>
                <select
                  value={normalizeFontFamily(currentLayout.elements[selectedElement].fontFamily)}
                  onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                >
                  {AVAILABLE_FONTS.map(font => (
                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Peso da Fonte</label>
                <select
                  value={currentLayout.elements[selectedElement].fontWeight}
                  onChange={(e) => updateElement(selectedElement, { fontWeight: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                >
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extrabold</option>
                  <option value="900">Black</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Cor</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentLayout.elements[selectedElement].color}
                    onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                    className="w-10 h-8 rounded border border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentLayout.elements[selectedElement].color}
                    onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                  />
                </div>
              </div>

              {/* Quick Colors */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Cores Rapidas</label>
                <div className="flex gap-1 flex-wrap">
                  {["#FFFFFF", "#000000", "#F79E08", "#002043", "#DC2626", "#16A34A"].map(color => (
                    <button
                      key={color}
                      onClick={() => updateElement(selectedElement, { color })}
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedElement && (
            <div className="p-3 text-gray-400 text-sm">
              Selecione um elemento para editar suas propriedades
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
